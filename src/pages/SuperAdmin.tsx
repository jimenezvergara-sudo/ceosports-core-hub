import { Crown } from "lucide-react";
import { Navigate } from "react-router-dom";
import PageShell from "@/components/shared/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsSuperAdmin } from "@/hooks/use-super-admin";
import ClubesTab from "@/components/superadmin/ClubesTab";
import PlanesTab from "@/components/superadmin/PlanesTab";
import PagosTab from "@/components/superadmin/PagosTab";
import GestionComercial from "@/components/superadmin/comercial/GestionComercial";

export default function SuperAdmin() {
  const { isSuperAdmin, loading } = useIsSuperAdmin();

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Verificando permisos...</div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <PageShell title="Super Administrador" description="Gestión de clubes, planes y pagos de la plataforma" icon={Crown}>
      <Tabs defaultValue="comercial" className="space-y-4">
        <TabsList className="flex flex-wrap w-full justify-start">
          <TabsTrigger value="comercial">Gestión Comercial</TabsTrigger>
          <TabsTrigger value="clubes">Clubes</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
        </TabsList>
        <TabsContent value="comercial"><GestionComercial /></TabsContent>
        <TabsContent value="clubes"><ClubesTab /></TabsContent>
        <TabsContent value="planes"><PlanesTab /></TabsContent>
        <TabsContent value="pagos"><PagosTab /></TabsContent>
      </Tabs>
    </PageShell>
  );
}
