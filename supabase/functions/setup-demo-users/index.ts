import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEMO_USERS = [
  { email: "bodeguero@helados.test", password: "helados123", full_name: "Carlos Bodega", role: "bodeguero" },
  { email: "vendedor@helados.test", password: "helados123", full_name: "Ana Torres", role: "vendedor" },
  { email: "gerente@helados.test", password: "helados123", full_name: "Marta Rivas", role: "gerente" },
  { email: "cliente@helados.test", password: "helados123", full_name: "Pedro León", role: "cliente" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const debug: string[] = [];
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    debug.push(`url=${supabaseUrl ? "yes" : "no"} key=${serviceRoleKey ? "yes" : "no"}`);

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing env vars", debug }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<Record<string, unknown>> = [];

    for (const demo of DEMO_USERS) {
      // Try createUser directly — if user exists, updateUserById to reset password
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name },
      });

      if (createError) {
        // User likely exists — find and reset password
        const errMsg = createError.message;
        debug.push(`${demo.email}: createError="${errMsg}"`);

        // List users to find existing one
        const { data: listData, error: listError } = await admin.auth.admin.listUsers();
        if (listError) {
          debug.push(`${demo.email}: listError="${listError.message}"`);
          results.push({ email: demo.email, status: "list_failed", error: errMsg });
          continue;
        }

        const existing = listData?.users?.find((u: { email: string }) => u.email === demo.email);
        if (!existing) {
          debug.push(`${demo.email}: not found in list`);
          results.push({ email: demo.email, status: "not_found", error: errMsg });
          continue;
        }

        const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
          password: demo.password,
          email_confirm: true,
        });

        if (updateError) {
          debug.push(`${demo.email}: updateError="${updateError.message}"`);
          results.push({ email: demo.email, status: "update_failed", error: updateError.message });
        } else {
          debug.push(`${demo.email}: password_reset_ok`);
          results.push({ email: demo.email, status: "password_reset_ok" });
        }
        continue;
      }

      if (!createData.user) {
        results.push({ email: demo.email, status: "no_user_returned" });
        continue;
      }

      // Upsert profile
      const { error: profileError } = await admin.from("profiles").upsert({
        id: createData.user.id,
        full_name: demo.full_name,
        email: demo.email,
        role: demo.role,
        is_active: true,
      });
      debug.push(`${demo.email}: profile=${profileError ? profileError.message : "ok"}`);

      results.push({ email: demo.email, status: "created", userId: createData.user.id });
    }

    return new Response(JSON.stringify({ ok: true, results, debug }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), debug, stack: err?.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
