import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYNTH_DOMAIN = "cafe.quickmenuhub.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", claims.claims.sub).maybeSingle();
    if (role?.role !== "super_admin") return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const required = ["brand_name", "username", "password", "email"];
    for (const k of required) if (!body[k]) return json({ error: `Missing ${k}` }, 400);
    const username = String(body.username).toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) return json({ error: "Username must be 3+ chars" }, 400);

    const synthEmail = `${username}@${SYNTH_DOMAIN}`;

    // Create auth user
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: synthEmail,
      password: body.password,
      email_confirm: true,
      user_metadata: { username, brand_name: body.brand_name, contact_email: body.email },
    });
    if (cErr) return json({ error: cErr.message }, 400);
    const newUserId = created.user!.id;

    // Slug
    const baseSlug = String(body.brand_name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let slug = baseSlug || username;
    let n = 0;
    while (true) {
      const { data: ex } = await admin.from("restaurants").select("id").eq("slug", slug).maybeSingle();
      if (!ex) break;
      n++;
      slug = `${baseSlug}-${n}`;
    }

    // Insert restaurant
    const { data: cafe, error: rErr } = await admin.from("restaurants").insert({
      name: body.brand_name,
      slug,
      owner_id: newUserId,
      username,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      gst_number: body.gst_number || null,
      website_url: body.website_url || null,
      upi_id: body.upi_id || null,
      tagline: body.tagline || "Fresh • Local • Delicious",
      subscription_status: "pending",
    }).select().single();
    if (rErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: rErr.message }, 400);
    }

    // Assign cafe_owner role
    await admin.from("user_roles").insert({ user_id: newUserId, role: "cafe_owner" });

    return json({ cafe });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
