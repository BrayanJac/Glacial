import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEMO_USERS = [
  { email: "bodeguero@helados.test", password: "Helados2026!", full_name: "Carlos Bodega", role: "bodeguero" },
  { email: "vendedor@helados.test", password: "Helados2026!", full_name: "Ana Torres", role: "vendedor" },
  { email: "gerente@helados.test", password: "Helados2026!", full_name: "Marta Rivas", role: "gerente" },
  { email: "cliente@helados.test", password: "Helados2026!", full_name: "Pedro León", role: "cliente" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<Record<string, unknown>> = [];

    for (const demo of DEMO_USERS) {
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name },
      });

      if (createError) {
        // User might already exist - try to find and reset password
        const { data: listData, error: listError } = await admin.auth.admin.listUsers();
        if (listError) {
          results.push({ email: demo.email, status: "list_failed", error: listError.message });
          continue;
        }
        const existing = listData?.users?.find((u: { email: string }) => u.email === demo.email);
        if (existing) {
          const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
            password: demo.password,
            email_confirm: true,
          });
          results.push({ email: demo.email, status: updateErr ? "reset_failed" : "password_reset_ok", error: updateErr?.message });
        } else {
          results.push({ email: demo.email, status: "create_failed", error: createError.message });
        }
        continue;
      }

      if (!createData.user) {
        results.push({ email: demo.email, status: "no_user_returned" });
        continue;
      }

      // Upsert profile
      await admin.from("profiles").upsert({
        id: createData.user.id,
        full_name: demo.full_name,
        email: demo.email,
        role: demo.role,
        is_active: true,
      });

      results.push({ email: demo.email, status: "created", uid: createData.user.id });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), stack: err?.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
