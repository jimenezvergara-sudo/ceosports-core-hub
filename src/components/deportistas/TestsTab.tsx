import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, CalendarIcon, Settings2, Filter } from "lucide-react";
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
import { useTiposTest, useRegistrosTest } from "@/hooks/use-deportistas";
import { usePersonas, personaLabel } from "@/hooks/use-relational-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CAT_LABELS: Record<string, string> = { tiro: "Tiro", fisico: "Físico", custom: "Personalizado" };

export default function TestsTab() {
  const { clubId } = useAuth();
  const { personas } = usePersonas();
  const deportistas = personas.filter(p => ["jugador", "jugadora"].includes(p.tipo_persona.toLowerCase()));
  const { tipos, refetch: refetchTipos } = useTiposTest();
  const [personaId, setPersonaId] = useState("");
  const { registros, refetch } = useRegistrosTest(personaId || null);

  const [openReg, setOpenReg] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [tipoTestId, setTipoTestId] = useState("");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  // New test type form
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: "", categoria: "fisico", unidad_medida: "", descripcion: "" });

  // Filter
  const [filterTipoId, setFilterTipoId] = useState("all");
  const [filterDesde, setFilterDesde] = useState<Date | undefined>();
  const [filterHasta, setFilterHasta] = useState<Date | undefined>();

  const guardarRegistro = async () => {
    if (!personaId || !clubId || !fecha || !tipoTestId || !valor) return;
    setSaving(true);
    const { error } = await supabase.from("registros_test_deportivo" as any).insert({
      persona_id: personaId, club_id: clubId, tipo_test_id: tipoTestId,
      fecha_ejecucion: format(fecha, "yyyy-MM-dd"), valor: parseFloat(valor),
      observaciones: obs || null,
    } as any);
    if (error) { toast.error("Error al guardar"); setSaving(false); return; }
    toast.success("Registro guardado");
    setSaving(false); setOpenReg(false); setValor(""); setObs("");
    refetch();
  };

  const crearTipo = async () => {
    if (!clubId || !nuevoTipo.nombre) return;
    setSaving(true);
    const { error } = await supabase.from("tipos_test_deportivo" as any).insert({
      club_id: clubId, ...nuevoTipo,
    } as any);
    if (error) { toast.error("Error"); setSaving(false); return; }
    toast.success("Tipo de test creado");
    setSaving(false); setOpenTipo(false);
    setNuevoTipo({ nombre: "", categoria: "fisico", unidad_medida: "", descripcion: "" });
    refetchTipos();
  };

  let filtered = registros;
  if (filterTipoId !== "all") filtered = filtered.filter(r => r.tipo_test_id === filterTipoId);
  if (filterDesde) filtered = filtered.filter(r => r.fecha_ejecucion >= format(filterDesde, "yyyy-MM-dd"));
  if (filterHasta) filtered = filtered.filter(r => r.fecha_ejecucion <= format(filterHasta, "yyyy-MM-dd"));

  // Chart for selected test type
  const chartTestId = filterTipoId !== "all" ? filterTipoId : null;
  const chartData = chartTestId
    ? [...filtered].reverse().map(r => ({ fecha: format(new Date(r.fecha_ejecucion + "T12:00:00"), "dd/MM"), valor: r.valor }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={personaId} onValueChange={setPersonaId}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Seleccionar deportista" /></SelectTrigger>
          <SelectContent>{deportistas.map(p => <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>)}</SelectContent>
        </Select>
        {personaId && <Button onClick={() => setOpenReg(true)}><Plus className="w-4 h-4 mr-1" /> Registrar Test</Button>}
        <Button variant="outline" onClick={() => setOpenTipo(true)}><Settings2 className="w-4 h-4 mr-1" /> Nuevo Tipo Test</Button>
      </div>

      {personaId && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterTipoId} onValueChange={setFilterTipoId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo de test" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tests</SelectItem>
              {tipos.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm"><CalendarIcon className="w-3 h-3 mr-1" />{filterDesde ? format(filterDesde, "dd/MM/yy") : "Desde"}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDesde} onSelect={setFilterDesde} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm"><CalendarIcon className="w-3 h-3 mr-1" />{filterHasta ? format(filterHasta, "dd/MM/yy") : "Hasta"}</Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterHasta} onSelect={setFilterHasta} className="p-3 pointer-events-auto" /></PopoverContent>
          </Popover>
          {(filterDesde || filterHasta) && <Button variant="ghost" size="sm" onClick={() => { setFilterDesde(undefined); setFilterHasta(undefined); }}>Limpiar</Button>}
        </div>
      )}

      {chartData.length > 1 && (
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Evolución: {tipos.find(t => t.id === chartTestId)?.nombre}</h3>
          <ResponsiveContainer width="100%" height={200}>
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

      {personaId && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{format(new Date(r.fecha_ejecucion + "T12:00:00"), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-medium text-sm">{r.tipo_test_nombre}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{CAT_LABELS[r.tipo_test_categoria || ""] || r.tipo_test_categoria}</Badge></TableCell>
                  <TableCell className="font-semibold">{r.valor} {r.tipo_test_unidad}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.observaciones || "-"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin registros</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Register test result */}
      <Dialog open={openReg} onOpenChange={setOpenReg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Resultado de Test</DialogTitle></DialogHeader>
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
            <div><Label>Unidad de Medida</Label><Input value={nuevoTipo.unidad_medida} onChange={e => setNuevoTipo(f => ({ ...f, unidad_medida: e.target.value }))} placeholder="Ej: %, seg, cm, reps" /></div>
            <div><Label>Descripción</Label><Input value={nuevoTipo.descripcion} onChange={e => setNuevoTipo(f => ({ ...f, descripcion: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={crearTipo} disabled={saving || !nuevoTipo.nombre}>{saving ? "Creando..." : "Crear"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
