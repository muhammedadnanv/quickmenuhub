import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  LogOut,
  Store,
  QrCode,
  ExternalLink,
  Loader2,
  ChefHat,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    tagline: "Fresh • Local • Delicious",
    opening_time: "09:00",
    closing_time: "22:00",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRestaurants();
    }
  }, [user]);

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    } else {
      setRestaurants(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const createRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreating(true);

    const slug = generateSlug(newRestaurant.name);

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        name: newRestaurant.name,
        slug,
        tagline: newRestaurant.tagline,
        owner_id: user.id,
        opening_time: newRestaurant.opening_time,
        closing_time: newRestaurant.closing_time,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Error",
          description: "A restaurant with this name already exists. Try a different name.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success!",
        description: "Your restaurant has been created.",
      });
      setRestaurants([data, ...restaurants]);
      setNewRestaurant({ name: "", tagline: "Fresh • Local • Delicious", opening_time: "09:00", closing_time: "22:00" });
      setDialogOpen(false);
      navigate(`/dashboard/${data.id}`);
    }

    setCreating(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">Your Restaurants</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Restaurant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create New Restaurant</DialogTitle>
              </DialogHeader>
              <form onSubmit={createRestaurant} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    placeholder="The Cozy Kitchen"
                    value={newRestaurant.name}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="Fresh • Local • Delicious"
                    value={newRestaurant.tagline}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, tagline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Operating Hours
                  </Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="time"
                      value={newRestaurant.opening_time}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, opening_time: e.target.value })
                      }
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={newRestaurant.closing_time}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, closing_time: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Restaurant
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {restaurants.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">
              No restaurants yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first restaurant to get started with your digital menu.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Restaurant
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-card transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {restaurant.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/menu/${restaurant.slug}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Menu
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/menu/${restaurant.slug}/qr`} target="_blank">
                        <QrCode className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to={`/dashboard/${restaurant.id}`}>
                        Edit Menu
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
