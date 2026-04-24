// Edge Function: cron-cuotas
// Runs daily. On day 1 of each month, generates cuotas for active jugadores
// based on cuota_configuraciones. Every run also marks pending cuotas as
// "vencida" when fecha_vencimiento is in the past. Logs to cron_logs and
// raises notificaciones_admin when categories with active jugadores lack a
// cuota_configuracion.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClubResult {
  club_id: string;
  cuotas_generadas: number;
  duplicadas: number;
  beneficios: number;
  categorias_sin_config: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const today = new Date();
  const isFirstOfMonth = today.getUTCDate() === 1;
  // Allow forcing generation regardless of day via { force: true }
  let force = false;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      force = !!body?.force;
    }
  } catch (_) { /* noop */ }

  const periodo = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
  const todayISO = today.toISOString().slice(0, 10);

  const perClub: ClubResult[] = [];
  let totalGenerated = 0;
  let totalVencidas = 0;
  const errors: string[] = [];

  try {
    // 1) Mark vencidas (always, every run)
    const { data: vencidas, error: vErr } = await supabase
      .from("cuotas")
      .update({ estado: "vencida", updated_at: new Date().toISOString() })
      .eq("estado", "pendiente")
      .lt("fecha_vencimiento", todayISO)
      .select("id");
    if (vErr) errors.push(`vencidas: ${vErr.message}`);
    totalVencidas = vencidas?.length ?? 0;

    // 2) Generate cuotas only on day 1, unless forced
    if (isFirstOfMonth || force) {
      const { data: clubs, error: cErr } = await supabase
        .from("clubs")
        .select("id, nombre")
        .eq("activo", true);
      if (cErr) throw new Error(`clubs: ${cErr.message}`);

      for (const club of clubs ?? []) {
        const result = await processClub(supabase, club.id, periodo);
        perClub.push(result);
        totalGenerated += result.cuotas_generadas;

        // Notify admins about categories missing config
        for (const catNombre of result.categorias_sin_config) {
          await supabase.from("notificaciones_admin").insert({
            club_id: club.id,
            tipo: "cuota_sin_config",
            severidad: "warning",
            titulo: "Categoría sin configuración de cuota",
            mensaje: `La categoría "${catNombre}" tiene jugadores activos pero no posee una configuración de cuota activa. No se generaron cuotas para esta categoría en ${periodo}.`,
            metadata: { categoria: catNombre, periodo },
          });
        }
      }
    }

    await supabase.from("cron_logs").insert({
      job_name: "cron-cuotas",
      resultado: errors.length ? "warning" : "ok",
      clubes_procesados: perClub.length,
      cuotas_generadas: totalGenerated,
      cuotas_vencidas_actualizadas: totalVencidas,
      detalle: { periodo, isFirstOfMonth, force, perClub, errors },
    });

    return new Response(JSON.stringify({
      ok: true,
      periodo,
      isFirstOfMonth,
      force,
      cuotas_generadas: totalGenerated,
      cuotas_vencidas_actualizadas: totalVencidas,
      clubes_procesados: perClub.length,
      perClub,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("cron_logs").insert({
      job_name: "cron-cuotas",
      resultado: "error",
      clubes_procesados: perClub.length,
      cuotas_generadas: totalGenerated,
      cuotas_vencidas_actualizadas: totalVencidas,
      error: message,
      detalle: { periodo, isFirstOfMonth, force, perClub },
    });
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processClub(
  supabase: ReturnType<typeof createClient>,
  clubId: string,
  periodo: string,
): Promise<ClubResult> {
  const result: ClubResult = {
    club_id: clubId,
    cuotas_generadas: 0,
    duplicadas: 0,
    beneficios: 0,
    categorias_sin_config: [],
  };

  const [year, month] = periodo.split("-").map(Number);
  const todayISO = new Date().toISOString().slice(0, 10);

  // Active configs for this club, valid today
  const { data: configsRaw } = await supabase
    .from("cuota_configuraciones")
    .select("*")
    .eq("club_id", clubId)
    .eq("activa", true);
  const configs = (configsRaw ?? []).filter((c: any) => {
    if (c.fecha_inicio && c.fecha_inicio > todayISO) return false;
    if (c.fecha_fin && c.fecha_fin < todayISO) return false;
    return true;
  });
  const configByCat: Record<string, any> = {};
  configs.forEach((c: any) => { if (c.categoria_id) configByCat[c.categoria_id] = c; });

  // Categories of this club
  const { data: cats } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("club_id", clubId);
  if (!cats?.length) return result;

  // persona_categoria for these cats
  const catIds = cats.map((c: any) => c.id);
  const { data: pcRows } = await supabase
    .from("persona_categoria")
    .select("persona_id, categoria_id")
    .in("categoria_id", catIds);
  const pairs = pcRows ?? [];
  if (!pairs.length) return result;

  // Active jugadores
  const personaIds = [...new Set(pairs.map((p: any) => p.persona_id))];
  const { data: jugadores } = await supabase
    .from("personas")
    .select("id")
    .in("id", personaIds)
    .eq("tipo_persona", "jugador")
    .eq("estado", "activo");
  const activeSet = new Set((jugadores ?? []).map((j: any) => j.id));
  const activePairs = pairs.filter((p: any) => activeSet.has(p.persona_id));

  // Detect categories with active jugadores but no config
  const catsWithJugadores = new Set(activePairs.map((p: any) => p.categoria_id));
  for (const cat of cats) {
    if (catsWithJugadores.has((cat as any).id) && !configByCat[(cat as any).id]) {
      result.categorias_sin_config.push((cat as any).nombre);
    }
  }

  const generablePairs = activePairs.filter((p: any) => configByCat[p.categoria_id]);
  if (!generablePairs.length) return result;

  // Avoid duplicates
  const { data: existing } = await supabase
    .from("cuotas")
    .select("persona_id, categoria_id")
    .eq("periodo", periodo)
    .eq("club_id", clubId);
  const existingKeys = new Set((existing ?? []).map((e: any) => `${e.persona_id}_${e.categoria_id}`));
  const newPairs = generableP airs.filter((p: any) => !existingKeys.has(`${p.persona_id}_${p.categoria_id}`));
  result.duplicadas = generableP airs.length - newPairs.length;
  if (!newPairs.length) return result;

  // Apoderado map
  const uniquePersonas = [...new Set(newPairs.map((p: any) => p.persona_id))];
  const { data: relaciones } = await supabase
    .from("persona_relaciones")
    .select("persona_id, relacionado_id")
    .in("persona_id", uniquePersonas);
  const apoMap: Record<string, string> = {};
  (relaciones ?? []).forEach((r: any) => { if (!apoMap[r.persona_id]) apoMap[r.persona_id] = r.relacionado_id; });

  // Beneficios
  const { data: beneficios } = await supabase
    .from("beneficios_cuota")
    .select("*")
    .in("persona_id", uniquePersonas)
    .eq("activo", true);
  const benMap: Record<string, any> = {};
  (beneficios ?? []).forEach((b: any) => {
    if (!benMap[b.persona_id] || b.valor > benMap[b.persona_id].valor) {
      benMap[b.persona_id] = b;
    }
  });

  const cuotasToInsert = newPairs.map((pair: any) => {
    const config = configByCat[pair.categoria_id];
    const dia = Math.min(config.dia_vencimiento ?? 10, 28);
    const vencimiento = `${year}-${String(month).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    let descuento = 0;
    const ben = benMap[pair.persona_id];
    if (ben) {
      result.beneficios++;
      if (ben.tipo_beneficio === "exencion") descuento = config.monto_base;
      else if (ben.valor_tipo === "porcentaje") descuento = Math.round(config.monto_base * ben.valor / 100);
      else descuento = ben.valor;
    }
    const montoFinal = Math.max(0, config.monto_base - descuento);
    return {
      club_id: clubId,
      persona_id: pair.persona_id,
      apoderado_id: apoMap[pair.persona_id] || null,
      categoria_id: pair.categoria_id,
      configuracion_id: config.id,
      periodo,
      fecha_emision: todayISO,
      fecha_vencimiento: vencimiento,
      monto_original: config.monto_base,
      descuento,
      recargo: 0,
      monto_final: montoFinal,
      estado: "pendiente",
    };
  });

  const { error: insErr } = await supabase.from("cuotas").insert(cuotasToInsert);
  if (insErr) throw new Error(`insert cuotas club ${clubId}: ${insErr.message}`);
  result.cuotas_generadas = cuotasToInsert.length;
  return result;
}
