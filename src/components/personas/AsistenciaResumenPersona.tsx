import { ClipboardCheck } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { useAsistenciaPersona } from "@/hooks/use-deportistas";
import { cn } from "@/lib/utils";

interface Props {
  personaId: string;
}

/**
 * Widget compacto que muestra el % de asistencia del mes actual
 * y el mes anterior para una persona dada.
 * Se renderiza en la ficha integral de la persona.
 */
export default function AsistenciaResumenPersona({ personaId }: Props) {
  const hoy = new Date();
  const mesActualDesde = format(startOfMonth(hoy), "yyyy-MM-dd");
  const mesActualHasta = format(endOfMonth(hoy), "yyyy-MM-dd");
  const mesAnterior = subMonths(hoy, 1);
  const mesAnteriorDesde = format(startOfMonth(mesAnterior), "yyyy-MM-dd");
  const mesAnteriorHasta = format(endOfMonth(mesAnterior), "yyyy-MM-dd");

  const { data: actual } = useAsistenciaPersona(personaId, mesActualDesde, mesActualHasta);
  const { data: anterior } = useAsistenciaPersona(personaId, mesAnteriorDesde, mesAnteriorHasta);

  const colorClass = (pct: number) =>
    pct >= 80 ? "text-success" : pct >= 70 ? "text-warning" : "text-destructive";

  const renderMes = (label: string, data: typeof actual) => {
    if (!data || data.total === 0) {
      return (
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-muted-foreground">—</p>
          <p className="text-[10px] text-muted-foreground">Sin sesiones</p>
        </div>
      );
    }
    return (
      <div className="space-y-0.5">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold leading-none", colorClass(data.porcentaje))}>
          {data.porcentaje}%
        </p>
        <p className="text-[10px] text-muted-foreground">
          {data.presentes}/{data.total} sesiones
        </p>
      </div>
    );
  };

  return (
    <div className="glass rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Asistencia a entrenamientos</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {renderMes(format(hoy, "MMMM", { locale: es }), actual)}
        {renderMes(format(mesAnterior, "MMMM", { locale: es }), anterior)}
      </div>
    </div>
  );
}
