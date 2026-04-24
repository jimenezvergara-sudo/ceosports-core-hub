import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface MovimientoBanco {
  fecha: string;
  monto: number;
  glosa: string;
  tipo: "abono" | "cargo" | "desconocido";
}

interface CuotaCandidata {
  cuota_id: string;
  persona_id: string;
  persona_nombre: string;
  apoderado_nombre: string | null;
  apoderado_rut: string | null;
  monto_final: number;
  periodo: string;
  fecha_vencimiento: string;
}

interface MatchResult {
  movimiento: MovimientoBanco;
  tipo_match: "auto" | "posible" | "ninguno";
  cuota_match?: CuotaCandidata;
  candidatos?: CuotaCandidata[];
}

// === HELPERS ===

function normalizarRut(rut: string | null | undefined): string {
  if (!rut) return "";
  return rut.toString().replace(/[.\s-]/g, "").toUpperCase();
}

function normalizarTexto(t: string): string {
  return t
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rutEnGlosa(glosa: string, rut: string): boolean {
  if (!rut) return false;
  const rutNorm = normalizarRut(rut);
  if (rutNorm.length < 7) return false;
  const cuerpo = rutNorm.slice(0, -1);
  const glosaNorm = glosa.replace(/[.\s-]/g, "").toUpperCase();
  return glosaNorm.includes(cuerpo) || glosaNorm.includes(rutNorm);
}

function nombreEnGlosa(glosa: string, nombreCompleto: string): boolean {
  if (!nombreCompleto) return false;
  const glosaNorm = normalizarTexto(glosa);
  const partes = normalizarTexto(nombreCompleto)
    .split(" ")
    .filter((p) => p.length >= 3);
  if (partes.length === 0) return false;
  // Match si al menos 2 palabras (o todas si hay menos) están en la glosa
  const minMatches = Math.min(2, partes.length);
  const found = partes.filter((p) => glosaNorm.includes(p)).length;
  return found >= minMatches;
}

// === DETECCIÓN DE COLUMNAS ===

const HEADER_KEYS = {
  fecha: ["fecha", "date", "f.movimiento", "fecha mov", "fecha movimiento", "fecha operacion"],
  monto: ["monto", "abono", "credito", "haber", "depositos", "deposito", "ingreso", "valor"],
  cargo: ["cargo", "debito", "debe", "egreso"],
  glosa: ["glosa", "descripcion", "detalle", "concepto", "observacion", "referencia", "movimiento"],
};

function detectarColumnas(headers: string[]): {
  fecha: number;
  monto: number;
  cargo: number;
  glosa: number;
} {
  const norm = headers.map((h) => normalizarTexto(h ?? ""));
  const find = (keys: string[]) =>
    norm.findIndex((h) => keys.some((k) => h.includes(k)));
  return {
    fecha: find(HEADER_KEYS.fecha),
    monto: find(HEADER_KEYS.monto),
    cargo: find(HEADER_KEYS.cargo),
    glosa: find(HEADER_KEYS.glosa),
  };
}

function detectarBanco(headers: string[], primeraFila: string): string {
  const todo = (headers.join(" ") + " " + primeraFila).toLowerCase();
  if (todo.includes("bancoestado") || todo.includes("banco estado")) return "BancoEstado";
  if (todo.includes("santander")) return "Santander";
  if (todo.includes("scotiabank")) return "Scotiabank";
  if (todo.includes("bci")) return "BCI";
  if (todo.includes("banco de chile") || todo.includes("bancochile")) return "Banco de Chile";
  return "Genérico";
}

// === PARSER CSV/EXCEL (recibimos array de filas ya parseado del cliente) ===

function parseMonto(valor: any): number {
  if (valor === null || valor === undefined || valor === "") return 0;
  const s = valor.toString().replace(/[\$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(Math.abs(n));
}

function parseFecha(valor: any): string {
  if (!valor) return "";
  const s = valor.toString().trim();
  // dd/mm/yyyy o dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // ISO ya
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

// === HANDLER ===

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, club_id, filas, nombre_archivo, matches_confirmados, user_id } = body;

    // === ACCIÓN 1: ANALIZAR ARCHIVO ===
    if (action === "analizar") {
      if (!club_id || !Array.isArray(filas) || filas.length < 2) {
        return new Response(
          JSON.stringify({ error: "Parámetros inválidos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Encontrar fila de headers (primera con texto)
      let headerIdx = 0;
      for (let i = 0; i < Math.min(filas.length, 10); i++) {
        const fila = filas[i];
        if (Array.isArray(fila) && fila.some((c: any) => typeof c === "string" && c.length > 2)) {
          headerIdx = i;
          break;
        }
      }

      const headers = (filas[headerIdx] as any[]).map((h) => (h ?? "").toString());
      const cols = detectarColumnas(headers);
      const banco = detectarBanco(headers, JSON.stringify(filas[headerIdx + 1] ?? ""));

      if (cols.fecha < 0 || cols.glosa < 0 || (cols.monto < 0 && cols.cargo < 0)) {
        return new Response(
          JSON.stringify({
            error: "No se pudieron detectar las columnas necesarias (fecha, monto/abono, glosa)",
            headers_detectados: headers,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extraer movimientos de abono
      const movimientos: MovimientoBanco[] = [];
      for (let i = headerIdx + 1; i < filas.length; i++) {
        const fila = filas[i] as any[];
        if (!Array.isArray(fila) || fila.length === 0) continue;

        const fecha = parseFecha(fila[cols.fecha]);
        const glosa = (fila[cols.glosa] ?? "").toString().trim();
        const abono = cols.monto >= 0 ? parseMonto(fila[cols.monto]) : 0;
        const cargo = cols.cargo >= 0 ? parseMonto(fila[cols.cargo]) : 0;

        if (!fecha || (!abono && !cargo)) continue;
        // Solo nos interesan abonos (ingresos)
        if (abono > 0) {
          movimientos.push({ fecha, monto: abono, glosa, tipo: "abono" });
        }
      }

      // Cargar cuotas pendientes/parciales/vencidas del club + datos del apoderado
      const { data: cuotas, error: cuotasError } = await supabase
        .from("cuotas")
        .select(`
          id, persona_id, monto_final, periodo, fecha_vencimiento, estado,
          personas!cuotas_persona_id_fkey(nombre, apellido, rut),
          persona_detalle:personas!cuotas_persona_id_fkey(persona_detalle(apoderado_nombre, apoderado_apellido, apoderado_rut, padre_nombre, padre_apellido, padre_rut, madre_nombre, madre_apellido, madre_rut))
        `)
        .eq("club_id", club_id)
        .in("estado", ["pendiente", "parcial", "vencida"]);

      if (cuotasError) throw cuotasError;

      const candidatas: CuotaCandidata[] = (cuotas ?? []).map((c: any) => {
        const detalle = c.persona_detalle?.persona_detalle?.[0] ?? c.persona_detalle?.[0] ?? null;
        const apoderadoNombre = detalle?.apoderado_nombre
          ? `${detalle.apoderado_nombre} ${detalle.apoderado_apellido ?? ""}`.trim()
          : detalle?.padre_nombre
          ? `${detalle.padre_nombre} ${detalle.padre_apellido ?? ""}`.trim()
          : detalle?.madre_nombre
          ? `${detalle.madre_nombre} ${detalle.madre_apellido ?? ""}`.trim()
          : null;
        const apoderadoRut =
          detalle?.apoderado_rut ?? detalle?.padre_rut ?? detalle?.madre_rut ?? null;
        return {
          cuota_id: c.id,
          persona_id: c.persona_id,
          persona_nombre: `${c.personas?.nombre ?? ""} ${c.personas?.apellido ?? ""}`.trim(),
          apoderado_nombre: apoderadoNombre,
          apoderado_rut: apoderadoRut,
          monto_final: c.monto_final,
          periodo: c.periodo,
          fecha_vencimiento: c.fecha_vencimiento,
        };
      });

      // Match
      const usadas = new Set<string>();
      const resultados: MatchResult[] = movimientos.map((mov) => {
        const mismoMonto = candidatas.filter(
          (c) => c.monto_final === mov.monto && !usadas.has(c.cuota_id)
        );

        // Match automático: monto + (RUT en glosa O nombre apoderado en glosa)
        const auto = mismoMonto.find((c) => {
          const rutOk = c.apoderado_rut && rutEnGlosa(mov.glosa, c.apoderado_rut);
          const nameOk = c.apoderado_nombre && nombreEnGlosa(mov.glosa, c.apoderado_nombre);
          const personaOk = nombreEnGlosa(mov.glosa, c.persona_nombre);
          return rutOk || nameOk || personaOk;
        });

        if (auto) {
          usadas.add(auto.cuota_id);
          return { movimiento: mov, tipo_match: "auto", cuota_match: auto };
        }

        if (mismoMonto.length > 0) {
          return {
            movimiento: mov,
            tipo_match: "posible",
            candidatos: mismoMonto.slice(0, 5),
          };
        }

        return { movimiento: mov, tipo_match: "ninguno" };
      });

      const stats = {
        total: resultados.length,
        auto: resultados.filter((r) => r.tipo_match === "auto").length,
        posibles: resultados.filter((r) => r.tipo_match === "posible").length,
        ninguno: resultados.filter((r) => r.tipo_match === "ninguno").length,
      };

      return new Response(
        JSON.stringify({ banco, headers_detectados: headers, resultados, stats }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === ACCIÓN 2: CONFIRMAR Y APLICAR PAGOS ===
    if (action === "confirmar") {
      if (!club_id || !Array.isArray(matches_confirmados)) {
        return new Response(
          JSON.stringify({ error: "Parámetros inválidos" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let conciliadas = 0;
      let monto_total = 0;
      const errores: any[] = [];

      for (const m of matches_confirmados) {
        const { cuota_id, monto, fecha, glosa } = m;
        if (!cuota_id || !monto) continue;

        const { error } = await supabase.from("pagos_cuotas").insert({
          cuota_id,
          monto_pagado: monto,
          fecha_pago: fecha,
          metodo_pago: "Transferencia",
          referencia: "Reconciliación bancaria",
          observaciones: `Glosa: ${glosa ?? ""}`.slice(0, 500),
          club_id,
        });

        if (error) {
          errores.push({ cuota_id, error: error.message });
        } else {
          conciliadas++;
          monto_total += Number(monto);
        }
      }

      // Log de reconciliación
      await supabase.from("reconciliaciones_banco").insert({
        club_id,
        ejecutado_por: user_id ?? null,
        nombre_archivo: nombre_archivo ?? "extracto.csv",
        banco_detectado: body.banco ?? null,
        total_movimientos: body.stats?.total ?? matches_confirmados.length,
        identificados_auto: body.stats?.auto ?? 0,
        posibles_coincidencias: body.stats?.posibles ?? 0,
        no_identificados: body.stats?.ninguno ?? 0,
        cuotas_conciliadas: conciliadas,
        monto_conciliado: monto_total,
        detalle: { matches_confirmados, errores },
      });

      return new Response(
        JSON.stringify({ success: true, conciliadas, monto_total, errores }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Acción no válida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("reconciliacion-banco error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
