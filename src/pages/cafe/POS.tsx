import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Trash2, ShoppingBag, Loader2, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { CafeContext } from "@/components/cafe/CafeLayout";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface Item {
  id: string;
  category_id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_available: boolean | null;
  tax_rate: number | null;
}
interface Category { id: string; name: string; sort_order: number | null }
interface CartLine { item: Item; qty: number }

export default function POS() {
  const { restaurant } = useOutletContext<CafeContext>();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [submitting, setSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const symbol = restaurant.currency_symbol || "$";
  const taxPct = Number(restaurant.tax_percent || 0);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order");
      const { data: its } = await supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).eq("is_available", true).order("sort_order");
      setCategories(cats || []);
      setItems(its || []);
    })();
  }, [restaurant.id]);

  const visibleItems = useMemo(() => activeCat === "all" ? items : items.filter(i => i.category_id === activeCat), [items, activeCat]);

  const addToCart = (item: Item) => {
    setCart(prev => {
      const ex = prev.find(l => l.item.id === item.id);
      if (ex) return prev.map(l => l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { item, qty: 1 }];
    });
  };
  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return setCart(c => c.filter(l => l.item.id !== id));
    setCart(c => c.map(l => l.item.id === id ? { ...l, qty } : l));
  };

  const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
  const discountAmt = discountType === "percent" ? subtotal * (discount / 100) : Math.min(discount, subtotal);
  const taxableBase = Math.max(0, subtotal - discountAmt);
  const tax = taxableBase * (taxPct / 100);
  const total = taxableBase + tax;

  const placeOrder = async () => {
    if (!user) return;
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setSubmitting(true);
    const { data: order, error } = await supabase.from("orders").insert({
      restaurant_id: restaurant.id,
      created_by: user.id,
      customer_name: customer || null,
      table_number: tableNo || null,
      subtotal, discount: discountAmt, tax, total,
      prep_minutes: restaurant.default_prep_minutes || 15,
      status: "pending",
    }).select().single();
    if (error || !order) { toast.error(error?.message || "Failed"); setSubmitting(false); return; }
    const lines = cart.map(l => ({
      order_id: order.id, menu_item_id: l.item.id,
      name_snapshot: l.item.name, price_snapshot: l.item.price,
      quantity: l.qty, line_total: l.item.price * l.qty,
    }));
    const { error: e2 } = await supabase.from("order_items").insert(lines);
    if (e2) { toast.error(e2.message); setSubmitting(false); return; }
    toast.success(`Order #${order.order_number} placed • ETA ${order.prep_minutes} min`);
    setCart([]); setCustomer(""); setTableNo(""); setDiscount(0);
    setCartOpen(false);
    setSubmitting(false);
  };

  const CartPanel = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4" />
          <h2 className="font-display font-semibold">Current Order</h2>
          <Badge variant="secondary" className="ml-auto">{cart.reduce((s, l) => s + l.qty, 0)} items</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Customer name" value={customer} onChange={e => setCustomer(e.target.value)} />
          <Input placeholder="Table #" value={tableNo} onChange={e => setTableNo(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No items yet. Tap a menu item to add.</p>
        ) : cart.map(l => (
          <div key={l.item.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{l.item.name}</p>
              <p className="text-xs text-muted-foreground">{symbol}{l.item.price.toFixed(2)} × {l.qty}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.item.id, l.qty - 1)}><Minus className="w-3 h-3" /></Button>
              <span className="w-6 text-center text-sm">{l.qty}</span>
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.item.id, l.qty + 1)}><Plus className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setQty(l.item.id, 0)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4 space-y-3 bg-card">
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap">Discount</Label>
          <Input type="number" min={0} value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} className="h-8" />
          <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="flat" className="text-xs px-2">{symbol}</TabsTrigger>
              <TabsTrigger value="percent" className="text-xs px-2">%</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{symbol}{subtotal.toFixed(2)}</span></div>
          {discountAmt > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>−{symbol}{discountAmt.toFixed(2)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxPct}%)</span><span>{symbol}{tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-base pt-1 border-t"><span>Total</span><span>{symbol}{total.toFixed(2)}</span></div>
        </div>
        <Button className="w-full h-11" onClick={placeOrder} disabled={submitting || cart.length === 0}>
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Place Order
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b bg-card">
          <Tabs value={activeCat} onValueChange={setActiveCat}>
            <TabsList className="overflow-x-auto max-w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(c => <TabsTrigger key={c.id} value={c.id}>{c.name}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {visibleItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No menu items available.</p>
              <p className="text-sm mt-1">Add items in the Menu tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {visibleItems.map(item => (
                <Card key={item.id} className="overflow-hidden cursor-pointer hover:border-primary hover:shadow-md transition-all active:scale-[0.98]" onClick={() => addToCart(item)}>
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem]">{item.name}</p>
                    <p className="text-primary font-semibold text-sm mt-1">{symbol}{Number(item.price).toFixed(2)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isMobile && (
        <aside className="w-[360px] border-l bg-background hidden md:flex">
          {CartPanel}
        </aside>
      )}

      {isMobile && (
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <SheetTrigger asChild>
            <Button className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50" size="icon">
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.reduce((s, l) => s + l.qty, 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-full sm:max-w-md flex flex-col">
            <SheetHeader className="sr-only"><SheetTitle>Cart</SheetTitle></SheetHeader>
            {CartPanel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}