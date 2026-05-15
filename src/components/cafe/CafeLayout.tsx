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
import { Coffee, ShoppingCart, ListOrdered, BookOpen, BarChart3, Settings, LogOut, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import SubscriptionPaywall from "./SubscriptionPaywall";

export interface CafeContext {
  restaurant: any;
  role: "owner" | "super_admin";
  refresh: () => void;
}

function NavItems({ role, restaurantId }: { role: string; restaurantId: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = [
    { to: `/cafe/${restaurantId}/pos`, label: "POS", icon: ShoppingCart },
    { to: `/cafe/${restaurantId}/orders`, label: "Orders", icon: ListOrdered },
    { to: `/cafe/${restaurantId}/menu`, label: "Menu", icon: BookOpen },
    { to: `/cafe/${restaurantId}/posters`, label: "Posters", icon: ImageIcon },
    { to: `/cafe/${restaurantId}/reports`, label: "Reports", icon: BarChart3 },
    { to: `/cafe/${restaurantId}/settings`, label: "Settings", icon: Settings },
  ];

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
  const [role, setRole] = useState<"owner" | "super_admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const [subActive, setSubActive] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user || !restaurantId) return;
    const { data: r } = await supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle();
    if (!r) {
      navigate("/admin");
      return;
    }
    setRestaurant(r);
    const { data: rl } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    const isSuper = rl?.role === "super_admin";
    if (isSuper) setRole("super_admin");
    else if (r.owner_id === user.id) setRole("owner");
    else { navigate("/auth"); return; }
    // Subscription check (super admin always allowed)
    const active = isSuper || (r.subscription_status === "active" && r.current_period_end && new Date(r.current_period_end) > new Date());
    setSubActive(active);
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

  if (!subActive) {
    return <SubscriptionPaywall restaurant={restaurant} onPaid={load} onSignOut={async () => { await signOut(); navigate("/"); }} />;
  }

  const daysLeft = restaurant.current_period_end
    ? Math.ceil((new Date(restaurant.current_period_end).getTime() - Date.now()) / 86400000)
    : null;
  const showRenewalAlert = role !== "super_admin" && daysLeft !== null && daysLeft <= 7;

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
                <SidebarMenuButton onClick={() => navigate(role === "super_admin" ? "/admin" : "/")}>
                  <ArrowLeft className="w-4 h-4" />
                  <span>{role === "super_admin" ? "All cafés" : "Home"}</span>
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
            {showRenewalAlert && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Your premium subscription {daysLeft! <= 0 ? "expires today" : `expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}.
                    Renew now to avoid service interruption.
                  </span>
                </div>
                <Button size="sm" onClick={() => navigate(`/cafe/${restaurantId}/settings`)}>Renew now</Button>
              </div>
            )}
            <Outlet context={{ restaurant, role, refresh: load } satisfies CafeContext} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}