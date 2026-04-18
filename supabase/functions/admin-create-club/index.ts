import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const symbols = "!@#$%&*";
  let pwd = "";
  for (let i = 0; i < length - 2; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];
  pwd += Math.floor(Math.random() * 10);
  return pwd;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is super admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("platform_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Solo super_admin puede crear clubes" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { nombre, email, plan_id, fecha_vencimiento, deporte, ciudad, full_name } = body;
    if (!nombre || !email) {
      return new Response(JSON.stringify({ error: "nombre y email son obligatorios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. Create club
    const { data: clubRow, error: clubErr } = await admin
      .from("clubs")
      .insert({ nombre, email, deporte: deporte || "Básquetbol", ciudad: ciudad || null })
      .select("id")
      .single();
    if (clubErr) throw clubErr;
    const clubId = clubRow.id;

    // 2. Create or reuse auth user
    const tempPassword = generatePassword(12);
    let userId: string;
    let userCreated = false;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: full_name || nombre },
    });

    if (createErr) {
      // User likely exists - find them
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        // rollback club
        await admin.from("clubs").delete().eq("id", clubId);
        throw createErr;
      }
      userId = existing.id;
    } else {
      userId = created.user.id;
      userCreated = true;
    }

    // 3. Link user as admin of new club
    const { error: linkErr } = await admin
      .from("club_usuarios")
      .insert({ user_id: userId, club_id: clubId, rol_sistema: "admin", activo: true });
    if (linkErr) {
      await admin.from("clubs").delete().eq("id", clubId);
      throw linkErr;
    }

    // 4. Create subscription
    const { error: subErr } = await admin.from("suscripciones_club").insert({
      club_id: clubId,
      plan_id: plan_id || null,
      estado: plan_id ? "activo" : "trial",
      ciclo_facturacion: "mensual",
      fecha_vencimiento: fecha_vencimiento || null,
    });
    if (subErr) throw subErr;

    return new Response(
      JSON.stringify({
        club_id: clubId,
        user_id: userId,
        email,
        temp_password: userCreated ? tempPassword : null,
        user_created: userCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("admin-create-club error", e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
