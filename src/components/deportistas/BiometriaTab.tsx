import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, CalendarIcon, TrendingUp, Trash2, Pencil } from "lucide-react";
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
import { MedicionBiometrica } from "@/hooks/use-deportistas";
import { useCategorias, usePersonasByCategoria, personaLabel, PersonaRow } from "@/hooks/use-relational-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function BiometriaTab() {
  const { clubId } = useAuth();
  const { categorias } = useCategorias();
  const [catId, setCatId] = useState("");
  const { personas: deportistas } = usePersonasByCategoria(catId || null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  // All measurements for category
  const [allMediciones, setAllMediciones] = useState<Record<string, MedicionBiometrica[]>>({});
  const [loadingMed, setLoadingMed] = useState(false);

  const fetchAllMediciones = useCallback(async () => {
    if (!deportistas.length || !clubId) { setAllMediciones({}); return; }
    setLoadingMed(true);
    const ids = deportistas.map(d => d.id);
    const { data } = await supabase
      .from("mediciones_biometricas" as any)
      .select("*")
      .in("persona_id", ids)
      .order("fecha_medicion", { ascending: false });
    const grouped: Record<string, MedicionBiometrica[]> = {};
    ((data as any[]) ?? []).forEach((m: any) => {
      if (!grouped[m.persona_id]) grouped[m.persona_id] = [];
      grouped[m.persona_id].push(m);
    });
    setAllMediciones(grouped);
    setLoadingMed(false);
  }, [deportistas, clubId]);

  useEffect(() => { fetchAllMediciones(); }, [fetchAllMediciones]);

  const [openNew, setOpenNew] = useState(false);
  const [targetPersona, setTargetPersona] = useState("");
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [form, setForm] = useState({ peso: "", talla: "", envergadura: "", alcance: "", talla_padre: "", talla_madre: "", observaciones: "" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const resetForm = () => setForm({ peso: "", talla: "", envergadura: "", alcance: "", talla_padre: "", talla_madre: "", observaciones: "" });

  const abrirNueva = (personaId: string) => {
    setTargetPersona(personaId);
    setEditId(null);
    resetForm();
    setFecha(new Date());
    setOpenNew(true);
  };

  const abrirEditar = (m: MedicionBiometrica) => {
    setTargetPersona(m.persona_id);
    setEditId(m.id);
    setFecha(new Date(m.fecha_medicion + "T12:00:00"));
    setForm({
      peso: m.peso?.toString() || "", talla: m.talla?.toString() || "",
      envergadura: m.envergadura?.toString() || "", alcance: m.alcance?.toString() || "",
      talla_padre: m.talla_padre?.toString() || "", talla_madre: m.talla_madre?.toString() || "",
      observaciones: m.observaciones || "",
    });
    setOpenNew(true);
  };

  const guardar = async () => {
    if (!targetPersona || !clubId || !fecha) return;
    setSaving(true);
    const payload = {
      persona_id: targetPersona, club_id: clubId, fecha_medicion: format(fecha, "yyyy-MM-dd"),
      peso: form.peso ? parseFloat(form.peso) : null,
      talla: form.talla ? parseFloat(form.talla) : null,
      envergadura: form.envergadura ? parseFloat(form.envergadura) : null,
      alcance: form.alcance ? parseFloat(form.alcance) : null,
      talla_padre: form.talla_padre ? parseFloat(form.talla_padre) : null,
      talla_madre: form.talla_madre ? parseFloat(form.talla_madre) : null,
      observaciones: form.observaciones || null,
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from("mediciones_biometricas" as any).update(payload as any).eq("id", editId));
    } else {
      ({ error } = await supabase.from("mediciones_biometricas" as any).insert(payload as any));
    }
    if (error) { toast.error("Error al guardar"); setSaving(false); return; }
    toast.success(editId ? "Medición actualizada" : "Medición registrada");
    setSaving(false);
    setOpenNew(false);
    resetForm();
    fetchAllMediciones();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta medición?")) return;
    await supabase.from("mediciones_biometricas" as any).delete().eq("id", id);
    toast.success("Medición eliminada");
    fetchAllMediciones();
  };

  const personaMediciones = selectedPersona ? (allMediciones[selectedPersona] || []) : [];
  const ultimaMedicion = personaMediciones[0];
  const proyeccion = ultimaMedicion?.talla_padre && ultimaMedicion?.talla_madre
    ? ((ultimaMedicion.talla_padre + ultimaMedicion.talla_madre) / 2 * 1.08).toFixed(1) : null;
  const chartData = [...personaMediciones].reverse().map(m => ({
    fecha: format(new Date(m.fecha_medicion + "T12:00:00"), "dd/MM/yy"),
    Talla: m.talla, Peso: m.peso,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={catId} onValueChange={(v) => { setCatId(v); setSelectedPersona(null); }}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
          <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.rama})</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {catId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Player list */}
          <div className="md:col-span-1 space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {deportistas.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin deportistas en esta categoría</p>}
            {deportistas.map(p => {
              const meds = allMediciones[p.id] || [];
              const last = meds[0];
              return (
                <div key={p.id}
                  className={cn("p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedPersona === p.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}
                  onClick={() => setSelectedPersona(p.id)}>
                  <p className="font-medium text-sm">{p.apellido}, {p.nombre}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>Talla: {last?.talla ?? "-"}</span>
                    <span>Peso: {last?.peso ?? "-"}</span>
                    <span>{meds.length} med.</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="md:col-span-2 space-y-4">
            {selectedPersona ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {deportistas.find(d => d.id === selectedPersona)?.apellido}, {deportistas.find(d => d.id === selectedPersona)?.nombre}
                  </h3>
                  <Button size="sm" onClick={() => abrirNueva(selectedPersona)}><Plus className="w-4 h-4 mr-1" /> Nueva Medición</Button>
                </div>

                {personaMediciones.length > 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-xs mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Línea de Crecimiento</h4>
                      <ResponsiveContainer width="100%" height={180}>
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
                          <p className="text-sm mt-2">Actual: <span className="font-semibold">{ultimaMedicion.talla} cm</span>
                            <span className="text-muted-foreground ml-1">({(parseFloat(proyeccion) - ultimaMedicion.talla).toFixed(1)} cm restantes)</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Talla</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead>Enverg.</TableHead>
                        <TableHead>Alcance</TableHead>
                        <TableHead>Obs.</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personaMediciones.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm">{format(new Date(m.fecha_medicion + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{m.talla ?? "-"}</TableCell>
                          <TableCell>{m.peso ?? "-"}</TableCell>
                          <TableCell>{m.envergadura ?? "-"}</TableCell>
                          <TableCell>{m.alcance ?? "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{m.observaciones || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <button onClick={() => abrirEditar(m)} className="p-1 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                              <button onClick={() => eliminar(m.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {personaMediciones.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin mediciones</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm border rounded-lg">
                Selecciona una deportista de la lista
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nueva"} Medición Biométrica</DialogTitle></DialogHeader>
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
              <div><Label>Envergadura</Label><Input type="number" step="0.1" value={form.envergadura} onChange={e => setForm(f => ({ ...f, envergadura: e.target.value }))} /></div>
              <div><Label>Alcance</Label><Input type="number" step="0.1" value={form.alcance} onChange={e => setForm(f => ({ ...f, alcance: e.target.value }))} /></div>
              <div><Label>Talla Padre</Label><Input type="number" step="0.1" value={form.talla_padre} onChange={e => setForm(f => ({ ...f, talla_padre: e.target.value }))} /></div>
              <div><Label>Talla Madre</Label><Input type="number" step="0.1" value={form.talla_madre} onChange={e => setForm(f => ({ ...f, talla_madre: e.target.value }))} /></div>
            </div>
            <div><Label>Observaciones</Label><Input value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={guardar} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
