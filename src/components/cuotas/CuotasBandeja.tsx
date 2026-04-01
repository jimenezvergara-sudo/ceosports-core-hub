import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Filter, ChevronDown, Search, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCategorias } from "@/hooks/use-relational-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import CuotaDetailSheet from "./CuotaDetailSheet";
import GenerarCuotasDialog from "./GenerarCuotasDialog";

interface Cuota {
  id: string;
  persona_id: string;
  apoderado_id: string | null;
  categoria_id: string | null;
  configuracion_id: string | null;
  periodo: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_original: number;
  descuento: number;
  recargo: number;
  monto_final: number;
  estado: string;
  observaciones: string | null;
  created_at: string;
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-warning/15 text-warning-foreground border-warning/30",
  pagada: "bg-success/15 text-success border-success/30",
  vencida: "bg-destructive/15 text-destructive border-destructive/30",
  parcial: "bg-accent text-accent-foreground border-accent",
  anulada: "bg-muted text-muted-foreground border-border",
};

export default function CuotasBandeja() {
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Cuota | null>(null);
  const [personasMap, setPersonasMap] = useState<Record<string, string>>({});
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const { categorias } = useCategorias();

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  useEffect(() => {
    const m: Record<string, string> = {};
    categorias.forEach((c) => { m[c.id] = c.nombre; });
    setCatMap(m);
  }, [categorias]);

  const fetchCuotas = async () => {
    setLoading(true);
    let query = supabase.from("cuotas").select("*").order("fecha_vencimiento", { ascending: false }).limit(500);
    if (filtroEstado !== "todos") query = query.eq("estado", filtroEstado);
    if (filtroCategoria !== "todos") query = query.eq("categoria_id", filtroCategoria);
    if (filtroPeriodo) query = query.eq("periodo", filtroPeriodo);

    const { data } = await query;
    const rows = (data as unknown as Cuota[]) ?? [];
    setCuotas(rows);

    // Fetch persona names for display
    const ids = [...new Set(rows.map((r) => r.persona_id).filter(Boolean))];
    if (ids.length) {
      const { data: personas } = await supabase.from("personas").select("id, nombre, apellido").in("id", ids);
      const pm: Record<string, string> = {};
      (personas as any[])?.forEach((p) => { pm[p.id] = `${p.apellido}, ${p.nombre}`; });
      setPersonasMap(pm);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCuotas(); }, [filtroEstado, filtroCategoria, filtroPeriodo]);

  const filtered = busqueda.trim()
    ? cuotas.filter((c) => {
        const q = busqueda.toLowerCase();
        const name = personasMap[c.persona_id] ?? "";
        return name.toLowerCase().includes(q) || c.periodo.toLowerCase().includes(q);
      })
    : cuotas;

  const activeFilters = (filtroEstado !== "todos" ? 1 : 0) + (filtroCategoria !== "todos" ? 1 : 0) + (filtroPeriodo ? 1 : 0) + (busqueda.trim() ? 1 : 0);

  // Summary
  const totalEmitidas = filtered.length;
  const totalPagadas = filtered.filter((c) => c.estado === "pagada").length;
  const montoRecaudado = filtered.filter((c) => c.estado === "pagada").reduce((s, c) => s + c.monto_final, 0);
  const montoVencido = filtered.filter((c) => c.estado === "vencida").reduce((s, c) => s + c.monto_final, 0);

  // Generate periods for filter
  const periodos = [...new Set(cuotas.map((c) => c.periodo))].sort().reverse();

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2">
        <GenerarCuotasDialog onGenerated={fetchCuotas} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por jugador o periodo..." className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between mb-2 md:w-auto">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />Filtros
              {activeFilters > 0 && <Badge variant="secondary" className="text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">{activeFilters}</Badge>}
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", filtersOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-card border border-border rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Estado</label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="anulada">Anulada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Categoría</label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Periodo</label>
                <Select value={filtroPeriodo || "todos"} onValueChange={(v) => setFiltroPeriodo(v === "todos" ? "" : v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {periodos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Emitidas</p>
          <p className="text-base sm:text-xl font-mono font-bold text-foreground">{totalEmitidas}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Pagadas</p>
          <p className="text-base sm:text-xl font-mono font-bold text-success">{totalPagadas}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Recaudado</p>
          <p className="text-base sm:text-xl font-mono font-bold text-foreground">${montoRecaudado.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Vencido</p>
          <p className="text-base sm:text-xl font-mono font-bold text-destructive">${montoVencido.toLocaleString("es-CL")}</p>
        </div>
      </div>

      {/* Desktop table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Jugador</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Categoría</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Periodo</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Vencimiento</th>
                <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Monto</th>
                <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay cuotas. Genera cuotas desde una configuración activa.</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="p-3 font-medium text-foreground">{personasMap[c.persona_id] ?? "—"}</td>
                  <td className="p-3 text-foreground">{catMap[c.categoria_id ?? ""] ?? "—"}</td>
                  <td className="p-3 text-foreground">{c.periodo}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{format(new Date(c.fecha_vencimiento), "dd/MM/yy")}</td>
                  <td className="p-3 text-right font-mono font-medium text-foreground">${c.monto_final.toLocaleString("es-CL")}</td>
                  <td className="p-3 text-center">
                    <Badge className={`text-xs capitalize border ${ESTADO_COLOR[c.estado] ?? "bg-muted text-muted-foreground"}`}>{c.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Mobile cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="md:hidden space-y-2">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">No hay cuotas.</div>
        ) : filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="w-full text-left bg-card border border-border rounded-lg p-4 hover:bg-muted/30 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-medium text-foreground text-sm leading-tight">{personasMap[c.persona_id] ?? "—"}</h3>
                <p className="text-xs text-muted-foreground">{catMap[c.categoria_id ?? ""] ?? "—"} · {c.periodo}</p>
              </div>
              <Badge className={`text-[10px] capitalize shrink-0 border ${ESTADO_COLOR[c.estado] ?? "bg-muted text-muted-foreground"}`}>{c.estado}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Vence: {format(new Date(c.fecha_vencimiento), "dd/MM/yy")}</span>
              <span className="font-mono font-semibold text-foreground">${c.monto_final.toLocaleString("es-CL")}</span>
            </div>
          </button>
        ))}
      </motion.div>

      <CuotaDetailSheet cuota={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} onUpdated={fetchCuotas} personasMap={personasMap} catMap={catMap} />
    </div>
  );
}
