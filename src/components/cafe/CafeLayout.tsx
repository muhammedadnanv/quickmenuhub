import { ReactNode, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Coffee, ShoppingCart, ListOrdered, BookOpen, BarChart3, Settings, LogOut, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface CafeContext {
  restaurant: any;
  role: "admin" | "staff";
  refresh: () => void;
}

function NavItems({ role, restaurantId }: { role: string; restaurantId: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = [
    { to: `/cafe/${restaurantId}/pos`, label: "POS", icon: ShoppingCart, roles: ["admin", "staff"] },
    { to: `/cafe/${restaurantId}/orders`, label: "Orders", icon: ListOrdered, roles: ["admin", "staff"] },
    { to: `/cafe/${restaurantId}/menu`, label: "Menu", icon: BookOpen, roles: ["admin"] },
    { to: `/cafe/${restaurantId}/reports`, label: "Reports", icon: BarChart3, roles: ["admin"] },
    { to: `/cafe/${restaurantId}/settings`, label: "Settings", icon: Settings, roles: ["admin"] },
  ].filter((i) => i.roles.includes(role));

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.to}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 ${isActive ? "bg-primary/10 text-primary font-medium" : ""}`
              }
            >
              <item.icon className="w-4 h-4" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export default function CafeLayout() {
  const { restaurantId } = useParams();
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [role, setRole] = useState<"admin" | "staff" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user || !restaurantId) return;
    const { data: r } = await supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle();
    if (!r) {
      navigate("/dashboard");
      return;
    }
    setRestaurant(r);
    if (r.owner_id === user.id) {
      setRole("admin");
    } else {
      const { data: rl } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId);
      if (!rl || rl.length === 0) {
        navigate("/dashboard");
        return;
      }
      setRole(rl.some((x) => x.role === "admin") ? "admin" : "staff");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, restaurantId]);

  // Redirect /cafe/:id → /cafe/:id/pos
  useEffect(() => {
    if (restaurant && location.pathname === `/cafe/${restaurantId}`) {
      navigate(`/cafe/${restaurantId}/pos`, { replace: true });
    }
  }, [restaurant, location.pathname, restaurantId, navigate]);

  if (loading || authLoading || !restaurant || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-display font-semibold text-sm truncate">{restaurant.name}</p>
                <Badge variant="secondary" className="text-[10px] capitalize h-4 px-1.5">{role}</Badge>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <NavItems role={role} restaurantId={restaurantId!} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-2 border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="w-4 h-4" />
                  <span>All cafés</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-3 gap-2 bg-card">
            <SidebarTrigger />
            <div className="font-display font-semibold truncate">{restaurant.name}</div>
            <span className="text-xs text-muted-foreground hidden sm:inline">— Quick Menu Hub Café Management</span>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet context={{ restaurant, role, refresh: load } satisfies CafeContext} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}