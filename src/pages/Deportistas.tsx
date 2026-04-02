import { Dumbbell } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AsistenciaTab from "@/components/deportistas/AsistenciaTab";
import BiometriaTab from "@/components/deportistas/BiometriaTab";
import TestsTab from "@/components/deportistas/TestsTab";
import TimelineTab from "@/components/deportistas/TimelineTab";

export default function Deportistas() {
  return (
    <PageShell title="Deportistas" description="Control de asistencia, biometría, tests deportivos e historial" icon={Dumbbell}>
      <Tabs defaultValue="asistencia" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="biometria">PF Lab</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="timeline">Línea de Vida</TabsTrigger>
        </TabsList>
        <TabsContent value="asistencia"><AsistenciaTab /></TabsContent>
        <TabsContent value="biometria"><BiometriaTab /></TabsContent>
        <TabsContent value="tests"><TestsTab /></TabsContent>
        <TabsContent value="timeline"><TimelineTab /></TabsContent>
      </Tabs>
    </PageShell>
  );
}
