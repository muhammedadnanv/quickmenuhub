import { MenuItem as MenuItemType, restaurantInfo } from "@/data/menuData";
import { cn } from "@/lib/utils";
import { Flame, Leaf, Star, Wheat } from "lucide-react";

interface MenuItemProps {
  item: MenuItemType;
  index: number;
}

const tagConfig = {
  vegetarian: { icon: Leaf, label: "Veg", className: "bg-accent/15 text-accent" },
  vegan: { icon: Leaf, label: "Vegan", className: "bg-accent/15 text-accent" },
  "gluten-free": { icon: Wheat, label: "GF", className: "bg-secondary text-secondary-foreground" },
  spicy: { icon: Flame, label: "Spicy", className: "bg-destructive/15 text-destructive" },
  popular: { icon: Star, label: "Popular", className: "bg-primary/15 text-primary" },
};

const MenuItem = ({ item, index }: MenuItemProps) => {
  const formatPrice = (price: number) => {
    return `${restaurantInfo.currencySymbol}${price}`;
  };

  return (
    <div 
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
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="font-display text-lg font-semibold text-primary">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
