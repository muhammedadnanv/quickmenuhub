import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Clock, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  created_at: string;
  opening_time: string | null;
  closing_time: string | null;
  is_open_today: boolean | null;
  logo_url: string | null;
  cover_image_url: string | null;
}

interface RestaurantSettingsProps {
  restaurant: Restaurant;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: Restaurant) => void;
}

const RestaurantSettings = ({
  restaurant,
  userId,
  open,
  onOpenChange,
  onUpdate,
}: RestaurantSettingsProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [form, setForm] = useState({
    name: restaurant.name,
    tagline: restaurant.tagline || "",
    opening_time: restaurant.opening_time?.slice(0, 5) || "09:00",
    closing_time: restaurant.closing_time?.slice(0, 5) || "22:00",
    is_open_today: restaurant.is_open_today ?? true,
    logo_url: restaurant.logo_url || "",
    cover_image_url: restaurant.cover_image_url || "",
  });

  const uploadImage = async (
    file: File,
    type: "logo" | "cover"
  ): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${restaurant.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("restaurant-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      return null;
    }

    const { data } = supabase.storage
      .from("restaurant-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const url = await uploadImage(file, "logo");
    if (url) {
      setForm({ ...form, logo_url: url });
    }
    setUploadingLogo(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const url = await uploadImage(file, "cover");
    if (url) {
      setForm({ ...form, cover_image_url: url });
    }
    setUploadingCover(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const { data, error } = await supabase
      .from("restaurants")
      .update({
        name: form.name,
        tagline: form.tagline,
        opening_time: form.opening_time,
        closing_time: form.closing_time,
        is_open_today: form.is_open_today,
        logo_url: form.logo_url || null,
        cover_image_url: form.cover_image_url || null,
      })
      .eq("id", restaurant.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings saved!",
        description: "Your restaurant has been updated.",
      });
      onUpdate(data);
      onOpenChange(false);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Restaurant Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Logo
            </Label>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <div className="relative">
                  <img
                    src={form.logo_url}
                    alt="Logo"
                    className="w-20 h-20 rounded-xl object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_url: "" })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {uploadingLogo ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                </label>
              )}
              <p className="text-sm text-muted-foreground">
                Square image recommended (e.g., 200x200)
              </p>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Cover Image
            </Label>
            {form.cover_image_url ? (
              <div className="relative">
                <img
                  src={form.cover_image_url}
                  alt="Cover"
                  className="w-full h-32 rounded-xl object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cover_image_url: "" })}
                  className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="w-full h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                {uploadingCover ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mt-2">
                      Upload cover image
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                />
              </label>
            )}
            <p className="text-sm text-muted-foreground">
              Wide image recommended (e.g., 1200x400)
            </p>
          </div>

          {/* Restaurant Name */}
          <div className="space-y-2">
            <Label htmlFor="settings-name">Restaurant Name</Label>
            <Input
              id="settings-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="settings-tagline">Tagline</Label>
            <Input
              id="settings-tagline"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>

          {/* Operating Hours */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Operating Hours
            </Label>
            <div className="flex gap-3 items-center">
              <Input
                type="time"
                value={form.opening_time}
                onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                className="flex-1"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                value={form.closing_time}
                onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Open Today Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Open Today</Label>
              <p className="text-sm text-muted-foreground">
                Toggle off if closed for the day
              </p>
            </div>
            <Switch
              checked={form.is_open_today}
              onCheckedChange={(checked) =>
                setForm({ ...form, is_open_today: checked })
              }
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSettings;
