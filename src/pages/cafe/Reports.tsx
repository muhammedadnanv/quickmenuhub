import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CafeContext } from "@/components/cafe/CafeLayout";
import { Card } from "@/components/ui/card";
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Award } from "lucide-react";
import { format, startOfDay, subDays, startOfWeek, startOfMonth } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";

export default function Reports() {
  const { restaurant } = useOutletContext<CafeContext>();
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const symbol = restaurant.currency_symbol || "$";

  useEffect(() => {
    (async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data: o } = await supabase.from("orders").select("*").eq("restaurant_id", restaurant.id).neq("status", "cancelled").gte("created_at", since);
      setOrders(o || []);
      if (o && o.length > 0) {
        const { data: oi } = await supabase.from("order_items").select("*").in("order_id", o.map(x => x.id));
        setItems(oi || []);
      }
      setLoading(false);
    })();
  }, [restaurant.id]);

  const stats = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const week = startOfWeek(new Date()).getTime();
    const month = startOfMonth(new Date()).getTime();
    let td = 0, tdc = 0, wk = 0, mo = 0;
    orders.forEach(o => {
      const t = new Date(o.created_at).getTime();
      const tot = Number(o.total);
      if (t >= today) { td += tot; tdc++; }
      if (t >= week) wk += tot;
      if (t >= month) mo += tot;
    });
    return { td, tdc, wk, mo, avg: tdc ? td / tdc : 0 };
  }, [orders]);

  const dailySeries = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      map[d] = 0;
    }
    orders.forEach(o => {
      const d = format(new Date(o.created_at), "MMM d");
      if (d in map) map[d] += Number(o.total);
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }));
  }, [orders]);

  const topItems = useMemo(() => {
    const m: Record<string, { name: string; qty: number; revenue: number }> = {};
    items.forEach(it => {
      const k = it.name_snapshot;
      m[k] ||= { name: k, qty: 0, revenue: 0 };
      m[k].qty += it.quantity;
      m[k].revenue += Number(it.line_total);
    });
    return Object.values(m).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [items]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const Stat = ({ icon: Icon, label, value }: any) => (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-lg font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-semibold">Sales Reports</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={DollarSign} label="Today" value={`${symbol}${stats.td.toFixed(2)}`} />
        <Stat icon={ShoppingBag} label="Today's orders" value={stats.tdc} />
        <Stat icon={TrendingUp} label="Avg ticket" value={`${symbol}${stats.avg.toFixed(2)}`} />
        <Stat icon={DollarSign} label="This week" value={`${symbol}${stats.wk.toFixed(2)}`} />
        <Stat icon={DollarSign} label="This month" value={`${symbol}${stats.mo.toFixed(2)}`} />
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Revenue – last 30 days</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4" />Top selling items</h2>
        {topItems.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={topItems} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}