import { useState } from "react";
import { Receipt } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CuotasBandeja from "@/components/cuotas/CuotasBandeja";
import CuotasConfiguracion from "@/components/cuotas/CuotasConfiguracion";
import CuotasBeneficios from "@/components/cuotas/CuotasBeneficios";
import CuotasMorosidad from "@/components/cuotas/CuotasMorosidad";

export default function Cuotas() {
  const [tab, setTab] = useState("bandeja");

  return (
    <PageShell title="Cuotas" description="Cobros mensuales, morosidad y pagos" icon={Receipt}>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="bandeja" className="text-xs sm:text-sm py-2">Bandeja</TabsTrigger>
          <TabsTrigger value="configuracion" className="text-xs sm:text-sm py-2">Config.</TabsTrigger>
          <TabsTrigger value="beneficios" className="text-xs sm:text-sm py-2">Beneficios</TabsTrigger>
          <TabsTrigger value="morosidad" className="text-xs sm:text-sm py-2">Morosidad</TabsTrigger>
        </TabsList>

        <TabsContent value="bandeja" className="mt-4">
          <CuotasBandeja />
        </TabsContent>
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
