import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, CalendarIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMediciones } from "@/hooks/use-deportistas";
import { usePersonas, personaLabel } from "@/hooks/use-relational-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function BiometriaTab() {
  const { clubId } = useAuth();
  const { personas } = usePersonas();
  const deportistas = personas.filter(p => ["jugador", "jugadora"].includes(p.tipo_persona.toLowerCase()));
  const [personaId, setPersonaId] = useState("");
  const { mediciones, loading, refetch } = useMediciones(personaId || null);
  const [openNew, setOpenNew] = useState(false);
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [form, setForm] = useState({ peso: "", talla: "", envergadura: "", alcance: "", talla_padre: "", talla_madre: "", observaciones: "" });
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!personaId || !clubId || !fecha) return;
    setSaving(true);
    const { error } = await supabase.from("mediciones_biometricas" as any).insert({
      persona_id: personaId, club_id: clubId, fecha_medicion: format(fecha, "yyyy-MM-dd"),
      peso: form.peso ? parseFloat(form.peso) : null,
      talla: form.talla ? parseFloat(form.talla) : null,
      envergadura: form.envergadura ? parseFloat(form.envergadura) : null,
      alcance: form.alcance ? parseFloat(form.alcance) : null,
      talla_padre: form.talla_padre ? parseFloat(form.talla_padre) : null,
      talla_madre: form.talla_madre ? parseFloat(form.talla_madre) : null,
      observaciones: form.observaciones || null,
    } as any);
    if (error) { toast.error("Error al guardar"); setSaving(false); return; }
    toast.success("Medición registrada");
    setSaving(false);
    setOpenNew(false);
    setForm({ peso: "", talla: "", envergadura: "", alcance: "", talla_padre: "", talla_madre: "", observaciones: "" });
    refetch();
  };

  // Projected height (Khamis-Roche simplified): (talla_padre + talla_madre) / 2 * factor
  const ultimaMedicion = mediciones[0];
  const proyeccion = ultimaMedicion?.talla_padre && ultimaMedicion?.talla_madre
    ? ((ultimaMedicion.talla_padre + ultimaMedicion.talla_madre) / 2 * 1.08).toFixed(1) : null;

  const chartData = [...mediciones].reverse().map(m => ({
    fecha: format(new Date(m.fecha_medicion + "T12:00:00"), "dd/MM/yy"),
    Talla: m.talla, Peso: m.peso,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={personaId} onValueChange={setPersonaId}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Seleccionar deportista" /></SelectTrigger>
          <SelectContent>{deportistas.map(p => <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>)}</SelectContent>
        </Select>
        {personaId && <Button onClick={() => setOpenNew(true)}><Plus className="w-4 h-4 mr-1" /> Nueva Medición</Button>}
      </div>

      {personaId && mediciones.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Línea de Crecimiento</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Talla" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Peso" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {proyeccion && (
            <div className="border rounded-lg p-4 flex flex-col justify-center items-center">
              <p className="text-sm text-muted-foreground">Estatura Proyectada</p>
              <p className="text-3xl font-bold text-primary">{proyeccion} cm</p>
              <p className="text-xs text-muted-foreground mt-1">Basado en talla de padres</p>
              {ultimaMedicion?.talla && (
                <p className="text-sm mt-2">Talla actual: <span className="font-semibold">{ultimaMedicion.talla} cm</span>
                  <span className="text-muted-foreground ml-1">({(parseFloat(proyeccion) - ultimaMedicion.talla).toFixed(1)} cm restantes)</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {personaId && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Talla (cm)</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Envergadura</TableHead>
                <TableHead>Alcance</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediciones.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{format(new Date(m.fecha_medicion + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{m.talla ?? "-"}</TableCell>
                  <TableCell>{m.peso ?? "-"}</TableCell>
                  <TableCell>{m.envergadura ?? "-"}</TableCell>
                  <TableCell>{m.alcance ?? "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{m.observaciones || "-"}</TableCell>
                </TableRow>
              ))}
              {mediciones.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin mediciones registradas</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Medición Biométrica</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fecha de Medición</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !fecha && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fecha} onSelect={setFecha} className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Talla (cm)</Label><Input type="number" step="0.1" value={form.talla} onChange={e => setForm(f => ({ ...f, talla: e.target.value }))} /></div>
              <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} /></div>
              <div><Label>Envergadura (cm)</Label><Input type="number" step="0.1" value={form.envergadura} onChange={e => setForm(f => ({ ...f, envergadura: e.target.value }))} /></div>
              <div><Label>Alcance (cm)</Label><Input type="number" step="0.1" value={form.alcance} onChange={e => setForm(f => ({ ...f, alcance: e.target.value }))} /></div>
              <div><Label>Talla Padre (cm)</Label><Input type="number" step="0.1" value={form.talla_padre} onChange={e => setForm(f => ({ ...f, talla_padre: e.target.value }))} /></div>
              <div><Label>Talla Madre (cm)</Label><Input type="number" step="0.1" value={form.talla_madre} onChange={e => setForm(f => ({ ...f, talla_madre: e.target.value }))} /></div>
            </div>
            <div><Label>Observaciones</Label><Input value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={guardar} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
