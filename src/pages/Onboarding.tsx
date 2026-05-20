import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coffee, KeyRound, LogIn, QrCode, ShoppingCart, Phone, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (role?.role === "super_admin") return navigate("/admin", { replace: true });
      const { data: cafe } = await supabase.from("restaurants").select("id").eq("owner_id", user.id).maybeSingle();
      if (cafe) navigate(`/cafe/${cafe.id}/pos`, { replace: true });
    })();
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-semibold">Quick Menu Hub</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth"><LogIn className="w-4 h-4 mr-2" />Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-12 space-y-10">
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Account ready
          </div>
          <h1 className="font-display text-4xl font-semibold">Welcome to your café</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your account is created and active. Follow these three quick steps to start taking orders today.
          </p>
        </section>

        <ol className="space-y-4">
          <Step
            n={1}
            icon={<KeyRound className="w-5 h-5" />}
            title="Use the credentials from your admin"
            body="You'll receive a username and password from the Quick Menu Hub team. Keep them safe — they're the only way into your café dashboard."
          />
          <Step
            n={2}
            icon={<LogIn className="w-5 h-5" />}
            title="Sign in on the Café tab"
            body="Open the sign-in page, stay on the Café tab, enter your username (not email) and password, then tap Sign in. You'll land straight in the POS — no approval wait."
            cta={<Button asChild size="sm"><Link to="/auth">Go to sign in <ArrowRight className="w-4 h-4 ml-1.5" /></Link></Button>}
          />
          <Step
            n={3}
            icon={<ShoppingCart className="w-5 h-5" />}
            title="Add your menu, print your QR & start selling"
            body="Inside the dashboard: Menu → add categories & items, Posters → generate your branded QR poster, POS → take your first order, Orders → manage them live."
          />
        </ol>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold mb-1">QR menu & POS in one place</h3>
              <p className="text-sm text-muted-foreground">
                Every café gets a public QR menu at <code className="bg-background px-1.5 py-0.5 rounded text-xs">/menu/your-slug</code> and a full POS at <code className="bg-background px-1.5 py-0.5 rounded text-xs">/cafe/.../pos</code>. Both are linked from your sidebar after sign-in.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold mb-1">Need help or don't have credentials yet?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Contact our onboarding team and we'll set up your account within minutes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="tel:+919656778508"><Phone className="w-4 h-4 mr-2" />+91 96567 78508</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://wa.me/919656778508" target="_blank" rel="noreferrer">WhatsApp us</a>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

function Step({ n, icon, title, body, cta }: { n: number; icon: React.ReactNode; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <li>
      <Card className="p-5 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-display font-semibold flex items-center justify-center shrink-0">
          {n}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 text-primary">{icon}<h3 className="font-display font-semibold text-foreground">{title}</h3></div>
          <p className="text-sm text-muted-foreground">{body}</p>
          {cta && <div className="mt-3">{cta}</div>}
        </div>
      </Card>
    </li>
  );
}