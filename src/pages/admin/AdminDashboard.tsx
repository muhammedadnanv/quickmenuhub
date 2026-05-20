import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Crown, Plus, LogOut, Loader2, ExternalLink, Trash2, Coffee, ShieldCheck, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    brand_name: "", username: "", password: "", email: "", phone: "",
    address: "", gst_number: "", website_url: "", upi_id: "", tagline: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (r?.role !== "super_admin") {
        setAuthorized(false);
        navigate("/auth");
        return;
      }
      setAuthorized(true);
      loadCafes();
    })();
  }, [user, navigate]);

  const loadCafes = async () => {
    setLoading(true);
    const { data } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    setCafes(data || []);
    setLoading(false);
  };

  const createCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-create-cafe", { body: form });
    setCreating(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed");
      return;
    }
    toast.success(`Café "${form.brand_name}" created`);
    setForm({ brand_name: "", username: "", password: "", email: "", phone: "", address: "", gst_number: "", website_url: "", upi_id: "", tagline: "" });
    setDialogOpen(false);
    loadCafes();
  };

  const deleteCafe = async (id: string) => {
    // Cascade delete via service role — easier: just delete restaurant; auth user remains orphaned but blocked
    const { data: restaurant } = await supabase.from("restaurants").select("owner_id").eq("id", id).maybeSingle();
    await supabase.from("menu_items").delete().eq("restaurant_id", id);
    await supabase.from("menu_categories").delete().eq("restaurant_id", id);
    await supabase.from("subscriptions").delete().eq("cafe_id", id);
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (restaurant?.owner_id) await supabase.from("user_roles").delete().eq("user_id", restaurant.owner_id);
    if (error) toast.error(error.message); else { toast.success("Café removed"); loadCafes(); }
  };

  if (authLoading || authorized === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold flex items-center gap-2">
                Master Dashboard <Badge variant="secondary" className="text-[10px]"><ShieldCheck className="w-3 h-3 mr-1" />Super Admin</Badge>
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-2" />Sign out
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard label="Total cafés" value={cafes.length} icon={<Coffee className="w-5 h-5" />} />
          <StatCard label="Active subscriptions" value={cafes.filter(c => c.subscription_status === "active" && c.current_period_end && new Date(c.current_period_end) > new Date()).length} icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />} />
          <StatCard label="Expired" value={cafes.filter(c => !(c.subscription_status === "active" && c.current_period_end && new Date(c.current_period_end) > new Date())).length} icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Brand accounts</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create café account</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-display">New café brand</DialogTitle></DialogHeader>
              <form onSubmit={createCafe} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Brand / Café name *" v={form.brand_name} on={(v) => setForm({ ...form, brand_name: v })} required />
                  <Field label="Username *" v={form.username} on={(v) => setForm({ ...form, username: v.toLowerCase().replace(/[^a-z0-9_]/g, "") })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email *" type="email" v={form.email} on={(v) => setForm({ ...form, email: v })} required />
                  <Field label="Password *" type="password" v={form.password} on={(v) => setForm({ ...form, password: v })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
                  <Field label="UPI ID" v={form.upi_id} on={(v) => setForm({ ...form, upi_id: v })} />
                </div>
                <Field label="Business address" v={form.address} on={(v) => setForm({ ...form, address: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="GST number" v={form.gst_number} on={(v) => setForm({ ...form, gst_number: v })} />
                  <Field label="Website URL" v={form.website_url} on={(v) => setForm({ ...form, website_url: v })} />
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : cafes.length === 0 ? (
          <Card className="p-12 text-center">
            <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold mb-1">No cafés yet</h3>
            <p className="text-muted-foreground mb-4">Create the first brand account to onboard a café.</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Create café account</Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {cafes.map((c) => {
              const active = c.subscription_status === "active" && c.current_period_end && new Date(c.current_period_end) > new Date();
              const daysLeft = c.current_period_end ? Math.ceil((new Date(c.current_period_end).getTime() - Date.now()) / 86400000) : null;
              return (
                <Card key={c.id} className="p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Coffee className="w-5 h-5 text-primary" /></div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display font-semibold truncate">{c.name}</p>
                          <Badge variant={active ? "default" : "secondary"} className={active ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
                            {active ? "Active" : "Expired"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">@{c.username} · {c.email} {c.phone ? `· ${c.phone}` : ""}</p>
                        {c.current_period_end && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {active ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Expired"} · {new Date(c.current_period_end).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild><Link to={`/menu/${c.slug}`} target="_blank"><ExternalLink className="w-4 h-4 mr-1" />Menu</Link></Button>
                      <Button size="sm" asChild><Link to={`/cafe/${c.id}/pos`}>Open</Link></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                            <AlertDialogDescription>This removes the café, its menu, and all orders. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCafe(c.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-display text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">{icon}</div>
    </Card>
  );
}

function Field({ label, v, on, type = "text", required }: { label: string; v: string; on: (s: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={v} onChange={(e) => on(e.target.value)} required={required} />
    </div>
  );
}
