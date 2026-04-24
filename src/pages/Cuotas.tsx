import { useState } from "react";
import { Receipt } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CuotasBandeja from "@/components/cuotas/CuotasBandeja";
import CuotasConfiguracion from "@/components/cuotas/CuotasConfiguracion";
import CuotasBeneficios from "@/components/cuotas/CuotasBeneficios";
import CuotasMorosidad from "@/components/cuotas/CuotasMorosidad";
import MorososAccionable from "@/components/cuotas/MorososAccionable";
import ReconciliacionBancariaDialog from "@/components/cuotas/ReconciliacionBancariaDialog";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams } from "react-router-dom";

export default function Cuotas() {
  const { rolSistema } = useAuth();
  const isAdmin = rolSistema === "admin";
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "bandeja";
  const [tab, setTab] = useState(initialTab);

  return (
    <PageShell
      title="Cuotas"
      description="Cobros mensuales, morosidad y pagos"
      icon={Receipt}
      actions={isAdmin ? <ReconciliacionBancariaDialog /> : undefined}
    >
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-5" : "grid-cols-4"} h-auto`}>
          <TabsTrigger value="bandeja" className="text-xs sm:text-sm py-2">Bandeja</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="morosos" className="text-xs sm:text-sm py-2">Morosos</TabsTrigger>
          )}
          <TabsTrigger value="configuracion" className="text-xs sm:text-sm py-2">Config.</TabsTrigger>
          <TabsTrigger value="beneficios" className="text-xs sm:text-sm py-2">Beneficios</TabsTrigger>
          <TabsTrigger value="morosidad" className="text-xs sm:text-sm py-2">Morosidad</TabsTrigger>
        </TabsList>

        <TabsContent value="bandeja" className="mt-4">
          <CuotasBandeja />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="morosos" className="mt-4">
            <MorososAccionable />
          </TabsContent>
        )}
        <TabsContent value="configuracion" className="mt-4">
          <CuotasConfiguracion />
        </TabsContent>
        <TabsContent value="beneficios" className="mt-4">
          <CuotasBeneficios />
        </TabsContent>
        <TabsContent value="morosidad" className="mt-4">
          <CuotasMorosidad />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
