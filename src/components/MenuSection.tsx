import { MenuCategory } from "@/data/menuData";
import MenuItem from "./MenuItem";

interface MenuSectionProps {
  category: MenuCategory;
}

const MenuSection = ({ category }: MenuSectionProps) => {
  return (
    <section id={category.id} className="scroll-mt-36">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{category.icon}</span>
        <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">
          {category.name}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-3">
        {category.items.map((item, index) => (
          <MenuItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
};

export default MenuSection;
