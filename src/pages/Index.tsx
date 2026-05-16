import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Coffee, ShoppingCart, BarChart3, Receipt, ShieldCheck, Crown, Check, ArrowRight, Phone, Mail, Instagram, Linkedin } from "lucide-react";

const CONTACT_PHONE = "+91 96567 78508";
const CONTACT_PHONE_TEL = "+919656778508";
const INSTAGRAM_URL = "https://www.instagram.com/thetechcontractor.in/";
const LINKEDIN_URL = "https://www.linkedin.com/in/muhammedadnanvv/";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-xl font-semibold">Quick Menu Hub</span>
          </div>
          <Button asChild><Link to="/auth">Sign in</Link></Button>
        </div>
      </header>

      <section className="py-20 md:py-28">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Crown className="w-4 h-4" /> Premium SaaS for cafés & restaurants
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
            The complete café operating system,
            <br /><span className="text-primary">priced for serious brands.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            POS, billing, real-time orders, printable receipts, menu administration and sales analytics —
            in one polished workspace built for the counter.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link to="/auth">Sign in to your café <ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Accounts are provisioned by Quick Menu Hub. Contact us for onboarding.
          </p>
        </div>
      </section>

      <section className="py-16 bg-muted/40">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Built to run a serious café</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Feature icon={<ShoppingCart />} title="Touch POS" text="Two-pane ordering, instant cart, discounts and tax handled correctly." />
            <Feature icon={<Receipt />} title="Printable receipts" text="Thermal-style receipts with brand, GST and totals — one click to print." />
            <Feature icon={<BarChart3 />} title="Sales analytics" text="Daily, weekly and monthly revenue, top items and live order pulse." />
            <Feature icon={<Coffee />} title="Menu administration" text="Categories, item images, availability, today's specials and price control." />
            <Feature icon={<ShieldCheck />} title="Role-based security" text="Admin-controlled brand accounts, encrypted passwords, protected routes." />
            <Feature icon={<Crown />} title="Premium support" text="Direct onboarding from our team. No DIY signup, no noise." />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="bg-card border border-primary/20 rounded-3xl p-8 md:p-12 text-center shadow-soft">
            <Crown className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Premium subscription</h2>
            <p className="text-muted-foreground mb-6">Single transparent plan. Everything included.</p>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="font-display text-6xl font-bold">₹1,599</span>
              <span className="text-muted-foreground text-lg">/ month, per café</span>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3 text-left max-w-md mx-auto mb-8">
              {[
                "Unlimited orders & menu items",
                "Printable GST-ready receipts",
                "Real-time order updates",
                "Sales reports & top items",
                "Public QR menu",
                "Razorpay-powered renewals",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild><Link to="/auth">Sign in <ArrowRight className="w-5 h-5 ml-2" /></Link></Button>
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 bg-muted/40">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center shadow-soft">
            <Phone className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Contact us for onboarding</h2>
            <p className="text-muted-foreground mb-6">
              Talk to our team to get your café provisioned on Quick Menu Hub.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <a href={`tel:${CONTACT_PHONE_TEL}`}><Phone className="w-4 h-4 mr-2" />{CONTACT_PHONE}</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={`https://wa.me/${CONTACT_PHONE_TEL.replace("+", "")}`} target="_blank" rel="noreferrer">
                  WhatsApp us
                </a>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Instagram className="w-4 h-4" /> @thetechcontractor.in
              </a>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Linkedin className="w-4 h-4" /> Muhammed Adnan VV
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-primary" />
            <span className="font-display font-semibold text-foreground">Quick Menu Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="flex items-center gap-1 hover:text-primary">
              <Phone className="w-4 h-4" /> {CONTACT_PHONE}
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-primary">
              <Instagram className="w-4 h-4" />
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-primary">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
          <p>Premium café management · Powered by Razorpay</p>
        </div>
      </footer>
    </div>
  );
};

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">{icon}</div>
      <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export default Index;
