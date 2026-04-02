import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Ruler, ClipboardCheck, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeline } from "@/hooks/use-deportistas";
import { usePersonas, personaLabel } from "@/hooks/use-relational-data";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

const ICON_MAP = { medicion: Ruler, test: ClipboardCheck, asistencia: Activity };
const COLOR_MAP = { medicion: "border-blue-400 bg-blue-50", test: "border-green-400 bg-green-50", asistencia: "border-purple-400 bg-purple-50" };
const LABEL_MAP = { medicion: "Medición", test: "Test", asistencia: "Asistencia" };

export default function TimelineTab() {
  const { personas } = usePersonas();
  const deportistas = personas.filter(p => ["jugador", "jugadora"].includes(p.tipo_persona.toLowerCase()));
  const [personaId, setPersonaId] = useState("");
  const { events, loading } = useTimeline(personaId || null);

  const exportExcel = () => {
    if (!events.length) return;
    const persona = deportistas.find(p => p.id === personaId);
    const rows = events.map(e => ({
      Fecha: e.fecha, Tipo: LABEL_MAP[e.tipo], Título: e.titulo, Detalle: e.detalle,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, `historial_${persona?.apellido || "deportista"}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={personaId} onValueChange={setPersonaId}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Seleccionar deportista" /></SelectTrigger>
          <SelectContent>{deportistas.map(p => <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>)}</SelectContent>
        </Select>
        {events.length > 0 && (
          <Button variant="outline" onClick={exportExcel}><Download className="w-4 h-4 mr-1" /> Exportar Excel</Button>
        )}
      </div>

      {loading && personaId && <p className="text-sm text-muted-foreground">Cargando historial...</p>}

      {!personaId && (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm border rounded-lg">
          Selecciona un deportista para ver su línea de vida
        </div>
      )}

      {personaId && !loading && events.length === 0 && (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm border rounded-lg">
          Sin registros históricos
        </div>
      )}

      <div className="relative">
        {events.length > 0 && <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />}
        <div className="space-y-3">
          {events.map((e, i) => {
            const Icon = ICON_MAP[e.tipo];
            return (
              <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 ml-1">
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${COLOR_MAP[e.tipo]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{e.titulo}</p>
                    <Badge variant="outline" className="text-[10px]">{LABEL_MAP[e.tipo]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.detalle}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{e.fecha ? format(new Date(e.fecha + "T12:00:00"), "dd MMMM yyyy", { locale: es }) : ""}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
