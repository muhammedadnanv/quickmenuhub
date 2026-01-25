import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Flame, Leaf, Star, Wheat } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  currency_symbol: string;
  opening_time: string | null;
  closing_time: string | null;
  is_open_today: boolean | null;
  logo_url: string | null;
  cover_image_url: string | null;
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
  is_special: boolean;
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

  // Calculate if restaurant is currently open - must be before early returns
  const isCurrentlyOpen = useMemo(() => {
    if (!restaurant?.is_open_today) return false;
    if (!restaurant?.opening_time || !restaurant?.closing_time) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMin] = restaurant.opening_time.split(":").map(Number);
    const [closeHour, closeMin] = restaurant.closing_time.split(":").map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  }, [restaurant]);

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
      {/* Cover Image */}
      {restaurant?.cover_image_url && (
        <div className="w-full h-40 md:h-56 overflow-hidden">
          <img
            src={restaurant.cover_image_url}
            alt={`${restaurant.name} cover`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <header className={cn(
        "sticky z-50 bg-background/95 backdrop-blur-sm border-b border-border",
        restaurant?.cover_image_url ? "top-0" : "top-0"
      )}>
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Logo */}
              {restaurant?.logo_url && (
                <img
                  src={restaurant.logo_url}
                  alt={`${restaurant.name} logo`}
                  className="w-14 h-14 rounded-xl object-cover border border-border shadow-soft"
                />
              )}
              <div className="flex-1">
                <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  {restaurant?.name}
                </h1>
                <p className="text-sm text-muted-foreground font-body mt-0.5">
                  {restaurant?.tagline}
                </p>
                {/* Operating Hours */}
                {restaurant?.opening_time && restaurant?.closing_time && (
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        isCurrentlyOpen
                          ? "bg-accent/15 text-accent"
                          : "bg-destructive/15 text-destructive"
                      )}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full animate-pulse",
                          isCurrentlyOpen ? "bg-accent" : "bg-destructive"
                        )}
                      />
                      {isCurrentlyOpen ? "Open Now" : "Closed"}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}
                    </span>
                  </div>
                )}
              </div>
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
            {/* Today's Specials Section */}
            {menuItems.filter((item) => item.is_special).length > 0 && (
              <section className="scroll-mt-36">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">⭐</span>
                  <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
                    Today's Specials
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-400 to-transparent" />
                </div>
                <div className="space-y-3">
                  {menuItems
                    .filter((item) => item.is_special)
                    .map((item, index) => {
                      const category = categories.find((c) => c.id === item.category_id);
                      return (
                        <div
                          key={item.id}
                          className="group p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300 animate-slide-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-amber-500">⭐</span>
                                <h3 className="font-display text-lg font-medium text-foreground">
                                  {item.name}
                                </h3>
                                {category && (
                                  <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full">
                                    {category.icon} {category.name}
                                  </span>
                                )}
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
                              <span className="font-display text-lg font-semibold text-amber-600 dark:text-amber-400">
                                {restaurant?.currency_symbol}
                                {item.price}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

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
