import { useEffect, useState } from "react";
import { ShoppingCart, CalendarIcon, Filter } from "lucide-react";
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

  // Filters
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

  const handleSearch = () => fetchSolicitudes();

  // Summary
  const totalEstimado = solicitudes.reduce((s, x) => s + x.monto_estimado, 0);
  const aprobadas = solicitudes.filter((s) => ["aprobada", "comprada", "rendida", "cerrada"].includes(s.estado)).length;
  const pendientes = solicitudes.filter((s) => ["borrador", "enviada", "en revisión"].includes(s.estado)).length;

  return (
    <PageShell
      title="Compras"
      description="Gestión de solicitudes, aprobaciones y rendiciones"
      icon={ShoppingCart}
      actions={<NuevaSolicitudDialog onCreated={fetchSolicitudes} />}
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-sm text-muted-foreground font-medium">Período:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(fechaDesde, "dd MMM yyyy", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={fechaDesde} onSelect={(d) => d && setFechaDesde(d)} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">—</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(fechaHasta, "dd MMM yyyy", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={fechaHasta} onSelect={(d) => d && setFechaHasta(d)} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS_COMPRA.map((e) => (
              <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar..."
            className="w-[200px]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Estimado</p>
          <p className="text-xl font-mono font-bold text-foreground">${totalEstimado.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Aprobadas / En Proceso</p>
          <p className="text-xl font-mono font-bold text-success">{aprobadas}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pendientes</p>
          <p className="text-xl font-mono font-bold text-warning-foreground">{pendientes}</p>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-lg overflow-hidden">
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
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td>
                </tr>
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay solicitudes. Usa "Nueva Solicitud" para comenzar.
                  </td>
                </tr>
              ) : (
                solicitudes.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "dd/MM/yyyy")}
                    </td>
                    <td className="p-3 text-foreground font-medium">{s.titulo}</td>
                    <td className="p-3 text-foreground">{s.solicitante}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">{s.tipo_gasto}</Badge>
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-foreground">
                      ${s.monto_estimado.toLocaleString("es-CL")}
                    </td>
                    <td className="p-3">
                      <Badge className={`text-xs capitalize ${PRIORIDAD_COLOR[s.prioridad] || "bg-muted text-muted-foreground"}`}>
                        {s.prioridad}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={`text-xs capitalize ${ESTADO_COLOR[s.estado as EstadoCompra] || "bg-muted text-muted-foreground"}`}>
                        {s.estado}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <SolicitudDetailSheet
        solicitud={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={() => { fetchSolicitudes(); }}
      />
    </PageShell>
  );
}
