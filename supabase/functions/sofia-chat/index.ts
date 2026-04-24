import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GUIDE = `
GUÍA DE LA PLATAFORMA CEO Sports (cómo usar cada módulo):

• Registrar una compra: ir a "Compras" → "Nueva Solicitud". Completar título, descripción, monto estimado, categoría y proveedor sugerido. La solicitud pasa por aprobación según el monto (niveles definidos en Compras → Configuración). Luego el responsable la ejecuta y registra el comprobante. Esto genera automáticamente una transacción de Egreso.
• Convocar una asamblea: ir a "Asambleas" → "Nueva asamblea". Definir tipo (ordinaria/extraordinaria), fecha, lugar, tabla. Adjuntar la tabla. Después de la reunión, registrar asistencia, acuerdos y subir el acta.
• Configurar cuotas: ir a "Cuotas" → pestaña "Configuración" → "Nueva configuración". Definir nombre, monto base, frecuencia, día de vencimiento y categoría destino. Luego desde "Bandeja" usar "Generar cuotas" para crearlas masivamente por periodo.
• Registrar un pago de cuota: en "Cuotas" → "Bandeja", buscar la cuota, abrir detalle y "Registrar pago" (o usar "Pago rápido"). Esto crea automáticamente una transacción de Ingreso y actualiza el estado.
• Registrar una persona: ir a "Personas" → "Nueva persona". Completar datos básicos; el detalle extendido (apoderado, padre, madre, salud) se edita desde la ficha de la persona.
• Importación masiva de personas: en "Personas" → "Importar". Subir Excel; la deduplicación se hace por RUT.
• Subir documentos personales: desde la ficha de Persona → "Documentos". Documentos institucionales del club: "Organización" → "Documentos del club".
• Registrar un proveedor: "Proveedores" → "Nuevo proveedor". Después de cada compra se puede evaluar (precio, calidad, plazo).
• Crear un proyecto: "Proyectos" → "Nuevo proyecto". Definir presupuesto, fechas y responsable. Las compras pueden vincularse al proyecto.
• Registrar staff: "Staff" → "Nuevo miembro". Asignar rol y permisos por módulo.
`;

async function loadClubContext(supabase: any, clubId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [
    cuotasMorosas,
    transacciones,
    proyectosActivos,
    solicitudesPendientes,
    documentosVencen,
    sociosActivos,
    cuotasMes,
  ] = await Promise.all([
    supabase
      .from("cuotas")
      .select("id, persona_id, monto_final, periodo, fecha_vencimiento, estado, personas:persona_id(nombre, apellido)")
      .eq("club_id", clubId)
      .in("estado", ["pendiente", "vencida", "parcial"])
      .lt("fecha_vencimiento", today)
      .limit(50),
    supabase
      .from("transacciones")
      .select("tipo, monto, fecha, estado")
      .eq("club_id", clubId)
      .gte("fecha", monthStart),
    supabase
      .from("proyectos")
      .select("id, nombre, estado, presupuesto, fecha_fin")
      .eq("club_id", clubId)
      .neq("estado", "cerrado")
      .limit(20),
    supabase
      .from("solicitudes_compra")
      .select("id, titulo, monto_estimado, estado, created_at, prioridad")
      .eq("club_id", clubId)
      .in("estado", ["enviada", "en revisión", "aprobada"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("club_documentos")
      .select("nombre, fecha_vencimiento, etiqueta")
      .eq("club_id", clubId)
      .not("fecha_vencimiento", "is", null)
      .gte("fecha_vencimiento", today)
      .lte("fecha_vencimiento", new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10))
      .limit(30),
    supabase
      .from("libro_socios")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("estado", "activo"),
    supabase
      .from("cuotas")
      .select("estado, monto_final")
      .eq("club_id", clubId)
      .gte("fecha_emision", monthStart),
  ]);

  // Aggregations
  const trx = transacciones.data ?? [];
  const ingresos = trx.filter((t: any) => t.tipo === "Ingreso" && t.estado === "Pagado").reduce((s: number, t: any) => s + Number(t.monto || 0), 0);
  const egresos = trx.filter((t: any) => t.tipo === "Egreso" && t.estado === "Pagado").reduce((s: number, t: any) => s + Number(t.monto || 0), 0);
  const balance = ingresos - egresos;

  const morosos = (cuotasMorosas.data ?? []).map((c: any) => ({
    persona: c.personas ? `${c.personas.nombre} ${c.personas.apellido}` : "—",
    periodo: c.periodo,
    monto: c.monto_final,
    vence: c.fecha_vencimiento,
    estado: c.estado,
  }));

  const cuotasMesData = cuotasMes.data ?? [];
  const cuotasResumen = {
    total: cuotasMesData.length,
    pagadas: cuotasMesData.filter((c: any) => c.estado === "pagada").length,
    pendientes: cuotasMesData.filter((c: any) => c.estado === "pendiente").length,
    vencidas: cuotasMesData.filter((c: any) => c.estado === "vencida").length,
    monto_total: cuotasMesData.reduce((s: number, c: any) => s + Number(c.monto_final || 0), 0),
  };

  return {
    fecha_hoy: today,
    finanzas_mes: { ingresos, egresos, balance },
    morosos_total: morosos.length,
    morosos_lista: morosos.slice(0, 15),
    proyectos_activos: proyectosActivos.data ?? [],
    solicitudes_pendientes: solicitudesPendientes.data ?? [],
    documentos_proximos_vencer: documentosVencen.data ?? [],
    socios_activos: sociosActivos.count ?? 0,
    cuotas_mes_actual: cuotasResumen,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, clubId, clubNombre, rolUsuario, userName } = await req.json();
    if (!Array.isArray(messages) || !clubId) {
      return new Response(JSON.stringify({ error: "messages y clubId son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to load club context (RLS already enforced upstream by clubId from auth context)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the requesting user belongs to the club
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: membership } = await supabase
      .from("club_usuarios")
      .select("id")
      .eq("user_id", user.id)
      .eq("club_id", clubId)
      .eq("activo", true)
      .maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: "No perteneces a este club" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = await loadClubContext(supabase, clubId);

    const systemPrompt = `Eres **Isa**, la asistente IA de la plataforma CEO Sports. Ayudas a dirigentes de clubes deportivos.

CLUB ACTUAL: ${clubNombre ?? "—"}
USUARIO: ${userName ?? "—"} (rol: ${rolUsuario ?? "—"})
FECHA: ${ctx.fecha_hoy}

Tienes dos capacidades:
1. **GUÍA**: explicar cómo usar la plataforma (registrar compras, asambleas, cuotas, pagos, etc.).
2. **DATOS**: responder con datos reales del club que se entregan abajo.

REGLAS:
- Responde SIEMPRE en español, en formato markdown (usa listas, **negritas**, tablas cuando ayuden).
- Sé concisa y directa. No inventes datos: si la respuesta no está en el contexto ni en la guía, dilo y sugiere dónde encontrarla.
- Para montos usa formato CLP (ej: $1.250.000).
- Si te preguntan algo fuera del alcance del club deportivo, redirige amablemente.

=== GUÍA DE LA PLATAFORMA ===
${GUIDE}

=== DATOS ACTUALES DEL CLUB (JSON) ===
${JSON.stringify(ctx, null, 2)}
`;

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages.map((m: Msg) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      console.error("Anthropic error", anthropicResp.status, errText);
      return new Response(JSON.stringify({ error: `Error IA (${anthropicResp.status})`, detail: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicResp.json();
    const reply = data?.content?.[0]?.text ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sofia-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
