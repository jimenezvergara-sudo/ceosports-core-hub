import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/cuotas" element={<Cuotas />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
