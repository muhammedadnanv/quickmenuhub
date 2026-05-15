import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown, LogOut, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

declare global { interface Window { Razorpay: any } }

export default function SubscriptionPaywall({
  restaurant, onPaid, onSignOut,
}: { restaurant: any; onPaid: () => void; onSignOut: () => void }) {
  const [loading, setLoading] = useState(false);

  const ensureRazorpay = () => new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });

  const pay = async () => {
    try {
      setLoading(true);
      await ensureRazorpay();
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: { cafe_id: restaurant.id },
      });
      if (error) throw error;
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Quick Menu Hub",
        description: "Premium Subscription — 1 month",
        order_id: data.order_id,
        prefill: { email: restaurant.email || "", contact: restaurant.phone || "" },
        theme: { color: "#c4654a" },
        handler: async (resp: any) => {
          try {
            const v = await supabase.functions.invoke("razorpay-verify-payment", {
              body: {
                cafe_id: restaurant.id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            if (v.error) throw v.error;
            toast.success("Payment successful — subscription active");
            onPaid();
          } catch (e: any) {
            toast.error("Verification failed: " + e.message);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message || "Could not start payment");
      setLoading(false);
    }
  };

  const expired = restaurant.current_period_end && new Date(restaurant.current_period_end) < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className={`max-w-md w-full p-8 text-center space-y-4 ${expired ? "border-destructive/40" : ""}`}>
        {expired && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold uppercase tracking-wider mx-auto">
            <Lock className="w-3 h-3" /> Account blocked
          </div>
        )}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${expired ? "bg-destructive/10" : "bg-primary/10"}`}>
          {expired ? <Lock className="w-7 h-7 text-destructive" /> : <Crown className="w-7 h-7 text-primary" />}
        </div>
        <h1 className="font-display text-2xl font-semibold">
          {expired ? "Access blocked — payment required" : "Activate your subscription"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {expired
            ? `${restaurant.name}'s premium subscription has expired. Renew now to instantly restore POS, orders, menu and reporting access.`
            : `${restaurant.name} requires an active premium subscription to access the workspace.`}
        </p>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-3xl font-display font-bold">₹1,599<span className="text-base font-normal text-muted-foreground">/month</span></div>
          <p className="text-xs text-muted-foreground mt-1">Full POS · Orders · Menu · Reports · Receipt printing</p>
        </div>
        <Button size="lg" className="w-full" onClick={pay} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {expired ? "Retry payment & renew now" : "Pay ₹1,599 with Razorpay"}
        </Button>
        <p className="text-[11px] text-muted-foreground">Secured by Razorpay · UPI, cards, netbanking</p>
        <Button variant="ghost" size="sm" className="w-full" onClick={onSignOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </Card>
    </div>
  );
}
