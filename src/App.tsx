import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Personas from "@/pages/Personas";
import Transacciones from "@/pages/Transacciones";
import Proyectos from "@/pages/Proyectos";
import Documentos from "@/pages/Documentos";
import Staff from "@/pages/Staff";
import Organizacion from "@/pages/Organizacion";
import Compras from "@/pages/Compras";
import Proveedores from "@/pages/Proveedores";
import Cuotas from "@/pages/Cuotas";
import Asambleas from "@/pages/Asambleas";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import ClubSelector from "@/pages/ClubSelector";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, clubActual } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  if (!clubActual) return <ClubSelector />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/personas" element={<Personas />} />
        <Route path="/transacciones" element={<Transacciones />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/organizacion" element={<Organizacion />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/cuotas" element={<Cuotas />} />
        <Route path="/asambleas" element={<Asambleas />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
