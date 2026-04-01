import { useEffect, useState } from "react";
import { ShoppingCart, CalendarIcon, Filter, ChevronDown, Search, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PageShell from "@/components/shared/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import NuevaSolicitudDialog from "@/components/compras/NuevaSolicitudDialog";
import SolicitudDetailSheet from "@/components/compras/SolicitudDetailSheet";
import { ESTADOS_COMPRA, ESTADO_COLOR, PRIORIDAD_COLOR } from "@/data/comprasConstants";
import type { EstadoCompra } from "@/data/comprasConstants";

interface Solicitud {
  id: string;
  titulo: string;
  descripcion: string;
  categoria_equipo: string | null;
  tipo_gasto: string;
  proyecto_asociado: string | null;
  cantidad: number;
  monto_estimado: number;
  prioridad: string;
  fecha_requerida: string | null;
  proveedor_sugerido: string | null;
  justificacion: string | null;
  estado: string;
  solicitante: string;
  created_at: string;
}

export default function Compras() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Solicitud | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const now = new Date();
  const [fechaDesde, setFechaDesde] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
  const [fechaHasta, setFechaHasta] = useState<Date>(now);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");

  const fetchSolicitudes = async () => {
    setLoading(true);
    const desde = format(fechaDesde, "yyyy-MM-dd");
    const hasta = format(fechaHasta, "yyyy-MM-dd");

    let query = supabase
      .from("solicitudes_compra" as any)
      .select("*")
      .gte("created_at", `${desde}T00:00:00`)
      .lte("created_at", `${hasta}T23:59:59`)
      .order("created_at", { ascending: false });

    if (filtroEstado !== "todos") {
      query = query.eq("estado", filtroEstado);
    }

    const { data } = await query;
    let results = (data as unknown as Solicitud[]) ?? [];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      results = results.filter(
        (s) =>
          s.titulo.toLowerCase().includes(q) ||
          s.solicitante.toLowerCase().includes(q) ||
          (s.categoria_equipo && s.categoria_equipo.toLowerCase().includes(q)) ||
          (s.proyecto_asociado && s.proyecto_asociado.toLowerCase().includes(q))
      );
    }

    setSolicitudes(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchSolicitudes();
  }, [fechaDesde, fechaHasta, filtroEstado]);

  const totalEstimado = solicitudes.reduce((s, x) => s + x.monto_estimado, 0);
  const aprobadas = solicitudes.filter((s) => ["aprobada", "comprada", "rendida", "cerrada"].includes(s.estado)).length;
  const pendientes = solicitudes.filter((s) => ["borrador", "enviada", "en revisión"].includes(s.estado)).length;

  const activeFilters = (filtroEstado !== "todos" ? 1 : 0) + (busqueda.trim() ? 1 : 0);

  return (
    <PageShell
      title="Compras"
      description="Solicitudes, aprobaciones y rendiciones"
      icon={ShoppingCart}
      actions={<NuevaSolicitudDialog onCreated={fetchSolicitudes} />}
    >
      {/* Search bar - always visible */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar solicitud..."
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchSolicitudes()}
          />
          {busqueda && (
            <button onClick={() => { setBusqueda(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between mb-2 md:w-auto">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
              {activeFilters > 0 && (
                <Badge variant="secondary" className="text-xs h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {activeFilters}
                </Badge>
              )}
            </span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", filtersOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-card border border-border rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date from */}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Desde</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{format(fechaDesde, "dd MMM yyyy", { locale: es })}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaDesde} onSelect={(d) => d && setFechaDesde(d)} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date to */}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Hasta</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">{format(fechaHasta, "dd MMM yyyy", { locale: es })}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaHasta} onSelect={(d) => d && setFechaHasta(d)} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Estado */}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Estado</label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    {ESTADOS_COMPRA.map((e) => (
                      <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Apply */}
              <div className="flex items-end">
                <Button onClick={fetchSolicitudes} className="w-full h-10">Aplicar</Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Est.</p>
          <p className="text-base sm:text-xl font-mono font-bold text-foreground">${totalEstimado.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Aprobadas</p>
          <p className="text-base sm:text-xl font-mono font-bold text-success">{aprobadas}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Pendientes</p>
          <p className="text-base sm:text-xl font-mono font-bold text-warning-foreground">{pendientes}</p>
        </div>
      </div>

      {/* Desktop table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Fecha</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Título</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Solicitante</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Tipo Gasto</th>
                <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Monto Est.</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Prioridad</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
              ) : solicitudes.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay solicitudes. Usa "Nueva Solicitud" para comenzar.</td></tr>
              ) : (
                solicitudes.map((s) => (
                  <tr key={s.id} onClick={() => setSelected(s)} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="p-3 font-mono text-xs text-muted-foreground">{format(new Date(s.created_at), "dd/MM/yy")}</td>
                    <td className="p-3 text-foreground font-medium max-w-[200px] truncate">{s.titulo}</td>
                    <td className="p-3 text-foreground">{s.solicitante}</td>
                    <td className="p-3"><Badge variant="secondary" className="text-xs">{s.tipo_gasto}</Badge></td>
                    <td className="p-3 text-right font-mono font-medium text-foreground">${s.monto_estimado.toLocaleString("es-CL")}</td>
                    <td className="p-3"><Badge className={`text-xs capitalize ${PRIORIDAD_COLOR[s.prioridad] || "bg-muted text-muted-foreground"}`}>{s.prioridad}</Badge></td>
                    <td className="p-3"><Badge className={`text-xs capitalize ${ESTADO_COLOR[s.estado as EstadoCompra] || "bg-muted text-muted-foreground"}`}>{s.estado}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Mobile cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="md:hidden space-y-2">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : solicitudes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">
            No hay solicitudes. Usa "Nueva Solicitud" para comenzar.
          </div>
        ) : (
          solicitudes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="w-full text-left bg-card border border-border rounded-lg p-4 hover:bg-muted/30 active:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium text-foreground text-sm leading-tight line-clamp-2">{s.titulo}</h3>
                <Badge className={`text-[10px] capitalize shrink-0 ${ESTADO_COLOR[s.estado as EstadoCompra] || "bg-muted text-muted-foreground"}`}>
                  {s.estado}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{s.solicitante}</span>
                <span className="font-mono font-semibold text-foreground">${s.monto_estimado.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-[10px]">{s.tipo_gasto}</Badge>
                <Badge className={`text-[10px] capitalize ${PRIORIDAD_COLOR[s.prioridad] || "bg-muted text-muted-foreground"}`}>{s.prioridad}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto font-mono">{format(new Date(s.created_at), "dd/MM/yy")}</span>
              </div>
            </button>
          ))
        )}
      </motion.div>

      <SolicitudDetailSheet
        solicitud={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={fetchSolicitudes}
      />
    </PageShell>
  );
}
