import { useState } from "react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus, Bell, Calendar as CalIcon, Check, Trash2, AlertTriangle,
  Activity, Target, Flame, ClipboardList, ChevronRight, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  useSesiones, useRecordatoriosCoach, useSesionesPreviasPartido, type SesionEntrenamiento,
} from "@/hooks/use-deportistas";
import { useCategorias } from "@/hooks/use-relational-data";
import { cn } from "@/lib/utils";

const PRIO_COLOR: Record<string, string> = {
  alta: "bg-destructive/10 text-destructive border-destructive/30",
  media: "bg-warning/10 text-warning border-warning/30",
  baja: "bg-muted text-muted-foreground border-border",
};

const TIPO_ICON: Record<string, any> = {
  "Técnico": Target, "Físico": Flame, "Táctico": ClipboardList, "Partido": Trophy, "Mixto": Activity,
};

export default function CoachTab() {
  const { clubId, rolSistema, user } = useAuth();
  const canEdit = rolSistema === "admin" || rolSistema === "staff" || rolSistema === "coach";
  const { sesiones } = useSesiones();
  const { recordatorios, refetch: refetchRec } = useRecordatoriosCoach();
  const { categorias } = useCategorias();

  const [openNuevo, setOpenNuevo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [prioridad, setPrioridad] = useState<"baja" | "media" | "alta">("media");
  const [saving, setSaving] = useState(false);

  // Próximos: hoy y futuros (no más allá de 14 días)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const proximas = sesiones
    .filter((s) => {
      const f = parseISO(s.fecha + "T12:00:00");
      const diff = (f.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const proximoPartido = proximas.find((s) => s.tipo_entrenamiento === "Partido");

  const ultimas = sesiones.slice(0, 5);

  const pendientes = recordatorios.filter((r) => r.estado === "pendiente");
  const cumplidos = recordatorios.filter((r) => r.estado === "cumplido").slice(0, 5);
  const vencidos = pendientes.filter((r) => r.fecha_limite && isPast(parseISO(r.fecha_limite + "T23:59:59")) && !isToday(parseISO(r.fecha_limite + "T12:00:00")));
  const hoyRec = pendientes.filter((r) => r.fecha_limite && isToday(parseISO(r.fecha_limite + "T12:00:00")));
  const futuros = pendientes.filter((r) => !r.fecha_limite || (!isToday(parseISO(r.fecha_limite + "T12:00:00")) && !isPast(parseISO(r.fecha_limite + "T23:59:59"))));

  const guardarRec = async () => {
    if (!titulo.trim() || !clubId || !user) return;
    setSaving(true);
    const { error } = await supabase.from("recordatorios_coach" as any).insert({
      club_id: clubId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha_limite: fechaLimite || null,
      prioridad,
      estado: "pendiente",
      created_by: user.id,
    });
    setSaving(false);
    if (error) { toast.error("Error al crear"); console.error(error); return; }
    toast.success("Recordatorio creado");
    setOpenNuevo(false);
    setTitulo(""); setDescripcion(""); setFechaLimite(""); setPrioridad("media");
    refetchRec();
  };

  const marcarCumplido = async (id: string) => {
    await supabase.from("recordatorios_coach" as any)
      .update({ estado: "cumplido", cumplido_at: new Date().toISOString() })
      .eq("id", id);
    refetchRec();
  };

  const eliminarRec = async (id: string) => {
    if (!confirm("¿Eliminar recordatorio?")) return;
    await supabase.from("recordatorios_coach" as any).delete().eq("id", id);
    refetchRec();
  };

  const renderRec = (r: typeof recordatorios[number], options?: { vencido?: boolean }) => (
    <Card key={r.id} className={cn("p-3", options?.vencido && "border-destructive/40 bg-destructive/5")}>
      <div className="flex items-start gap-2">
        <Badge variant="outline" className={cn("text-[10px] shrink-0", PRIO_COLOR[r.prioridad])}>
          {r.prioridad}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight">{r.titulo}</p>
          {r.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{r.descripcion}</p>}
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            {r.fecha_limite && (
              <span className="inline-flex items-center gap-1">
                <CalIcon className="w-3 h-3" />
                {format(parseISO(r.fecha_limite + "T12:00:00"), "d MMM", { locale: es })}
              </span>
            )}
            {r.persona_apellido && <span>· {r.persona_apellido}, {r.persona_nombre}</span>}
          </div>
        </div>
        {canEdit && r.estado === "pendiente" && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => marcarCumplido(r.id)} className="p-1.5 rounded-md hover:bg-success/10" aria-label="Marcar cumplido">
              <Check className="w-4 h-4 text-success" />
            </button>
            {r.created_by === user?.id && (
              <button onClick={() => eliminarRec(r.id)} className="p-1.5 rounded-md hover:bg-destructive/10" aria-label="Eliminar">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-5 pb-4">
      {/* HEADER stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CalIcon className="w-3 h-3" /> Próximas (14d)
          </div>
          <div className="text-2xl font-bold mt-0.5">{proximas.length}</div>
        </Card>
        <Card className={cn("p-3", hoyRec.length > 0 && "border-warning/40 bg-warning/5")}>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Bell className="w-3 h-3" /> Para hoy
          </div>
          <div className={cn("text-2xl font-bold mt-0.5", hoyRec.length > 0 && "text-warning")}>{hoyRec.length}</div>
        </Card>
        <Card className={cn("p-3", vencidos.length > 0 && "border-destructive/40 bg-destructive/5")}>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Vencidos
          </div>
          <div className={cn("text-2xl font-bold mt-0.5", vencidos.length > 0 && "text-destructive")}>{vencidos.length}</div>
        </Card>
      </div>

      {/* PRÓXIMO PARTIDO con correlación */}
      {proximoPartido && (
        <PartidoCard partido={proximoPartido} />
      )}

      {/* PRÓXIMAS SESIONES */}
      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <CalIcon className="w-4 h-4" /> Próximas sesiones
        </h3>
        {proximas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin sesiones programadas.</p>
        ) : (
          <div className="space-y-2">
            {proximas.slice(0, 5).map((s) => {
              const Icon = TIPO_ICON[s.tipo_entrenamiento || "Mixto"] || Activity;
              const f = parseISO(s.fecha + "T12:00:00");
              const label = isToday(f) ? "HOY" : isTomorrow(f) ? "MAÑANA" : format(f, "EEE d MMM", { locale: es }).toUpperCase();
              return (
                <Card key={s.id} className="p-3 flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
                    isToday(f) ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium truncate">
                      {s.categoria_nombre} · {s.hora_inicio?.slice(0, 5)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.tipo_entrenamiento || "—"}{s.intensidad ? ` · ${s.intensidad}` : ""}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* RECORDATORIOS */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" /> Recordatorios
          </h3>
          {canEdit && (
            <Button size="sm" onClick={() => setOpenNuevo(true)} className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo
            </Button>
          )}
        </div>

        {pendientes.length === 0 && cumplidos.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin recordatorios.</p>
        )}

        {vencidos.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-[11px] font-semibold uppercase text-destructive">Vencidos</p>
            {vencidos.map((r) => renderRec(r, { vencido: true }))}
          </div>
        )}
        {hoyRec.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-[11px] font-semibold uppercase text-warning">Hoy</p>
            {hoyRec.map((r) => renderRec(r))}
          </div>
        )}
        {futuros.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Próximos</p>
            {futuros.map((r) => renderRec(r))}
          </div>
        )}
        {cumplidos.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t">
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Cumplidos recientes</p>
            {cumplidos.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <Check className="w-3 h-3 text-success" />
                <span className="line-through truncate flex-1">{r.titulo}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ÚLTIMAS BITÁCORAS */}
      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Últimas bitácoras
        </h3>
        {ultimas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin sesiones registradas.</p>
        ) : (
          <div className="space-y-2">
            {ultimas.map((s) => {
              const Icon = TIPO_ICON[s.tipo_entrenamiento || "Mixto"] || Activity;
              return (
                <Card key={s.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {format(parseISO(s.fecha + "T12:00:00"), "d MMM", { locale: es })} · {s.categoria_nombre}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.tipo_entrenamiento || "—"}{s.intensidad ? ` · ${s.intensidad}` : ""}
                      </p>
                      {s.objetivo_dia && <p className="text-xs mt-1 line-clamp-2">{s.objetivo_dia}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* DIALOG nuevo recordatorio */}
      <Dialog open={openNuevo} onOpenChange={setOpenNuevo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo recordatorio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Hablar con María sobre lesión" autoFocus />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} placeholder="Opcional" className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha límite</Label>
                <Input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select value={prioridad} onValueChange={(v) => setPrioridad(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={guardarRec} disabled={saving || !titulo.trim()} className="w-full sm:w-auto">
              {saving ? "Guardando..." : "Crear recordatorio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-componente: tarjeta del próximo partido con correlación de últimas 3 sesiones
function PartidoCard({ partido }: { partido: SesionEntrenamiento }) {
  const { previas } = useSesionesPreviasPartido(partido);

  return (
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-primary" />
        <p className="text-xs font-bold uppercase text-primary tracking-wide">Próximo partido</p>
      </div>
      <p className="text-base font-semibold">
        {format(parseISO(partido.fecha + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
      </p>
      <p className="text-xs text-muted-foreground">
        {partido.categoria_nombre} · {partido.hora_inicio?.slice(0, 5)}
      </p>
      {previas.length > 0 && (
        <div className="mt-3 pt-3 border-t border-primary/20">
          <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-2">Últimos 3 entrenamientos</p>
          <div className="space-y-1">
            {previas.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {format(parseISO(s.fecha + "T12:00:00"), "EEE d MMM", { locale: es })}
                </span>
                <span className="font-medium">
                  {s.tipo_entrenamiento || "—"} <span className="text-muted-foreground">· {s.intensidad || "—"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
