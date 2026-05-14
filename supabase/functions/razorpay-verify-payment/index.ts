import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createHmac } from "node:crypto";

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

    const { cafe_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!cafe_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return json({ error: "Missing fields" }, 400);

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const expected = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expected !== razorpay_signature) return json({ error: "Invalid signature" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: cafe } = await admin.from("restaurants").select("*").eq("id", cafe_id).maybeSingle();
    if (!cafe) return json({ error: "Café not found" }, 404);
    if (cafe.owner_id !== userId) {
      const { data: r } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
      if (r?.role !== "super_admin") return json({ error: "Forbidden" }, 403);
    }

    const now = new Date();
    const base = cafe.current_period_end && new Date(cafe.current_period_end) > now
      ? new Date(cafe.current_period_end) : now;
    const newEnd = new Date(base);
    newEnd.setDate(newEnd.getDate() + 30);

    await admin.from("subscriptions").update({
      razorpay_payment_id, razorpay_signature, status: "paid",
      period_start: now.toISOString(), period_end: newEnd.toISOString(),
    }).eq("razorpay_order_id", razorpay_order_id);

    await admin.from("restaurants").update({
      subscription_status: "active",
      current_period_end: newEnd.toISOString(),
    }).eq("id", cafe_id);

    return json({ ok: true, current_period_end: newEnd.toISOString() });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
