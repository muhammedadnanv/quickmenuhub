import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, QrCode, Smartphone, Edit, ArrowRight, Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display text-xl font-semibold">BrewDesk</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              POS • Orders • Billing • Sales analytics
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Create Your BrewDesk
              <br />
              <span className="text-primary">in Minutes</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              BrewDesk is the all-in-one café management system: take orders, generate
              accurate bills, manage your menu, and track real-time sales — optimized
              for tablets and desktops behind the counter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link to="/auth">
                  Create Your Menu Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <a
                href="https://razorpay.me/@adnan4402"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-secondary transition-colors font-medium"
              >
                <Heart className="w-5 h-5 text-primary" />
                Support Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose BrewDesk?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-2xl p-6 text-center animate-slide-up">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Instant QR Code
              </h3>
              <p className="text-muted-foreground">
                Get a unique QR code for your restaurant. Print it and place on
                tables - customers scan to view your menu instantly.
              </p>
            </div>

            <div
              className="bg-card border border-border rounded-2xl p-6 text-center animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Mobile Friendly
              </h3>
              <p className="text-muted-foreground">
                Beautiful, fast-loading menu that works perfectly on any phone.
                No app download required - opens right in the browser.
              </p>
            </div>

            <div
              className="bg-card border border-border rounded-2xl p-6 text-center animate-slide-up"
              style={{ animationDelay: "200ms" }}
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Edit className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Easy to Update
              </h3>
              <p className="text-muted-foreground">
                Add, edit, or remove items anytime. Changes appear instantly on
                your menu - no reprinting needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
            Get Started in 3 Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-display text-xl font-bold flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Create Account
              </h3>
              <p className="text-muted-foreground">
                Sign up for free and add your restaurant details.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-display text-xl font-bold flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Add Your Menu
              </h3>
              <p className="text-muted-foreground">
                Add categories and items with prices, descriptions, and tags.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-display text-xl font-bold flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Share QR Code
              </h3>
              <p className="text-muted-foreground">
                Download your QR code, print it, and place it on tables.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/auth">
                Start Creating Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ChefHat className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold">BrewDesk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Simple QR menu solution for restaurants & cafés
            </p>
            <a
              href="https://razorpay.me/@adnan4402"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart className="w-4 h-4" />
              Support / Donate
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
