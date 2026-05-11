import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { CafeContext } from "@/components/cafe/CafeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, ImageIcon, Pencil, Upload } from "lucide-react";
import { toast } from "sonner";

interface Category { id: string; name: string; sort_order: number | null }
interface Item {
  id: string; category_id: string; name: string; description: string | null;
  price: number; image_url: string | null; is_available: boolean | null;
  is_special: boolean | null; tax_rate: number | null;
}

export default function MenuAdmin() {
  const { restaurant } = useOutletContext<CafeContext>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState("");
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const symbol = restaurant.currency_symbol || "$";

  const load = async () => {
    const { data: c } = await supabase.from("menu_categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order");
    const { data: i } = await supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("created_at");
    setCategories(c || []); setItems(i || []); setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [restaurant.id]);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    const { error } = await supabase.from("menu_categories").insert({
      name: newCat.trim(), restaurant_id: restaurant.id, sort_order: categories.length,
    });
    if (error) toast.error(error.message); else { toast.success("Category added"); setNewCat(""); load(); }
  };
  const deleteCategory = async (id: string) => {
    if (!confirm("Delete category and all its items?")) return;
    await supabase.from("menu_items").delete().eq("category_id", id);
    await supabase.from("menu_categories").delete().eq("id", id);
    toast.success("Category deleted"); load();
  };
  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    toast.success("Item deleted"); load();
  };
  const toggleAvail = async (it: Item) => {
    await supabase.from("menu_items").update({ is_available: !it.is_available }).eq("id", it.id);
    setItems(items.map(x => x.id === it.id ? { ...x, is_available: !it.is_available } : x));
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${restaurant.id}/items/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("restaurant-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return null; }
    const { data } = supabase.storage.from("restaurant-images").getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  const saveItem = async () => {
    if (!editing || !editing.name || !editing.category_id || editing.price === undefined) {
      toast.error("Name, category and price required"); return;
    }
    setSaving(true);
    const payload: any = {
      restaurant_id: restaurant.id,
      category_id: editing.category_id,
      name: editing.name, description: editing.description || null,
      price: Number(editing.price), image_url: editing.image_url || null,
      is_available: editing.is_available ?? true,
      is_special: editing.is_special ?? false,
      tax_rate: editing.tax_rate ?? 0,
    };
    const res = editing.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    setSaving(false);
    if (res.error) toast.error(res.error.message); else { toast.success("Saved"); setEditing(null); load(); }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-semibold">Menu Administration</h1>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Categories</h2>
        <div className="flex gap-2 mb-3">
          <Input placeholder="New category name" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} />
          <Button onClick={addCategory}><Plus className="w-4 h-4 mr-1" />Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-1 bg-muted rounded-full pl-3 pr-1 py-1 text-sm">
              {c.name}
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteCategory(c.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories. Add one to start.</p>}
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Items ({items.length})</h2>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing({ is_available: true, tax_rate: 0, category_id: categories[0]?.id })} disabled={categories.length === 0}>
                <Plus className="w-4 h-4 mr-1" />Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing?.id ? "Edit Item" : "New Item"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={editing?.name || ""} onChange={e => setEditing({ ...editing!, name: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea rows={2} value={editing?.description || ""} onChange={e => setEditing({ ...editing!, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price ({symbol})</Label><Input type="number" step="0.01" value={editing?.price ?? ""} onChange={e => setEditing({ ...editing!, price: Number(e.target.value) })} /></div>
                  <div><Label>Item tax %</Label><Input type="number" step="0.01" value={editing?.tax_rate ?? 0} onChange={e => setEditing({ ...editing!, tax_rate: Number(e.target.value) })} /></div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={editing?.category_id} onValueChange={(v) => setEditing({ ...editing!, category_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {editing?.image_url ? <img src={editing.image_url} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" hidden onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return;
                        const url = await uploadImage(f);
                        if (url) setEditing({ ...editing!, image_url: url });
                      }} />
                      <Button variant="outline" size="sm" asChild><span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" />Upload</>}</span></Button>
                    </label>
                    {editing?.image_url && <Button variant="ghost" size="sm" onClick={() => setEditing({ ...editing!, image_url: null })}>Remove</Button>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Available</Label>
                  <Switch checked={editing?.is_available ?? true} onCheckedChange={v => setEditing({ ...editing!, is_available: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Mark as special</Label>
                  <Switch checked={editing?.is_special ?? false} onCheckedChange={v => setEditing({ ...editing!, is_special: v })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={saveItem} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(it => (
            <Card key={it.id} className="p-3 flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {it.image_url ? <img src={it.image_url} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{it.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{categories.find(c => c.id === it.category_id)?.name}</p>
                    <p className="text-sm font-semibold text-primary mt-1">{symbol}{Number(it.price).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Switch checked={!!it.is_available} onCheckedChange={() => toggleAvail(it)} />
                    <div className="flex">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(it)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteItem(it.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No items yet.</p>}
        </div>
      </div>
    </div>
  );
}