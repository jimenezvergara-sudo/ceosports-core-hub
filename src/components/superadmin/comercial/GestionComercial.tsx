import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardComercial from "./DashboardComercial";
import LeadsTab from "./LeadsTab";
import ContratosTab from "./ContratosTab";
import PagosTab from "../PagosTab";
import CobranzaTab from "./CobranzaTab";

export default function GestionComercial() {
  return (
    <Tabs defaultValue="dashboard" className="space-y-4">
      <TabsList className="flex flex-wrap w-full justify-start">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="leads">Leads</TabsTrigger>
        <TabsTrigger value="contratos">Contratos</TabsTrigger>
        <TabsTrigger value="facturacion">Facturación</TabsTrigger>
        <TabsTrigger value="cobranza">Cobranza</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard"><DashboardComercial /></TabsContent>
      <TabsContent value="leads"><LeadsTab /></TabsContent>
      <TabsContent value="contratos"><ContratosTab /></TabsContent>
      <TabsContent value="facturacion"><PagosTab /></TabsContent>
      <TabsContent value="cobranza"><CobranzaTab /></TabsContent>
    </Tabs>
  );
}
