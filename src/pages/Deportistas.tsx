import { Dumbbell } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AsistenciaTab from "@/components/deportistas/AsistenciaTab";
import BiometriaTab from "@/components/deportistas/BiometriaTab";
import TestsTab from "@/components/deportistas/TestsTab";
import TimelineTab from "@/components/deportistas/TimelineTab";
import CoachTab from "@/components/deportistas/CoachTab";

export default function Deportistas() {
  return (
    <PageShell title="Deportistas" description="Coach, asistencia, biometría, tests e historial" icon={Dumbbell}>
      <Tabs defaultValue="coach" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="coach">Coach</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="biometria">PF Lab</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="timeline">Historial</TabsTrigger>
        </TabsList>
        <TabsContent value="coach"><CoachTab /></TabsContent>
        <TabsContent value="asistencia"><AsistenciaTab /></TabsContent>
        <TabsContent value="biometria"><BiometriaTab /></TabsContent>
        <TabsContent value="tests"><TestsTab /></TabsContent>
        <TabsContent value="timeline"><TimelineTab /></TabsContent>
      </Tabs>
    </PageShell>
  );
}
