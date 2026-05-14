import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CafeContext } from "@/components/cafe/CafeLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, CheckCircle2, ChefHat, Bell, X, Loader2, Printer } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import Receipt from "@/components/cafe/Receipt";

interface Order {
  id: string; order_number: number; status: string; customer_name: string | null;
  table_number: string | null; subtotal: number; discount: number; tax: number; total: number;
  prep_minutes: number; created_at: string; completed_at: string | null;
}
interface OrderItem { id: string; order_id: string; name_snapshot: string; price_snapshot: number; quantity: number; line_total: number; }

const STATUS = {
  pending:    { label: "Pending",    color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400", next: "preparing", nextLabel: "Start preparing", icon: Bell },
  preparing:  { label: "Preparing",  color: "bg-blue-500/15 text-blue-700 dark:text-blue-400",   next: "ready",     nextLabel: "Mark ready",       icon: ChefHat },
  ready:      { label: "Ready",      color: "bg-accent/20 text-accent-foreground",                next: "completed", nextLabel: "Complete",         icon: CheckCircle2 },
  completed:  { label: "Completed",  color: "bg-muted text-muted-foreground",                     next: null,         nextLabel: "",                 icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  color: "bg-destructive/15 text-destructive",                 next: null,         nextLabel: "",                 icon: X },
} as const;

export default function Orders() {
  const { restaurant } = useOutletContext<CafeContext>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const symbol = restaurant.currency_symbol || "$";

  const fetchAll = async () => {
    const { data: o } = await supabase.from("orders").select("*").eq("restaurant_id", restaurant.id).order("created_at", { ascending: false }).limit(100);
    setOrders(o || []);
    if (o && o.length > 0) {
      const { data: oi } = await supabase.from("order_items").select("*").in("order_id", o.map(x => x.id));
      const grouped: Record<string, OrderItem[]> = {};
      (oi || []).forEach(it => { (grouped[it.order_id] ||= []).push(it as any); });
      setItems(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("orders-" + restaurant.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);

  const updateStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Order updated`);
  };

  const renderOrder = (o: Order) => {
    const meta = (STATUS as any)[o.status] || STATUS.pending;
    const Icon = meta.icon;
    const elapsedMin = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
    const eta = Math.max(0, o.prep_minutes - elapsedMin);
    return (
      <Card key={o.id} className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-semibold">#{o.order_number}</span>
              <Badge className={meta.color}><Icon className="w-3 h-3 mr-1" />{meta.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(o.created_at), "p")} • {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
              {o.customer_name && ` • ${o.customer_name}`}
              {o.table_number && ` • Table ${o.table_number}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{symbol}{Number(o.total).toFixed(2)}</p>
            {o.status !== "completed" && o.status !== "cancelled" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />ETA {eta}m</p>
            )}
          </div>
        </div>
        <div className="space-y-1 text-sm border-t pt-2">
          {(items[o.id] || []).map(it => (
            <div key={it.id} className="flex justify-between">
              <span>{it.quantity}× {it.name_snapshot}</span>
              <span className="text-muted-foreground">{symbol}{Number(it.line_total).toFixed(2)}</span>
            </div>
          ))}
        </div>
        {meta.next && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1" onClick={() => updateStatus(o.id, meta.next!)}>{meta.nextLabel}</Button>
            {o.status !== "completed" && (
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus(o.id, "cancelled")}><X className="w-3 h-3" /></Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setReceiptOrder(o)}><Printer className="w-3 h-3" /></Button>
          </div>
        )}
        {!meta.next && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setReceiptOrder(o)}>
              <Printer className="w-3 h-3 mr-2" />Print receipt
            </Button>
          </div>
        )}
      </Card>
    );
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const active = orders.filter(o => !["completed", "cancelled"].includes(o.status));
  const past = orders.filter(o => ["completed", "cancelled"].includes(o.status));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-4">Orders</h1>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="past">History ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {active.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active orders.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{active.map(renderOrder)}</div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No past orders.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{past.map(renderOrder)}</div>
          )}
        </TabsContent>
      </Tabs>
      <Receipt
        open={!!receiptOrder}
        onOpenChange={(v) => !v && setReceiptOrder(null)}
        order={receiptOrder as any}
        items={receiptOrder ? items[receiptOrder.id] || [] : []}
        restaurant={restaurant}
      />
    </div>
  );
}