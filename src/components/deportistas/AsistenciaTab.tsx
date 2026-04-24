import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon, Plus, Users, Check, X, AlertCircle, HeartPulse, Trash2,
  Pencil, ArrowLeft, TrendingDown, Trophy, ClipboardCheck, Save, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  useSesiones, useAsistencia, useAsistenciaStatsCategoria, type SesionEntrenamiento,
} from "@/hooks/use-deportistas";
import { useCategorias } from "@/hooks/use-relational-data";
import { motion } from "framer-motion";

const ESTADOS = [
  { value: "presente", label: "Presente", short: "✅", icon: Check, classes: "bg-success text-success-foreground border-success" },
  { value: "ausente", label: "Ausente", short: "❌", icon: X, classes: "bg-destructive text-destructive-foreground border-destructive" },
  { value: "justificado", label: "Justificada", short: "📝", icon: AlertCircle, classes: "bg-warning text-warning-foreground border-warning" },
] as const;

const LESIONADA = { value: "lesionada", label: "Lesionada", icon: HeartPulse, classes: "bg-orange-500 text-white border-orange-500" };

type Estado = typeof ESTADOS[number]["value"] | "lesionada" | null;

export default function AsistenciaTab() {
  const { clubId, rolSistema } = useAuth();
  const canEdit = rolSistema === "admin" || rolSistema === "staff";
  const { sesiones, loading, refetch } = useSesiones();
  const { categorias } = useCategorias();

  const [view, setView] = useState<"list" | "session">("list");
  const [selectedSesion, setSelectedSesion] = useState<SesionEntrenamiento | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  // New session
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [horaInicio, setHoraInicio] = useState("16:00");
  const [horaFin, setHoraFin] = useState("18:00");
  const [catId, setCatId] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit session metadata
  const [editSesion, setEditSesion] = useState<SesionEntrenamiento | null>(null);
  const [editFecha, setEditFecha] = useState<Date | undefined>();
  const [editHoraInicio, setEditHoraInicio] = useState("");
  const [editHoraFin, setEditHoraFin] = useState("");
  const [editNotas, setEditNotas] = useState("");

  const filteredSesiones = filterCat === "all"
    ? sesiones
    : sesiones.filter((s) => s.categoria_id === filterCat);

  // KPIs del mes para la categoría seleccionada en filtro (o todas)
  const hoy = new Date();
  const desde = format(startOfMonth(hoy), "yyyy-MM-dd");
  const hasta = format(endOfMonth(hoy), "yyyy-MM-dd");
  const { stats } = useAsistenciaStatsCategoria(filterCat === "all" ? null : filterCat, desde, hasta);

  const crearSesion = async () => {
    if (!fecha || !catId || !clubId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("sesiones_entrenamiento" as any)
      .insert({
        club_id: clubId, categoria_id: catId,
        fecha: format(fecha, "yyyy-MM-dd"),
        hora_inicio: horaInicio, hora_fin: horaFin, notas: notas || null,
      } as any)
      .select("id, categoria_id, fecha, hora_inicio, hora_fin, notas")
      .single();
    if (error || !data) { toast.error("Error al crear sesión"); setSaving(false); return; }

    // Auto-cargar jugadoras de la categoría (incluye legacy con club_id NULL).
    // La categoría ya está acotada al club, así que NO filtramos por club_id en persona_categoria.
    const { data: pcData, error: pcError } = await supabase
      .from("persona_categoria" as any)
      .select("persona_id, personas:persona_id(estado, tipo_persona, club_id)")
      .eq("categoria_id", catId);

    if (pcError) console.error("[asistencia] error cargando persona_categoria", pcError);

    const personaIds = ((pcData as any[]) ?? [])
      .filter((p: any) => {
        const per = p.personas;
        if (!per) return false;
        const estadoOk = !per.estado || per.estado === "activo";
        // Solo jugadores; si tipo_persona viene null lo aceptamos por compatibilidad
        const tipoOk = !per.tipo_persona || per.tipo_persona === "jugador";
        // Persona del mismo club o legacy (club_id null)
        const clubOk = !per.club_id || per.club_id === clubId;
        return estadoOk && tipoOk && clubOk;
      })
      .map((p: any) => p.persona_id);

    if (personaIds.length === 0) {
      console.warn("[asistencia] sin jugadoras para categoría", catId, "club", clubId, "filas crudas:", pcData);
    }

    if (personaIds.length > 0) {
      const rows = personaIds.map((pid: string) => ({
        sesion_id: (data as any).id,
        persona_id: pid,
        club_id: clubId,
        estado: "sin_marcar",
      }));
      await supabase.from("asistencia_entrenamiento" as any).insert(rows as any);
    }

    toast.success("Sesión creada — marca asistencia");
    setSaving(false);
    setOpenNew(false);
    const cat = categorias.find((c) => c.id === catId);
    setSelectedSesion({
      id: (data as any).id,
      categoria_id: catId,
      fecha: format(fecha, "yyyy-MM-dd"),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      notas: notas || null,
      categoria_nombre: cat?.nombre,
    });
    setView("session");
    refetch();
  };

  const eliminarSesion = async (id: string) => {
    if (!confirm("¿Eliminar esta sesión y toda su asistencia?")) return;
    await supabase.from("asistencia_entrenamiento" as any).delete().eq("sesion_id", id);
    await supabase.from("sesiones_entrenamiento" as any).delete().eq("id", id);
    toast.success("Sesión eliminada");
    refetch();
  };

  const abrirEditar = (s: SesionEntrenamiento) => {
    setEditSesion(s);
    setEditFecha(new Date(s.fecha + "T12:00:00"));
    setEditHoraInicio(s.hora_inicio?.slice(0, 5) || "16:00");
    setEditHoraFin(s.hora_fin?.slice(0, 5) || "18:00");
    setEditNotas(s.notas || "");
  };

  const guardarEdicion = async () => {
    if (!editSesion || !editFecha) return;
    setSaving(true);
    await supabase.from("sesiones_entrenamiento" as any).update({
      fecha: format(editFecha, "yyyy-MM-dd"),
      hora_inicio: editHoraInicio, hora_fin: editHoraFin,
      notas: editNotas || null,
    } as any).eq("id", editSesion.id);
    toast.success("Sesión actualizada");
    setSaving(false);
    setEditSesion(null);
    refetch();
  };

  if (view === "session" && selectedSesion) {
    return (
      <SessionDetail
        sesion={selectedSesion}
        canEdit={canEdit}
        onBack={() => { setSelectedSesion(null); setView("list"); refetch(); }}
      />
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header acciones */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-full sm:w-[220px] h-10"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        {canEdit && (
          <Button onClick={() => setOpenNew(true)} size="lg" className="h-11 gap-2">
            <Plus className="w-5 h-5" /> Nueva Sesión
          </Button>
        )}
      </div>

      {/* KPIs del mes (si hay categoría filtrada) */}
      {filterCat !== "all" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ClipboardCheck className="w-3.5 h-3.5" /> Sesiones / mes
            </div>
            <div className="text-2xl font-bold">{stats.totalSesiones}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="w-3.5 h-3.5" /> Promedio
            </div>
            <div className={cn("text-2xl font-bold",
              stats.promedioAsistencia >= 80 ? "text-success" :
              stats.promedioAsistencia >= 70 ? "text-warning" : "text-destructive")}>
              {stats.promedioAsistencia}%
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Trophy className="w-3.5 h-3.5 text-success" /> Asistencia perfecta
            </div>
            <div className="text-2xl font-bold text-success">{stats.jugadorasPerfectas.length}</div>
            {stats.jugadorasPerfectas.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                {stats.jugadorasPerfectas.map((p) => p.nombre).join(", ")}
              </p>
            )}
          </Card>
          <Card className={cn("p-3", stats.jugadorasBajas.length > 0 && "border-destructive/40 bg-destructive/5")}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" /> Bajo 70%
            </div>
            <div className="text-2xl font-bold text-destructive">{stats.jugadorasBajas.length}</div>
            {stats.jugadorasBajas.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                {stats.jugadorasBajas.map((p) => `${p.nombre} (${p.porcentaje}%)`).join(", ")}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Lista de sesiones (mobile-first cards) */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
        ) : filteredSesiones.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Sin sesiones registradas</p>
            {canEdit && (
              <Button className="mt-3" onClick={() => setOpenNew(true)}>
                <Plus className="w-4 h-4 mr-1" /> Crear primera sesión
              </Button>
            )}
          </div>
        ) : filteredSesiones.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card
              className="p-3 cursor-pointer hover:bg-muted/40 active:scale-[0.99] transition-all"
              onClick={() => { setSelectedSesion(s); setView("session"); }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-base">
                      {format(new Date(s.fecha + "T12:00:00"), "EEE d 'de' MMM", { locale: es })}
                    </p>
                    <Badge variant="outline" className="text-xs">{s.categoria_nombre || "Sin categoría"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {s.hora_inicio?.slice(0, 5)} – {s.hora_fin?.slice(0, 5)}
                    {s.notas ? ` · ${s.notas}` : ""}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); abrirEditar(s); }}
                      className="p-2 rounded-md hover:bg-muted"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); eliminarSesion(s.id); }}
                      className="p-2 rounded-md hover:bg-destructive/10"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Nueva sesión */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Sesión de Entrenamiento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoría</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>{categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.rama})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left h-11", !fecha && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fecha} onSelect={setFecha} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora inicio</Label><Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="h-11" /></div>
              <div><Label>Hora fin</Label><Input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="h-11" /></div>
            </div>
            <div><Label>Notas</Label><Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Opcional" className="h-11" /></div>
          </div>
          <DialogFooter>
            <Button onClick={crearSesion} disabled={saving || !catId || !fecha} size="lg" className="w-full sm:w-auto">
              {saving ? "Creando..." : "Crear y registrar asistencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar sesión */}
      <Dialog open={!!editSesion} onOpenChange={(o) => !o && setEditSesion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Sesión</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left h-11", !editFecha && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editFecha ? format(editFecha, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={editFecha} onSelect={setEditFecha} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora inicio</Label><Input type="time" value={editHoraInicio} onChange={(e) => setEditHoraInicio(e.target.value)} className="h-11" /></div>
              <div><Label>Hora fin</Label><Input type="time" value={editHoraFin} onChange={(e) => setEditHoraFin(e.target.value)} className="h-11" /></div>
            </div>
            <div><Label>Notas</Label><Input value={editNotas} onChange={(e) => setEditNotas(e.target.value)} className="h-11" /></div>
          </div>
          <DialogFooter>
            <Button onClick={guardarEdicion} disabled={saving} size="lg">{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== Vista detalle de sesión ===================

interface DetailProps {
  sesion: SesionEntrenamiento;
  canEdit: boolean;
  onBack: () => void;
}

function SessionDetail({ sesion, canEdit, onBack }: DetailProps) {
  const { asistencia, refetch } = useAsistencia(sesion.id);
  const [drafts, setDrafts] = useState<Record<string, Estado>>({});
  const [saving, setSaving] = useState(false);

  // Sync drafts on first load / refetch
  useEffect(() => {
    const next: Record<string, Estado> = {};
    asistencia.forEach((a) => {
      next[a.id] = (a.estado === "sin_marcar" ? null : (a.estado as Estado));
    });
    setDrafts(next);
  }, [asistencia]);

  // Edición permitida solo hasta 24h después de la sesión
  const sesionMoment = new Date(`${sesion.fecha}T${sesion.hora_fin || "23:59"}`);
  const horasDesde = differenceInHours(new Date(), sesionMoment);
  const ventanaCerrada = horasDesde > 24;
  const editable = canEdit && !ventanaCerrada;

  const setEstado = (asistId: string, estado: Estado) => {
    if (!editable) return;
    setDrafts((d) => ({ ...d, [asistId]: estado }));
  };

  const marcarTodos = (estado: Estado) => {
    if (!editable) return;
    const next: Record<string, Estado> = {};
    asistencia.forEach((a) => { next[a.id] = estado; });
    setDrafts(next);
  };

  const sinMarcar = Object.values(drafts).filter((v) => v === null).length;
  const marcados = asistencia.length - sinMarcar;
  const dirty = asistencia.some((a) => {
    const original = a.estado === "sin_marcar" ? null : (a.estado as Estado);
    return drafts[a.id] !== original;
  });

  const guardar = async () => {
    setSaving(true);
    const updates = asistencia
      .filter((a) => {
        const original = a.estado === "sin_marcar" ? null : (a.estado as Estado);
        return drafts[a.id] !== original;
      })
      .map((a) => ({
        id: a.id,
        estado: drafts[a.id] ?? "sin_marcar",
      }));

    for (const u of updates) {
      await supabase.from("asistencia_entrenamiento" as any)
        .update({ estado: u.estado } as any).eq("id", u.id);
    }
    toast.success(`Asistencia guardada (${updates.length} cambios)`);
    setSaving(false);
    refetch();
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background -mx-4 px-4 py-3 border-b sm:mx-0 sm:px-0 sm:border-0 sm:static">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base truncate">
              {format(new Date(sesion.fecha + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-xs text-muted-foreground">
              {sesion.categoria_nombre} · {sesion.hora_inicio?.slice(0, 5)} – {sesion.hora_fin?.slice(0, 5)}
            </p>
          </div>
          <Badge variant={sinMarcar === 0 ? "default" : "secondary"} className="shrink-0">
            {marcados}/{asistencia.length}
          </Badge>
        </div>

        {/* Bulk actions */}
        {editable && asistencia.length > 0 && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={() => marcarTodos("presente")}>
              ✅ Todos presentes
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={() => marcarTodos("ausente")}>
              ❌ Todos ausentes
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs shrink-0" onClick={() => marcarTodos(null)}>
              Limpiar
            </Button>
          </div>
        )}

        {ventanaCerrada && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-md bg-muted text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>La ventana de edición (24h) ya cerró. Solo lectura.</span>
          </div>
        )}
      </div>

      {/* Lista de jugadoras — tarjetas grandes */}
      <div className="space-y-2">
        {asistencia.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Sin jugadoras en esta sesión</p>
            <p className="text-xs text-muted-foreground mt-1">Asigna jugadoras a la categoría desde Personas</p>
          </div>
        ) : asistencia.map((a, idx) => {
          const estado = drafts[a.id] ?? null;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.015 }}
            >
              <Card className={cn(
                "p-3 transition-colors",
                estado === null && editable && "border-dashed",
                estado === "ausente" && "bg-destructive/5",
                estado === "presente" && "bg-success/5",
              )}>
                {/* Nombre + número grande */}
                <div className="flex items-center gap-3 mb-2.5 min-h-[28px]">
                  <span className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-base font-semibold leading-tight truncate">
                    {a.persona_apellido}, {a.persona_nombre}
                  </p>
                </div>
                {/* Botones grandes touch-friendly */}
                <div className="grid grid-cols-3 gap-1.5">
                  {ESTADOS.map((e) => {
                    const active = estado === e.value;
                    const Icon = e.icon;
                    return (
                      <button
                        key={e.value}
                        onClick={() => setEstado(a.id, e.value)}
                        disabled={!editable}
                        className={cn(
                          "min-h-[60px] rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all font-medium text-xs sm:text-sm",
                          "active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed",
                          active ? e.classes + " shadow-md" : "border-border bg-background hover:bg-muted/40",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{e.label}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Lesionada como opción secundaria */}
                {editable && (
                  <button
                    onClick={() => setEstado(a.id, estado === "lesionada" ? null : "lesionada")}
                    className={cn(
                      "mt-1.5 w-full h-8 rounded-md border text-xs font-medium flex items-center justify-center gap-1 transition-all",
                      estado === "lesionada" ? LESIONADA.classes : "border-border bg-background text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <HeartPulse className="w-3.5 h-3.5" /> Lesionada
                  </button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky footer guardar */}
      {editable && asistencia.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t p-3 sm:left-[var(--sidebar-width,16rem)]">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="flex-1 text-xs text-muted-foreground">
              {sinMarcar > 0 ? (
                <span><strong className="text-warning">{sinMarcar}</strong> sin marcar</span>
              ) : (
                <span className="text-success">Todas marcadas</span>
              )}
            </div>
            <Button
              onClick={guardar}
              disabled={saving || !dirty}
              size="lg"
              className="h-12 px-6 gap-2 min-w-[160px]"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar asistencia"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
