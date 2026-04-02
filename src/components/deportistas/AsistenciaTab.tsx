import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Plus, Users, Check, X, AlertCircle, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSesiones, useAsistencia } from "@/hooks/use-deportistas";
import { useCategorias, usePersonas } from "@/hooks/use-relational-data";
import { motion } from "framer-motion";

const ESTADOS = [
  { value: "presente", label: "Presente", icon: Check, color: "bg-green-500/10 text-green-700 border-green-200" },
  { value: "ausente", label: "Ausente", icon: X, color: "bg-red-500/10 text-red-700 border-red-200" },
  { value: "justificado", label: "Justificado", icon: AlertCircle, color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
  { value: "lesionada", label: "Lesionada", icon: HeartPulse, color: "bg-orange-500/10 text-orange-700 border-orange-200" },
];

export default function AsistenciaTab() {
  const { clubId } = useAuth();
  const { sesiones, loading, refetch } = useSesiones();
  const { categorias } = useCategorias();
  const { personas } = usePersonas();
  const [openNew, setOpenNew] = useState(false);
  const [selectedSesion, setSelectedSesion] = useState<string | null>(null);
  const { asistencia, refetch: refetchAsis } = useAsistencia(selectedSesion);
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [horaInicio, setHoraInicio] = useState("16:00");
  const [horaFin, setHoraFin] = useState("18:00");
  const [catId, setCatId] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  const crearSesion = async () => {
    if (!fecha || !catId || !clubId) return;
    setSaving(true);
    const { data, error } = await supabase.from("sesiones_entrenamiento" as any).insert({
      club_id: clubId, categoria_id: catId, fecha: format(fecha, "yyyy-MM-dd"),
      hora_inicio: horaInicio, hora_fin: horaFin, notas: notas || null,
    } as any).select("id").single();
    if (error) { toast.error("Error al crear sesión"); setSaving(false); return; }

    // Get personas in this category
    const { data: pcData } = await supabase.from("persona_categoria" as any)
      .select("persona_id").eq("categoria_id", catId).eq("club_id", clubId);
    const personaIds = ((pcData as any[]) ?? []).map((p: any) => p.persona_id);

    if (personaIds.length > 0) {
      const rows = personaIds.map((pid: string) => ({
        sesion_id: (data as any).id, persona_id: pid, club_id: clubId, estado: "presente",
      }));
      await supabase.from("asistencia_entrenamiento" as any).insert(rows as any);
    }

    toast.success("Sesión creada");
    setSaving(false);
    setOpenNew(false);
    setSelectedSesion((data as any).id);
    refetch();
    refetchAsis();
  };

  const updateEstado = async (asistId: string, estado: string) => {
    await supabase.from("asistencia_entrenamiento" as any).update({ estado } as any).eq("id", asistId);
    refetchAsis();
  };

  const filteredSesiones = filterCat === "all" ? sesiones : sesiones.filter(s => s.categoria_id === filterCat);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setOpenNew(true)}><Plus className="w-4 h-4 mr-1" /> Nueva Sesión</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Session list */}
        <div className="md:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> :
            filteredSesiones.length === 0 ? <p className="text-sm text-muted-foreground">Sin sesiones</p> :
            filteredSesiones.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={cn("p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedSesion === s.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}
                onClick={() => setSelectedSesion(s.id)}>
                <p className="font-medium text-sm">{format(new Date(s.fecha + "T12:00:00"), "dd MMM yyyy", { locale: es })}</p>
                <p className="text-xs text-muted-foreground">{s.hora_inicio?.slice(0,5)} - {s.hora_fin?.slice(0,5)}</p>
                <Badge variant="outline" className="mt-1 text-xs">{s.categoria_nombre || "Sin categoría"}</Badge>
              </motion.div>
            ))}
        </div>

        {/* Attendance marking */}
        <div className="md:col-span-2">
          {selectedSesion ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deportista</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asistencia.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.persona_apellido}, {a.persona_nombre}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-center flex-wrap">
                          {ESTADOS.map(e => (
                            <button key={e.value} onClick={() => updateEstado(a.id, e.value)}
                              className={cn("px-2 py-1 rounded-md text-xs font-medium border transition-all",
                                a.estado === e.value ? e.color + " ring-1 ring-offset-1" : "bg-muted/30 text-muted-foreground hover:bg-muted")}>
                              {e.label}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {asistencia.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground text-sm py-8">Sin deportistas en esta sesión</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm border rounded-lg">
              <div className="text-center"><Users className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>Selecciona una sesión</p></div>
            </div>
          )}
        </div>
      </div>

      {/* New session dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Sesión de Entrenamiento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoría</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.rama})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !fecha && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fecha} onSelect={setFecha} className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora inicio</Label><Input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} /></div>
              <div><Label>Hora fin</Label><Input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} /></div>
            </div>
            <div><Label>Notas</Label><Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional" /></div>
          </div>
          <DialogFooter><Button onClick={crearSesion} disabled={saving || !catId || !fecha}>{saving ? "Creando..." : "Crear Sesión"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
