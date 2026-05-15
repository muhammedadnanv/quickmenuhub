import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CafeContext } from "@/components/cafe/CafeLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Trash2, Loader2, Download, Eye, Mail, Phone, Globe } from "lucide-react";
import { toast } from "sonner";

interface MenuItem { id: string; name: string; price: number; description: string | null; }
interface Poster {
  id: string; title: string; theme_color: string; accent_color: string;
  contact_email: string | null; contact_phone: string | null; website_url: string | null;
  item_ids: string[]; created_at: string; created_by: string;
}

const PRESETS = [
  { name: "Terracotta", theme: "#c4654a", accent: "#2d1810" },
  { name: "Forest", theme: "#2C5F2D", accent: "#1a1a1a" },
  { name: "Midnight", theme: "#1E2761", accent: "#0a0a0a" },
  { name: "Berry", theme: "#6D2E46", accent: "#2a1020" },
  { name: "Ocean", theme: "#065A82", accent: "#021a2a" },
  { name: "Coral", theme: "#F96167", accent: "#3a0d10" },
];

export default function Posters() {
  const { restaurant } = useOutletContext<CafeContext>();
  const { user } = useAuth();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Poster> | null>(null);
  const [previewing, setPreviewing] = useState<Poster | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: i }] = await Promise.all([
      supabase.from("posters" as any).select("*").eq("cafe_id", restaurant.id).order("created_at", { ascending: false }),
      supabase.from("menu_items").select("id,name,price,description").eq("restaurant_id", restaurant.id).eq("is_available", true).order("name"),
    ]);
    setPosters((p as any) || []); setItems((i as any) || []); setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [restaurant.id]);

  const startNew = () => setEditing({
    title: `${restaurant.name} — Menu`,
    theme_color: PRESETS[0].theme,
    accent_color: PRESETS[0].accent,
    contact_email: restaurant.email || "",
    contact_phone: restaurant.phone || "",
    website_url: restaurant.website_url || "",
    item_ids: [],
  });

  const save = async () => {
    if (!editing || !user) return;
    setSaving(true);
    const payload: any = {
      cafe_id: restaurant.id,
      created_by: user.id,
      title: editing.title || "Menu Poster",
      theme_color: editing.theme_color,
      accent_color: editing.accent_color,
      contact_email: editing.contact_email || null,
      contact_phone: editing.contact_phone || null,
      website_url: editing.website_url || null,
      item_ids: editing.item_ids || [],
    };
    const q = editing.id
      ? supabase.from("posters" as any).update(payload).eq("id", editing.id)
      : supabase.from("posters" as any).insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Poster saved"); setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this poster?")) return;
    const { error } = await supabase.from("posters" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const toggleItem = (id: string) => {
    if (!editing) return;
    const cur = editing.item_ids || [];
    setEditing({ ...editing, item_ids: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  const downloadPoster = async (poster: Poster) => {
    const node = document.getElementById(`poster-render-${poster.id}`);
    if (!node) { toast.error("Open preview first"); return; }
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"), import("jspdf"),
      ]);
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const w = 210, h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, Math.min(h, 297));
      pdf.save(`${poster.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch (e: any) { toast.error("PDF failed: " + e.message); }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Menu Posters</h1>
          <p className="text-sm text-muted-foreground">Create branded posters with QR access for your café.</p>
        </div>
        <Button onClick={startNew}><Plus className="w-4 h-4 mr-2" />New poster</Button>
      </div>

      {posters.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No posters yet. Click <span className="font-semibold text-foreground">New poster</span> to create your first one.
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posters.map(p => (
            <Card key={p.id} className="p-4 space-y-3">
              <div className="aspect-[3/4] rounded-md overflow-hidden border" style={{ background: p.theme_color }}>
                <div className="h-full flex flex-col items-center justify-center text-white p-4 text-center">
                  <div className="font-display text-lg font-bold leading-tight line-clamp-2">{p.title}</div>
                  <div className="text-xs opacity-80 mt-2">{p.item_ids.length} items</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setPreviewing(p)}><Eye className="w-3 h-3 mr-1" />Preview</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit poster" : "New poster"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} /></div>
                <div>
                  <Label>Color theme</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {PRESETS.map(p => (
                      <button key={p.name} type="button" onClick={() => setEditing({ ...editing, theme_color: p.theme, accent_color: p.accent })}
                        className={`p-2 rounded border text-xs flex items-center gap-2 ${editing.theme_color === p.theme ? "ring-2 ring-primary" : ""}`}>
                        <span className="w-4 h-4 rounded-full" style={{ background: p.theme }} />{p.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1"><Label className="text-xs">Theme</Label><Input type="color" value={editing.theme_color} onChange={e => setEditing({ ...editing, theme_color: e.target.value })} /></div>
                    <div className="flex-1"><Label className="text-xs">Accent</Label><Input type="color" value={editing.accent_color} onChange={e => setEditing({ ...editing, accent_color: e.target.value })} /></div>
                  </div>
                </div>
                <div><Label>Email</Label><Input type="email" value={editing.contact_email || ""} onChange={e => setEditing({ ...editing, contact_email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={editing.contact_phone || ""} onChange={e => setEditing({ ...editing, contact_phone: e.target.value })} /></div>
                <div><Label>Website</Label><Input value={editing.website_url || ""} onChange={e => setEditing({ ...editing, website_url: e.target.value })} placeholder="https://" /></div>
              </div>
              <div>
                <Label>Featured items ({(editing.item_ids || []).length})</Label>
                <div className="border rounded-md max-h-72 overflow-y-auto mt-1 divide-y">
                  {items.length === 0 && <p className="p-3 text-sm text-muted-foreground">Add menu items first.</p>}
                  {items.map(it => (
                    <label key={it.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={(editing.item_ids || []).includes(it.id)} onCheckedChange={() => toggleItem(it.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{it.name}</p>
                        <p className="text-xs text-muted-foreground">{restaurant.currency_symbol}{Number(it.price).toFixed(2)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save poster</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!previewing} onOpenChange={(v) => !v && setPreviewing(null)}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewing?.title}</DialogTitle></DialogHeader>
          {previewing && (
            <>
              <PosterRender poster={previewing} restaurant={restaurant} items={items} />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={() => setPreviewing(null)}>Close</Button>
                <Button onClick={() => downloadPoster(previewing)}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PosterRender({ poster, restaurant, items }: { poster: Poster; restaurant: any; items: MenuItem[] }) {
  const featured = items.filter(i => poster.item_ids.includes(i.id));
  const menuUrl = `${window.location.origin}/menu/${restaurant.slug}`;
  const symbol = restaurant.currency_symbol || "₹";
  return (
    <div id={`poster-render-${poster.id}`} className="bg-white" style={{ width: "100%", aspectRatio: "210/297", color: poster.accent_color, fontFamily: "system-ui, sans-serif" }}>
      <div className="h-full flex flex-col">
        {/* Header band */}
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: poster.theme_color, color: "#fff" }}>
          {restaurant.logo_url && <img src={restaurant.logo_url} alt="" crossOrigin="anonymous" className="w-12 h-12 rounded-full bg-white object-contain p-1" />}
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-widest opacity-80">Quick Menu Hub</div>
            <div className="font-bold text-2xl leading-tight truncate">{restaurant.name}</div>
            {restaurant.tagline && <div className="text-xs opacity-90 truncate">{restaurant.tagline}</div>}
          </div>
        </div>

        {/* Title */}
        <div className="px-6 pt-5 pb-2 text-center">
          <h2 className="font-bold text-3xl" style={{ color: poster.theme_color }}>{poster.title}</h2>
          <div className="h-0.5 w-16 mx-auto mt-2" style={{ background: poster.theme_color }} />
        </div>

        {/* Items */}
        <div className="flex-1 px-6 py-3 overflow-hidden">
          {featured.length === 0 ? (
            <p className="text-center text-sm opacity-60 mt-6">No items selected.</p>
          ) : (
            <div className="space-y-2">
              {featured.slice(0, 12).map(it => (
                <div key={it.id} className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{it.name}</span>
                  <span className="flex-1 border-b border-dotted opacity-30" />
                  <span className="font-bold text-sm" style={{ color: poster.theme_color }}>{symbol}{Number(it.price).toFixed(2)}</span>
                </div>
              ))}
              {featured.length > 12 && <p className="text-xs text-center opacity-60 pt-2">+ {featured.length - 12} more on the digital menu</p>}
            </div>
          )}
        </div>

        {/* Footer with QR + contact */}
        <div className="px-6 py-4 grid grid-cols-[auto,1fr] gap-4 items-center" style={{ background: `${poster.theme_color}15` }}>
          <div className="bg-white p-2 rounded">
            <QRCodeSVG value={menuUrl} size={96} level="H" fgColor={poster.accent_color} />
          </div>
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm" style={{ color: poster.theme_color }}>Scan to view full menu</div>
            {poster.contact_phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{poster.contact_phone}</div>}
            {poster.contact_email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{poster.contact_email}</div>}
            {poster.website_url && <div className="flex items-center gap-1"><Globe className="w-3 h-3" />{poster.website_url}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}