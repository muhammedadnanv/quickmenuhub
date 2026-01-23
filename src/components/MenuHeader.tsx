import { restaurantInfo } from "@/data/menuData";
import { Heart } from "lucide-react";

const MenuHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {restaurantInfo.name}
            </h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              {restaurantInfo.tagline}
            </p>
          </div>
          <a
            href="https://razorpay.me/@adnan4402"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-soft"
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default MenuHeader;
