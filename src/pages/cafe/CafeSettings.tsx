import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CafeContext } from "@/components/cafe/CafeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

export default function CafeSettings() {
  const { restaurant, refresh } = useOutletContext<CafeContext>();
  const [form, setForm] = useState({
    name: restaurant.name,
    tagline: restaurant.tagline || "",
    phone: restaurant.phone || "",
    address: restaurant.address || "",
    gst_number: restaurant.gst_number || "",
    website_url: restaurant.website_url || "",
    upi_id: restaurant.upi_id || "",
    currency_symbol: restaurant.currency_symbol || "₹",
    tax_percent: restaurant.tax_percent ?? 0,
    default_prep_minutes: restaurant.default_prep_minutes ?? 15,
    opening_time: restaurant.opening_time || "09:00",
    closing_time: restaurant.closing_time || "22:00",
    is_open_today: restaurant.is_open_today ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update({
      name: form.name,
      tagline: form.tagline,
      phone: form.phone,
      address: form.address,
      gst_number: form.gst_number,
      website_url: form.website_url,
      upi_id: form.upi_id,
      currency_symbol: form.currency_symbol,
      tax_percent: Number(form.tax_percent),
      default_prep_minutes: Number(form.default_prep_minutes),
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      is_open_today: form.is_open_today,
    }).eq("id", restaurant.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Settings saved"); refresh(); }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>

      <Card className="p-4 space-y-4 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Premium subscription</h2>
        </div>
        <div className="text-sm">
          Status: <span className="font-medium capitalize">{restaurant.subscription_status}</span>
          {restaurant.current_period_end && (
            <> · Renews <span className="font-medium">{new Date(restaurant.current_period_end).toLocaleDateString()}</span></>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Brand details</h2>
        <div><Label>Brand / Café name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Tagline</Label><Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>UPI ID</Label><Input value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} /></div>
        </div>
        <div><Label>Business address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>GST number</Label><Input value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} /></div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-semibold">Operations</h2>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Currency</Label><Input value={form.currency_symbol} onChange={e => setForm({ ...form, currency_symbol: e.target.value })} /></div>
          <div><Label>Tax %</Label><Input type="number" step="0.01" value={form.tax_percent} onChange={e => setForm({ ...form, tax_percent: Number(e.target.value) })} /></div>
          <div><Label>Prep (min)</Label><Input type="number" value={form.default_prep_minutes} onChange={e => setForm({ ...form, default_prep_minutes: Number(e.target.value) })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Opens</Label><Input type="time" value={form.opening_time} onChange={e => setForm({ ...form, opening_time: e.target.value })} /></div>
          <div><Label>Closes</Label><Input type="time" value={form.closing_time} onChange={e => setForm({ ...form, closing_time: e.target.value })} /></div>
        </div>
        <div className="flex items-center justify-between">
          <Label>Open today</Label>
          <Switch checked={form.is_open_today} onCheckedChange={v => setForm({ ...form, is_open_today: v })} />
        </div>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Save changes</Button>
      </Card>
    </div>
  );
}
