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

const seedNotifications: Record<string, Array<{ title: string; message: string; category: string; priority: string }>> = {
  bodeguero: [
    { title: "Stock crítico", message: "Paleta Cremosa Chocolate bajó a 18 unidades (reorden: 20).", category: "stock", priority: "alta" },
    { title: "Lote por vencer", message: "Sandwich Helado Nata vence el 2026-11-28.", category: "stock", priority: "media" },
  ],
  vendedor: [
    { title: "Pedido pendiente", message: "El pedido o001 de Minimarket La Esquina espera confirmación.", category: "pedido", priority: "normal" },
    { title: "Recompra sugerida", message: "Cafetería Dulce Frío está próxima a agotar stock.", category: "recompra", priority: "media" },
  ],
  gerente: [
    { title: "Solicitud de reabastecimiento", message: "La solicitud r001 ($625.00) requiere aprobación.", category: "pedido", priority: "alta" },
    { title: "Rotación semanal", message: "Paleta Cremosa Chocolate lidera ventas con 320 unidades.", category: "sistema", priority: "normal" },
  ],
  cliente: [
    { title: "Bienvenido", message: "Tu cuenta fue creada. Explora el catálogo 3D / RA.", category: "sistema", priority: "normal" },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing env vars", hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<{ email: string; status: string; role: string; detail?: string }> = [];

    for (const demo of DEMO_USERS) {
      // Try to create the user directly. If they already exist, we'll get an error
      // and then try to update their password via listUsers + updateUserById.
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name },
      });

      if (createError) {
        // User might already exist — try to find and reset password
        if (createError.message.includes("already") || createError.message.includes("registered") || createError.message.includes("exists")) {
          // Search through all users
          let foundUserId: string | null = null;
          let page = 1;
          for (let i = 0; i < 10 && !foundUserId; i++) {
            const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
            if (listError || !listData?.users) break;
            const found = listData.users.find((u: { email: string }) => u.email === demo.email);
            if (found) {
              foundUserId = found.id;
            } else if (listData.users.length < 1000) {
              break;
            } else {
              page++;
            }
          }

          if (foundUserId) {
            const { error: updateError } = await admin.auth.admin.updateUserById(foundUserId, {
              password: demo.password,
              email_confirm: true,
            });
            results.push({
              email: demo.email,
              status: updateError ? `reset_failed: ${updateError.message}` : "password_reset_ok",
              role: demo.role,
              detail: updateError?.message,
            });
          } else {
            results.push({ email: demo.email, status: "exists_but_not_found", role: demo.role, detail: createError.message });
          }
        } else {
          results.push({ email: demo.email, status: "create_error", role: demo.role, detail: createError.message });
        }
        continue;
      }

      if (!createData.user) {
        results.push({ email: demo.email, status: "no_user_returned", role: demo.role });
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

      if (profileError) {
        results.push({ email: demo.email, status: "profile_error", role: demo.role, detail: profileError.message });
        continue;
      }

      // Seed notifications
      const notes = seedNotifications[demo.role] ?? [];
      if (notes.length) {
        const rows = notes.map((n) => ({
          user_id: createData.user.id,
          title: n.title,
          message: n.message,
          category: n.category,
          priority: n.priority,
        }));
        await admin.from("notifications").upsert(rows, { onConflict: "user_id,title" });
      }

      results.push({ email: demo.email, status: "created", role: demo.role });
    }

    return new Response(JSON.stringify({ ok: true, users: results }), {
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
