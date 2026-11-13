import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<{ email: string; status: string; role: string }> = [];

    for (const demo of DEMO_USERS) {
      // List all users to find existing ones by email
      const { data: userList } = await admin.auth.admin.listUsers();
      const existingUser = userList?.users?.find((u: { email: string }) => u.email === demo.email);

      if (existingUser) {
        // Force password reset through Admin API (GoTrue-native hashing)
        const { error: updateError } = await admin.auth.admin.updateUserById(
          existingUser.id,
          { password: demo.password, email_confirm: true },
        );
        results.push({
          email: demo.email,
          status: updateError ? `password_reset_failed: ${updateError.message}` : "password_reset_ok",
          role: demo.role,
        });
        continue;
      }

      // Create user through Admin API so GoTrue hashes the password correctly
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name },
      });

      if (authError || !authData.user) {
        results.push({ email: demo.email, status: `auth_error: ${authError?.message ?? "unknown"}`, role: demo.role });
        continue;
      }

      // Upsert profile
      const { error: profileError } = await admin.from("profiles").upsert({
        id: authData.user.id,
        full_name: demo.full_name,
        email: demo.email,
        role: demo.role,
        is_active: true,
      });

      if (profileError) {
        results.push({ email: demo.email, status: `profile_error: ${profileError.message}`, role: demo.role });
        continue;
      }

      // Seed notifications
      const notes = seedNotifications[demo.role] ?? [];
      if (notes.length) {
        const rows = notes.map((n) => ({
          user_id: authData.user.id,
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
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
