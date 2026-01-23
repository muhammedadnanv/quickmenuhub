import { useState, useEffect } from "react";
import { menuData } from "@/data/menuData";
import MenuHeader from "@/components/MenuHeader";
import CategoryNav from "@/components/CategoryNav";
import MenuSection from "@/components/MenuSection";
import SupportFooter from "@/components/SupportFooter";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState(menuData[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const sections = menuData.map((cat) => ({
        id: cat.id,
        element: document.getElementById(cat.id),
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
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MenuHeader />
      <CategoryNav
        categories={menuData}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
      
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-10">
          {menuData.map((category) => (
            <MenuSection key={category.id} category={category} />
          ))}
        </div>
      </main>

      <SupportFooter />
    </div>
  );
};

export default Index;
