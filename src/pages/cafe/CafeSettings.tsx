import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CafeContext } from "@/components/cafe/CafeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function CafeSettings() {
  const { restaurant, refresh } = useOutletContext<CafeContext>();
  const [form, setForm] = useState({
    name: restaurant.name, tagline: restaurant.tagline || "",
    currency_symbol: restaurant.currency_symbol || "$",
    tax_percent: restaurant.tax_percent ?? 0,
    default_prep_minutes: restaurant.default_prep_minutes ?? 15,
    opening_time: restaurant.opening_time || "09:00",
    closing_time: restaurant.closing_time || "22:00",
    is_open_today: restaurant.is_open_today ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const loadMembers = async () => {
    const { data } = await supabase.from("user_roles").select("*").eq("restaurant_id", restaurant.id);
    setMembers(data || []);
  };
  useEffect(() => { loadMembers(); /* eslint-disable-next-line */ }, [restaurant.id]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      name: form.name, tagline: form.tagline, currency_symbol: form.currency_symbol,
      tax_percent: Number(form.tax_percent), default_prep_minutes: Number(form.default_prep_minutes),
      opening_time: form.opening_time, closing_time: form.closing_time,
      is_open_today: form.is_open_today,
    }).eq("id", restaurant.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Settings saved"); refresh(); }
  };

  const removeMember = async (id: string) => {
    if (!confirm("Remove this member?")) return;
    await supabase.from("user_roles").delete().eq("id", id);
    loadMembers();
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Café details</h2>
        <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Tagline</Label><Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Currency symbol</Label><Input value={form.currency_symbol} onChange={e => setForm({ ...form, currency_symbol: e.target.value })} /></div>
          <div><Label>Tax %</Label><Input type="number" step="0.01" value={form.tax_percent} onChange={e => setForm({ ...form, tax_percent: Number(e.target.value) })} /></div>
          <div><Label>Default prep (min)</Label><Input type="number" value={form.default_prep_minutes} onChange={e => setForm({ ...form, default_prep_minutes: Number(e.target.value) })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Opens</Label><Input type="time" value={form.opening_time} onChange={e => setForm({ ...form, opening_time: e.target.value })} /></div>
          <div><Label>Closes</Label><Input type="time" value={form.closing_time} onChange={e => setForm({ ...form, closing_time: e.target.value })} /></div>
        </div>
        <div className="flex items-center justify-between">
          <Label>Open today</Label>
          <Switch checked={form.is_open_today} onCheckedChange={v => setForm({ ...form, is_open_today: v })} />
        </div>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Save</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Team members</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Add a teammate by entering their user ID after they sign up. They'll appear here once added.
        </p>
        <AddMemberForm restaurantId={restaurant.id} onAdded={loadMembers} />
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
              <div>
                <p className="font-mono text-xs truncate">{m.user_id}</p>
                <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeMember(m.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AddMemberForm({ restaurantId, onAdded }: { restaurantId: string; onAdded: () => void }) {
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [adding, setAdding] = useState(false);
  const add = async () => {
    if (!uid.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid.trim(), restaurant_id: restaurantId, role });
    setAdding(false);
    if (error) toast.error(error.message); else { toast.success("Member added"); setUid(""); onAdded(); }
  };
  return (
    <div className="flex gap-2">
      <Input placeholder="User ID (UUID)" value={uid} onChange={e => setUid(e.target.value)} />
      <select className="rounded-md border border-input bg-background px-2 text-sm" value={role} onChange={e => setRole(e.target.value as any)}>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
      <Button onClick={add} disabled={adding}><UserPlus className="w-4 h-4 mr-1" />Add</Button>
    </div>
  );
}