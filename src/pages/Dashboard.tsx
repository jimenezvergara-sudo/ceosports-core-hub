import { DollarSign, AlertCircle, FileWarning, Users, FolderKanban, ShoppingCart } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import MorosidadChart from "@/components/dashboard/MorosidadChart";
import DocumentosVencimiento from "@/components/dashboard/DocumentosVencimiento";
import TransaccionesRecientes from "@/components/dashboard/TransaccionesRecientes";
import { useDashboard } from "@/hooks/use-dashboard";
import { Progress } from "@/components/ui/progress";

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const {
    loading, kpis, morosidad, documentos, transacciones,
    proyectosKpi, proyectosTop, comprasPendientes, comprasPorEstado, comprasRecientes,
  } = useDashboard();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen administrativo del club</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Caja Actual"
          value={loading ? "…" : fmtCLP(kpis.caja)}
          subtitle={
            kpis.cajaDelta == null
              ? "Sin datos del mes anterior"
              : `${kpis.cajaDelta >= 0 ? "+" : ""}${kpis.cajaDelta.toFixed(1)}% vs. mes anterior`
          }
          icon={DollarSign}
          gradient="kpi-gradient-1"
          delay={0}
        />
        <KPICard
          title="Socios Activos"
          value={loading ? "…" : String(kpis.sociosActivos)}
          subtitle={`${kpis.categoriasCount} categorías`}
          icon={Users}
          gradient="kpi-gradient-2"
          delay={0.1}
        />
        <KPICard
          title="Morosidad"
          value={loading ? "…" : String(kpis.morosos)}
          subtitle={`${kpis.morosidadPct.toFixed(1)}% del total`}
          icon={AlertCircle}
          gradient="kpi-gradient-3"
          delay={0.2}
        />
        <KPICard
          title="Docs por Vencer"
          value={loading ? "…" : String(kpis.docsPorVencer)}
          subtitle="Próximos 30 días"
          icon={FileWarning}
          gradient="kpi-gradient-4"
          delay={0.3}
        />
        <KPICard
          title="Proyectos Activos"
          value={loading ? "…" : String(proyectosKpi.activos)}
          subtitle={`Presupuesto: ${fmtCLP(proyectosKpi.presupuesto)}`}
          icon={FolderKanban}
          gradient="kpi-gradient-1"
          delay={0.4}
        />
        <KPICard
          title="Compras Pendientes"
          value={loading ? "…" : String(comprasPendientes)}
          subtitle="Por aprobar / en revisión"
          icon={ShoppingCart}
          gradient="kpi-gradient-2"
          delay={0.5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MorosidadChart data={morosidad} />
        <DocumentosVencimiento data={documentos} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5 shadow-card">
          <h3 className="text-foreground font-semibold mb-4">Top Proyectos por Ejecución</h3>
          {proyectosTop.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin proyectos registrados</p>
          ) : (
            <div className="space-y-4">
              {proyectosTop.map((p) => (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{p.nombre}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{p.pct.toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(100, p.pct)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {fmtCLP(p.ejecutado)} de {fmtCLP(p.presupuesto)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5 shadow-card">
          <h3 className="text-foreground font-semibold mb-4">Últimas Compras Ejecutadas</h3>
          {comprasRecientes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin compras registradas</p>
          ) : (
            <div className="space-y-3">
              {comprasRecientes.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{c.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.proveedor} · {c.fecha}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground shrink-0">{fmtCLP(c.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransaccionesRecientes data={transacciones} />
    </div>
  );
}
