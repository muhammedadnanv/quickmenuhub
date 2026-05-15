import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PublicMenu from "./pages/PublicMenu";
import PublicQRCode from "./pages/PublicQRCode";
import NotFound from "./pages/NotFound";
import CafeLayout from "./components/cafe/CafeLayout";
import POS from "./pages/cafe/POS";
import OrdersPage from "./pages/cafe/Orders";
import MenuAdmin from "./pages/cafe/MenuAdmin";
import Reports from "./pages/cafe/Reports";
import CafeSettings from "./pages/cafe/CafeSettings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Posters from "./pages/cafe/Posters";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/cafe/:restaurantId" element={<CafeLayout />}>
              <Route index element={<POS />} />
              <Route path="pos" element={<POS />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="menu" element={<MenuAdmin />} />
              <Route path="posters" element={<Posters />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<CafeSettings />} />
            </Route>
            <Route path="/menu/:slug" element={<PublicMenu />} />
            <Route path="/menu/:slug/qr" element={<PublicQRCode />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
