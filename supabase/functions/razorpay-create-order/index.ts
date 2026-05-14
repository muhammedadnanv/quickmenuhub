import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const AMOUNT_PAISE = 159900; // ₹1,599

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
    const userId = claims.claims.sub;

    const { cafe_id } = await req.json();
    if (!cafe_id) return json({ error: "Missing cafe_id" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cafe } = await admin.from("restaurants").select("*").eq("id", cafe_id).maybeSingle();
    if (!cafe) return json({ error: "Café not found" }, 404);
    if (cafe.owner_id !== userId) {
      const { data: r } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
      if (r?.role !== "super_admin") return json({ error: "Forbidden" }, 403);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const basic = btoa(`${keyId}:${keySecret}`);
    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${basic}` },
      body: JSON.stringify({
        amount: AMOUNT_PAISE,
        currency: "INR",
        receipt: `cafe_${cafe_id.slice(0, 8)}_${Date.now()}`,
        notes: { cafe_id, brand: cafe.name },
      }),
    });
    const order = await resp.json();
    if (!resp.ok) return json({ error: "Razorpay: " + JSON.stringify(order) }, 500);

    await admin.from("subscriptions").insert({
      cafe_id,
      razorpay_order_id: order.id,
      amount: AMOUNT_PAISE / 100,
      currency: "INR",
      status: "created",
    });

    return json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
