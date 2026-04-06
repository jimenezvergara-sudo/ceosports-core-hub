import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, CalendarIcon, Settings2, Filter, Trash2, Pencil } from "lucide-react";
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
import { useTiposTest, RegistroTestDeportivo } from "@/hooks/use-deportistas";
import { useCategorias, usePersonasByCategoria, PersonaRow } from "@/hooks/use-relational-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CAT_LABELS: Record<string, string> = { tiro: "Tiro", fisico: "Físico", custom: "Personalizado" };

export default function TestsTab() {
  const { clubId } = useAuth();
  const { categorias } = useCategorias();
  const { tipos, refetch: refetchTipos } = useTiposTest();
  const [catId, setCatId] = useState("");
  const { personas: deportistas } = usePersonasByCategoria(catId || null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  // All test records for category
  const [allRegistros, setAllRegistros] = useState<Record<string, RegistroTestDeportivo[]>>({});
  const [loadingReg, setLoadingReg] = useState(false);

  const fetchAllRegistros = useCallback(async () => {
    if (!deportistas.length || !clubId) { setAllRegistros({}); return; }
    setLoadingReg(true);
    const ids = deportistas.map(d => d.id);
    const { data } = await supabase
      .from("registros_test_deportivo" as any)
      .select("id, persona_id, tipo_test_id, fecha_ejecucion, valor, observaciones, tipos_test_deportivo:tipo_test_id(nombre, unidad_medida, categoria)")
      .in("persona_id", ids)
      .order("fecha_ejecucion", { ascending: false });
    const grouped: Record<string, RegistroTestDeportivo[]> = {};
    ((data as any[]) ?? []).forEach((r: any) => {
      const mapped = {
        ...r,
        tipo_test_nombre: r.tipos_test_deportivo?.nombre,
        tipo_test_unidad: r.tipos_test_deportivo?.unidad_medida,
        tipo_test_categoria: r.tipos_test_deportivo?.categoria,
      };
      if (!grouped[r.persona_id]) grouped[r.persona_id] = [];
      grouped[r.persona_id].push(mapped);
    });
    setAllRegistros(grouped);
    setLoadingReg(false);
  }, [deportistas, clubId]);

  useEffect(() => { fetchAllRegistros(); }, [fetchAllRegistros]);

  const [openReg, setOpenReg] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);
  const [targetPersona, setTargetPersona] = useState("");
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [tipoTestId, setTipoTestId] = useState("");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: "", categoria: "fisico", unidad_medida: "", descripcion: "" });

  // Filters
  const [filterTipoId, setFilterTipoId] = useState("all");

  const abrirRegistrar = (personaId: string) => {
    setTargetPersona(personaId);
    setEditId(null);
    setValor(""); setObs(""); setTipoTestId("");
    setFecha(new Date());
    setOpenReg(true);
  };

  const abrirEditar = (r: RegistroTestDeportivo) => {
    setTargetPersona(r.persona_id);
    setEditId(r.id);
    setTipoTestId(r.tipo_test_id);
    setFecha(new Date(r.fecha_ejecucion + "T12:00:00"));
    setValor(r.valor.toString());
    setObs(r.observaciones || "");
    setOpenReg(true);
  };

  const guardarRegistro = async () => {
    if (!targetPersona || !clubId || !fecha || !tipoTestId || !valor) return;
    setSaving(true);
    const payload = {
      persona_id: targetPersona, club_id: clubId, tipo_test_id: tipoTestId,
      fecha_ejecucion: format(fecha, "yyyy-MM-dd"), valor: parseFloat(valor),
      observaciones: obs || null,
    };
    let error;
    if (editId) {
      ({ error } = await supabase.from("registros_test_deportivo" as any).update(payload as any).eq("id", editId));
    } else {
      ({ error } = await supabase.from("registros_test_deportivo" as any).insert(payload as any));
    }
    if (error) { toast.error("Error al guardar"); setSaving(false); return; }
    toast.success(editId ? "Registro actualizado" : "Registro guardado");
    setSaving(false); setOpenReg(false);
    fetchAllRegistros();
  };

  const eliminarRegistro = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await supabase.from("registros_test_deportivo" as any).delete().eq("id", id);
    toast.success("Registro eliminado");
    fetchAllRegistros();
  };

  const crearTipo = async () => {
    if (!clubId || !nuevoTipo.nombre) return;
    setSaving(true);
    const { error } = await supabase.from("tipos_test_deportivo" as any).insert({ club_id: clubId, ...nuevoTipo } as any);
    if (error) { toast.error("Error"); setSaving(false); return; }
    toast.success("Tipo de test creado");
    setSaving(false); setOpenTipo(false);
    setNuevoTipo({ nombre: "", categoria: "fisico", unidad_medida: "", descripcion: "" });
    refetchTipos();
  };

  const personaRegistros = selectedPersona ? (allRegistros[selectedPersona] || []) : [];
  let filtered = personaRegistros;
  if (filterTipoId !== "all") filtered = filtered.filter(r => r.tipo_test_id === filterTipoId);

  const chartData = filterTipoId !== "all" && filtered.length > 1
    ? [...filtered].reverse().map(r => ({ fecha: format(new Date(r.fecha_ejecucion + "T12:00:00"), "dd/MM"), valor: r.valor }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={catId} onValueChange={(v) => { setCatId(v); setSelectedPersona(null); }}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
          <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.rama})</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setOpenTipo(true)}><Settings2 className="w-4 h-4 mr-1" /> Nuevo Tipo Test</Button>
      </div>

      {catId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Player list */}
          <div className="md:col-span-1 space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {deportistas.length === 0 && <p className="text-sm text-muted-foreground py-4">Sin deportistas</p>}
            {deportistas.map(p => {
              const regs = allRegistros[p.id] || [];
              return (
                <div key={p.id}
                  className={cn("p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedPersona === p.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}
                  onClick={() => setSelectedPersona(p.id)}>
                  <p className="font-medium text-sm">{p.apellido}, {p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{regs.length} registros</p>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          <div className="md:col-span-2 space-y-4">
            {selectedPersona ? (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold text-sm">
                    {deportistas.find(d => d.id === selectedPersona)?.apellido}, {deportistas.find(d => d.id === selectedPersona)?.nombre}
                  </h3>
                  <Button size="sm" onClick={() => abrirRegistrar(selectedPersona)}><Plus className="w-4 h-4 mr-1" /> Registrar Test</Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filterTipoId} onValueChange={setFilterTipoId}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo de test" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tests</SelectItem>
                      {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {chartData.length > 1 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="text-xs font-semibold mb-2">Evolución: {tipos.find(t => t.id === filterTipoId)?.nombre}</h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Test</TableHead>
                        <TableHead>Cat.</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Obs.</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(r => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{format(new Date(r.fecha_ejecucion + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="font-medium text-sm">{r.tipo_test_nombre}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{CAT_LABELS[r.tipo_test_categoria || ""] || r.tipo_test_categoria}</Badge></TableCell>
                          <TableCell className="font-semibold">{r.valor} {r.tipo_test_unidad}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{r.observaciones || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <button onClick={() => abrirEditar(r)} className="p-1 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                              <button onClick={() => eliminarRegistro(r.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin registros</TableCell></TableRow>}
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

      {/* Register test */}
      <Dialog open={openReg} onOpenChange={setOpenReg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Registrar"} Test</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo de Test</Label>
              <Select value={tipoTestId} onValueChange={setTipoTestId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar test" /></SelectTrigger>
                <SelectContent>{tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre} ({CAT_LABELS[t.categoria]})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !fecha && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fecha} onSelect={setFecha} className="p-3 pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Resultado {tipoTestId && tipos.find(t => t.id === tipoTestId) ? `(${tipos.find(t => t.id === tipoTestId)!.unidad_medida})` : ""}</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} /></div>
            <div><Label>Observaciones</Label><Input value={obs} onChange={e => setObs(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={guardarRegistro} disabled={saving || !tipoTestId || !valor}>{saving ? "Guardando..." : "Guardar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New test type */}
      <Dialog open={openTipo} onOpenChange={setOpenTipo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear Tipo de Test</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={nuevoTipo.nombre} onChange={e => setNuevoTipo(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Tiro 45° 2pts" /></div>
            <div>
              <Label>Categoría</Label>
              <Select value={nuevoTipo.categoria} onValueChange={v => setNuevoTipo(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiro">Tiro (Shooting)</SelectItem>
                  <SelectItem value="fisico">Físico (Tests)</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Unidad de Medida</Label><Input value={nuevoTipo.unidad_medida} onChange={e => setNuevoTipo(f => ({ ...f, unidad_medida: e.target.value }))} placeholder="Ej: %, seg, cm" /></div>
            <div><Label>Descripción</Label><Input value={nuevoTipo.descripcion} onChange={e => setNuevoTipo(f => ({ ...f, descripcion: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={crearTipo} disabled={saving || !nuevoTipo.nombre}>{saving ? "Creando..." : "Crear"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
