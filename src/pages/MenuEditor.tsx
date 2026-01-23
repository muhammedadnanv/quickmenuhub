import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  ExternalLink,
  QrCode,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

const ICONS = ["🍽️", "🥗", "🍛", "🍕", "🍔", "🌮", "🍜", "🍣", "☕", "🍰", "🍹", "🍺"];
const TAGS = ["vegetarian", "vegan", "gluten-free", "spicy", "popular"];

const MenuEditor = () => {
  const { restaurantId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "🍽️" });
  const [itemForm, setItemForm] = useState({
    category_id: "",
    name: "",
    description: "",
    price: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && restaurantId) {
      fetchData();
    }
  }, [user, restaurantId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch restaurant
    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .eq("owner_id", user?.id)
      .maybeSingle();

    if (restaurantError || !restaurantData) {
      toast({
        title: "Error",
        description: "Restaurant not found or you don't have access.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setRestaurant(restaurantData);

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order");

    setCategories(categoriesData || []);

    // Fetch menu items
    const { data: itemsData } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order");

    setMenuItems(itemsData || []);
    setLoading(false);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (editingCategory) {
      const { error } = await supabase
        .from("menu_categories")
        .update({ name: categoryForm.name, icon: categoryForm.icon })
        .eq("id", editingCategory.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id
              ? { ...c, name: categoryForm.name, icon: categoryForm.icon }
              : c
          )
        );
        toast({ title: "Category updated!" });
      }
    } else {
      const { data, error } = await supabase
        .from("menu_categories")
        .insert({
          restaurant_id: restaurantId,
          name: categoryForm.name,
          icon: categoryForm.icon,
          sort_order: categories.length,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setCategories([...categories, data]);
        toast({ title: "Category added!" });
      }
    }

    setCategoryDialogOpen(false);
    setCategoryForm({ name: "", icon: "🍽️" });
    setEditingCategory(null);
    setSaving(false);
  };

  const deleteCategory = async (categoryId: string) => {
    const { error } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCategories(categories.filter((c) => c.id !== categoryId));
      setMenuItems(menuItems.filter((item) => item.category_id !== categoryId));
      toast({ title: "Category deleted!" });
    }
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const itemData = {
      category_id: itemForm.category_id,
      name: itemForm.name,
      description: itemForm.description || null,
      price: parseFloat(itemForm.price),
      tags: itemForm.tags,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setMenuItems(
          menuItems.map((item) =>
            item.id === editingItem.id ? { ...item, ...itemData } : item
          )
        );
        toast({ title: "Item updated!" });
      }
    } else {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          ...itemData,
          restaurant_id: restaurantId,
          sort_order: menuItems.length,
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setMenuItems([...menuItems, data]);
        toast({ title: "Item added!" });
      }
    }

    setItemDialogOpen(false);
    setItemForm({ category_id: "", name: "", description: "", price: "", tags: [] });
    setEditingItem(null);
    setSaving(false);
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMenuItems(menuItems.filter((item) => item.id !== itemId));
      toast({ title: "Item deleted!" });
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, icon: category.icon });
    setCategoryDialogOpen(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      tags: item.tags || [],
    });
    setItemDialogOpen(true);
  };

  const openAddItem = (categoryId?: string) => {
    setEditingItem(null);
    setItemForm({
      category_id: categoryId || categories[0]?.id || "",
      name: "",
      description: "",
      price: "",
      tags: [],
    });
    setItemDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-display text-xl font-semibold">
                  {restaurant?.name}
                </h1>
                <p className="text-sm text-muted-foreground">Edit Menu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/menu/${restaurant?.slug}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/menu/${restaurant?.slug}/qr`} target="_blank">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Categories Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Categories</h2>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ name: "", icon: "🍽️" });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={saveCategory} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setCategoryForm({ ...categoryForm, icon })}
                          className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-colors ${
                            categoryForm.icon === icon
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Name</Label>
                    <Input
                      id="categoryName"
                      placeholder="Starters"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCategory ? "Update Category" : "Add Category"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <div className="bg-muted rounded-xl p-6 text-center">
              <p className="text-muted-foreground">
                No categories yet. Add a category to start building your menu.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => openEditCategory(category)}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full hover:shadow-card transition-all group"
                >
                  <span>{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  <Trash2
                    className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCategory(category.id);
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Menu Items</h2>
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => openAddItem()}
                  disabled={categories.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingItem ? "Edit Item" : "Add Item"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={saveItem} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={itemForm.category_id}
                      onValueChange={(value) =>
                        setItemForm({ ...itemForm, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemName">Name</Label>
                    <Input
                      id="itemName"
                      placeholder="Butter Chicken"
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemDesc">Description</Label>
                    <Textarea
                      id="itemDesc"
                      placeholder="Tender chicken in creamy tomato gravy..."
                      value={itemForm.description}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemPrice">
                      Price ({restaurant?.currency_symbol || "₹"})
                    </Label>
                    <Input
                      id="itemPrice"
                      type="number"
                      step="0.01"
                      placeholder="350"
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-3">
                      {TAGS.map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={itemForm.tags.includes(tag)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setItemForm({
                                  ...itemForm,
                                  tags: [...itemForm.tags, tag],
                                });
                              } else {
                                setItemForm({
                                  ...itemForm,
                                  tags: itemForm.tags.filter((t) => t !== tag),
                                });
                              }
                            }}
                          />
                          <span className="text-sm capitalize">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? "Update Item" : "Add Item"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <div className="bg-muted rounded-xl p-6 text-center">
              <p className="text-muted-foreground">
                Add categories first before adding menu items.
              </p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="bg-muted rounded-xl p-6 text-center">
              <p className="text-muted-foreground">
                No menu items yet. Click "Add Item" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => {
                const items = menuItems.filter(
                  (item) => item.category_id === category.id
                );
                if (items.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="font-display text-lg font-medium mb-3 flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => openAddItem(category.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-card transition-shadow cursor-pointer"
                          onClick={() => openEditItem(item)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 bg-secondary rounded-full capitalize"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-display font-semibold text-primary">
                              {restaurant?.currency_symbol}
                              {item.price}
                            </span>
                            <Trash2
                              className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MenuEditor;
