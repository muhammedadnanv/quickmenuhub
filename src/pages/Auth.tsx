import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Coffee } from "lucide-react";

const SYNTH_DOMAIN = "cafe.quickmenuhub.app";

const Auth = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"cafe" | "admin">("cafe");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) routeAfterLogin();
    // eslint-disable-next-line
  }, [user, authLoading]);

  const routeAfterLogin = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", u.id).maybeSingle();
    if (role?.role === "super_admin") return navigate("/admin", { replace: true });
    const { data: cafe } = await supabase.from("restaurants").select("id").eq("owner_id", u.id).maybeSingle();
    if (cafe) return navigate(`/cafe/${cafe.id}/pos`, { replace: true });
    toast({ title: "No café linked", description: "Contact the platform admin.", variant: "destructive" });
    await supabase.auth.signOut();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = mode === "admin" ? identifier.trim() : `${identifier.trim().toLowerCase()}@${SYNTH_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    routeAfterLogin();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
            <Coffee className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-semibold">Quick Menu Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">Premium café management platform</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="cafe"><Coffee className="w-4 h-4 mr-1" />Café</TabsTrigger>
              <TabsTrigger value="admin"><Crown className="w-4 h-4 mr-1" />Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="cafe" className="m-0">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="your-cafe-username" required autoCapitalize="none" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Sign in
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Café accounts are created by the platform admin. Contact us to onboard.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="m-0">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Admin email</Label>
                  <Input type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Sign in as Admin
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
