import { useEffect, useState, useMemo } from "react";
import { ArrowLeftRight, CalendarIcon, Download, Filter, X, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import PageShell from "@/components/shared/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import NuevaTransaccionDialog from "@/components/transacciones/NuevaTransaccionDialog";
import PagoCuotaRapidoDialog from "@/components/transacciones/PagoCuotaRapidoDialog";
import TransaccionDetailSheet from "@/components/transacciones/TransaccionDetailSheet";
import { categoriasTransaccion } from "@/data/categoriasTransaccion";

interface Transaccion {
  id: string;
  fecha: string;
  tipo: string;
  categoria: string;
  subcategoria: string | null;
  descripcion: string;
  monto: number;
  estado: string;
  metodo_pago: string | null;
  referencia: string | null;
  notas: string | null;
  categoria_deportiva: string | null;
  persona_id: string | null;
  origen_tipo: string | null;
  origen_id: string | null;
  created_at: string;
}

const ORIGEN_LABELS: Record<string, { label: string; color: string }> = {
  compra: { label: "Compra", color: "bg-accent text-accent-foreground" },
  cuota: { label: "Cuota", color: "bg-success/10 text-success" },
  pago_entrenador: { label: "Pago Entrenador", color: "bg-warning/10 text-warning-foreground" },
  manual: { label: "Manual", color: "bg-muted text-muted-foreground" },
};

const ESTADOS = ["Pendiente", "Pagado", "Anulado"];
const ORIGENES = ["manual", "compra", "cuota", "pago_entrenador"];

export default function Transacciones() {
  const [txs, setTxs] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Date filters
  const now = new Date();
  const [fechaDesde, setFechaDesde] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
  const [fechaHasta, setFechaHasta] = useState<Date>(now);

  // Additional filters
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterOrigen, setFilterOrigen] = useState<string>("todos");
  const [filterBusqueda, setFilterBusqueda] = useState("");
  const [filterMontoMin, setFilterMontoMin] = useState("");
  const [filterMontoMax, setFilterMontoMax] = useState("");

  const fetchTxs = async () => {
    setLoading(true);
    const desde = format(fechaDesde, "yyyy-MM-dd");
    const hasta = format(fechaHasta, "yyyy-MM-dd");
    const { data } = await supabase
      .from("transacciones")
      .select("*")
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha", { ascending: false })
      .limit(500);
    setTxs((data as unknown as Transaccion[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTxs();
  }, [fechaDesde, fechaHasta]);

  // Client-side filtering
  const filteredTxs = useMemo(() => {
    return txs.filter((tx) => {
      if (filterTipo !== "todos" && tx.tipo !== filterTipo) return false;
      if (filterCategoria !== "todos" && tx.categoria !== filterCategoria) return false;
      if (filterEstado !== "todos" && tx.estado !== filterEstado) return false;
      if (filterOrigen !== "todos" && (tx.origen_tipo || "manual") !== filterOrigen) return false;
      if (filterBusqueda) {
        const q = filterBusqueda.toLowerCase();
        const match = tx.descripcion.toLowerCase().includes(q)
          || tx.categoria.toLowerCase().includes(q)
          || (tx.subcategoria || "").toLowerCase().includes(q)
          || (tx.referencia || "").toLowerCase().includes(q)
          || (tx.notas || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterMontoMin && tx.monto < parseInt(filterMontoMin)) return false;
      if (filterMontoMax && tx.monto > parseInt(filterMontoMax)) return false;
      return true;
    });
  }, [txs, filterTipo, filterCategoria, filterEstado, filterOrigen, filterBusqueda, filterMontoMin, filterMontoMax]);

  const totalIngresos = filteredTxs
    .filter((t) => t.tipo === "Ingreso" && t.estado !== "Anulado")
    .reduce((s, t) => s + t.monto, 0);
  const totalEgresos = filteredTxs
    .filter((t) => t.tipo === "Egreso" && t.estado !== "Anulado")
    .reduce((s, t) => s + t.monto, 0);
  const balance = totalIngresos - totalEgresos;

  const activeFilterCount = [
    filterTipo !== "todos",
    filterCategoria !== "todos",
    filterEstado !== "todos",
    filterOrigen !== "todos",
    !!filterBusqueda,
    !!filterMontoMin,
    !!filterMontoMax,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterTipo("todos");
    setFilterCategoria("todos");
    setFilterEstado("todos");
    setFilterOrigen("todos");
    setFilterBusqueda("");
    setFilterMontoMin("");
    setFilterMontoMax("");
  };

  // Unique items from data
  const categoriasUnicas = useMemo(() => {
    const set = new Set(txs.map(t => t.categoria));
    return Array.from(set).sort();
  }, [txs]);

  // CSV Export
  const exportCSV = () => {
    const headers = ["Fecha", "Tipo", "Ítem", "Sub Ítem", "Descripción", "Monto", "Estado", "Método de Pago", "Referencia", "Origen", "Categoría Deportiva", "Notas"];
    const rows = filteredTxs.map(tx => [
      tx.fecha,
      tx.tipo,
      tx.categoria,
      tx.subcategoria || "",
      tx.descripcion,
      tx.monto.toString(),
      tx.estado,
      tx.metodo_pago || "",
      tx.referencia || "",
      (ORIGEN_LABELS[tx.origen_tipo || "manual"] || ORIGEN_LABELS.manual).label,
      tx.categoria_deportiva || "",
      (tx.notas || "").replace(/\n/g, " "),
    ]);

    // Add summary
    rows.push([]);
    rows.push(["RESUMEN"]);
    rows.push(["Total Ingresos", "", "", "", "", totalIngresos.toString()]);
    rows.push(["Total Egresos", "", "", "", "", totalEgresos.toString()]);
    rows.push(["Balance", "", "", "", "", balance.toString()]);
    rows.push(["Período", `${format(fechaDesde, "dd/MM/yyyy")} - ${format(fechaHasta, "dd/MM/yyyy")}`]);
    rows.push(["Registros", filteredTxs.length.toString()]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacciones_${format(fechaDesde, "yyyyMMdd")}_${format(fechaHasta, "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell
      title="Transacciones"
      description="Registro de ingresos y egresos del club"
      icon={ArrowLeftRight}
      actions={
        <div className="flex gap-2 flex-wrap">
          <PagoCuotaRapidoDialog onPaid={fetchTxs} />
          <Button variant="outline" className="gap-2" onClick={exportCSV}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
          <NuevaTransaccionDialog onCreated={fetchTxs} />
        </div>
      }
    >
      {/* Date filters + toggle */}
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

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Extended filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-lg p-4 mb-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Búsqueda */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Descripción, referencia, notas..."
                  value={filterBusqueda}
                  onChange={(e) => setFilterBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Tipo</label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Ingreso">Ingreso</SelectItem>
                  <SelectItem value="Egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ítem */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Ítem</label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {categoriasUnicas.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Estado</label>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {ESTADOS.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origen */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Origen</label>
              <Select value={filterOrigen} onValueChange={setFilterOrigen}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {ORIGENES.map(o => (
                    <SelectItem key={o} value={o}>{ORIGEN_LABELS[o]?.label || o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto mínimo */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Monto mín.</label>
              <Input
                type="number"
                placeholder="0"
                value={filterMontoMin}
                onChange={(e) => setFilterMontoMin(e.target.value)}
              />
            </div>

            {/* Monto máximo */}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Monto máx.</label>
              <Input
                type="number"
                placeholder="∞"
                value={filterMontoMax}
                onChange={(e) => setFilterMontoMax(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {filteredTxs.length} de {txs.length} transacciones
          </div>
        </motion.div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Ingresos", value: totalIngresos, color: "text-success" },
          { label: "Egresos", value: totalEgresos, color: "text-destructive" },
          { label: "Balance", value: balance, color: balance >= 0 ? "text-success" : "text-destructive" },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-xl font-mono font-bold ${item.color}`}>
              ${item.value.toLocaleString("es-CL")}
            </p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Fecha</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Descripción</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Ítem</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Origen</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Tipo</th>
                <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Monto</th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
              ) : filteredTxs.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay transacciones que coincidan con los filtros.</td></tr>
              ) : (
                filteredTxs.map((tx) => {
                  const origen = ORIGEN_LABELS[tx.origen_tipo || "manual"] || ORIGEN_LABELS.manual;
                  return (
                    <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="p-3 font-mono text-xs text-muted-foreground">{tx.fecha}</td>
                      <td className="p-3 text-foreground">{tx.descripcion}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="secondary" className="text-xs w-fit">{tx.categoria}</Badge>
                          {tx.subcategoria && <span className="text-[11px] text-muted-foreground">{tx.subcategoria}</span>}
                        </div>
                      </td>
                      <td className="p-3"><Badge className={`text-xs ${origen.color}`}>{origen.label}</Badge></td>
                      <td className="p-3"><Badge variant={tx.tipo === "Ingreso" ? "outline" : "destructive"} className="text-xs">{tx.tipo}</Badge></td>
                      <td className={`p-3 text-right font-mono font-medium ${tx.tipo === "Ingreso" ? "text-success" : "text-destructive"}`}>
                        {tx.tipo === "Ingreso" ? "+" : "-"}${tx.monto.toLocaleString("es-CL")}
                      </td>
                      <td className="p-3">
                        <Badge variant={tx.estado === "Pagado" ? "outline" : tx.estado === "Anulado" ? "destructive" : "secondary"} className="text-xs">{tx.estado}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <TransaccionDetailSheet transaccion={selectedTx} open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)} />
    </PageShell>
  );
}
