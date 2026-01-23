import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Flame, Leaf, Star, Wheat } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  currency_symbol: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  tags: string[];
  is_available: boolean;
}

const tagConfig: Record<string, { icon: any; label: string; className: string }> = {
  vegetarian: { icon: Leaf, label: "Veg", className: "bg-accent/15 text-accent" },
  vegan: { icon: Leaf, label: "Vegan", className: "bg-accent/15 text-accent" },
  "gluten-free": { icon: Wheat, label: "GF", className: "bg-secondary text-secondary-foreground" },
  spicy: { icon: Flame, label: "Spicy", className: "bg-destructive/15 text-destructive" },
  popular: { icon: Star, label: "Popular", className: "bg-primary/15 text-primary" },
};

const PublicMenu = () => {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (slug) {
      fetchMenu();
    }
  }, [slug]);

  const fetchMenu = async () => {
    // Fetch restaurant by slug
    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (restaurantError || !restaurantData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setRestaurant(restaurantData);

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .order("sort_order");

    setCategories(categoriesData || []);
    if (categoriesData && categoriesData.length > 0) {
      setActiveCategory(categoriesData[0].id);
    }

    // Fetch menu items
    const { data: itemsData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantData.id)
      .eq("is_available", true)
      .order("sort_order");

    setMenuItems(itemsData || []);
    setLoading(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map((cat) => ({
        id: cat.id,
        element: document.getElementById(`category-${cat.id}`),
      }));

      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const offsetTop = section.element.offsetTop;
          if (scrollPosition >= offsetTop) {
            setActiveCategory(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold mb-2">Menu Not Found</h1>
          <p className="text-muted-foreground">
            This restaurant doesn't exist or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                {restaurant?.name}
              </h1>
              <p className="text-sm text-muted-foreground font-body mt-0.5">
                {restaurant?.tagline}
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

      {/* Category Navigation */}
      {categories.length > 0 && (
        <nav className="sticky top-[73px] z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container max-w-2xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Menu Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              This menu is being set up. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => {
              const items = menuItems.filter(
                (item) => item.category_id === category.id
              );
              if (items.length === 0) return null;

              return (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="scroll-mt-36"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{category.icon}</span>
                    <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
                      {category.name}
                    </h2>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="group p-4 rounded-xl bg-card border border-border hover:shadow-card transition-all duration-300 animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display text-lg font-medium text-foreground">
                                {item.name}
                              </h3>
                              {item.tags?.map((tag) => {
                                const config = tagConfig[tag];
                                if (!config) return null;
                                const Icon = config.icon;
                                return (
                                  <span
                                    key={tag}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                      config.className
                                    )}
                                  >
                                    <Icon className="w-3 h-3" />
                                    {config.label}
                                  </span>
                                );
                              })}
                            </div>
                            {item.description && (
                              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <span className="font-display text-lg font-semibold text-primary">
                              {restaurant?.currency_symbol}
                              {item.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <a
              href="https://razorpay.me/@adnan4402"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-soft"
            >
              <Heart className="w-5 h-5" />
              Support / Donate
            </a>
            <p className="mt-4 text-sm text-muted-foreground">
              Powered by Digital Menu • Scan & Browse
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicMenu;
