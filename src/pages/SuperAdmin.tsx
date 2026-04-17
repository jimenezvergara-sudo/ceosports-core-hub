import { Crown } from "lucide-react";
import { Navigate } from "react-router-dom";
import PageShell from "@/components/shared/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsSuperAdmin } from "@/hooks/use-super-admin";
import ClubesTab from "@/components/superadmin/ClubesTab";
import PlanesTab from "@/components/superadmin/PlanesTab";
import PagosTab from "@/components/superadmin/PagosTab";

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
      <Tabs defaultValue="clubes" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="clubes">Clubes</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
        </TabsList>
        <TabsContent value="clubes"><ClubesTab /></TabsContent>
        <TabsContent value="planes"><PlanesTab /></TabsContent>
        <TabsContent value="pagos"><PagosTab /></TabsContent>
      </Tabs>
    </PageShell>
  );
}
