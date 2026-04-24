import { DollarSign, AlertCircle, FileWarning, Users, FolderKanban, ShoppingCart, CheckCircle2, AlertTriangle } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import MorosidadChart from "@/components/dashboard/MorosidadChart";
import DocumentosVencimiento from "@/components/dashboard/DocumentosVencimiento";
import TransaccionesRecientes from "@/components/dashboard/TransaccionesRecientes";
import ProximasAcciones from "@/components/dashboard/ProximasAcciones";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { useCronCuotas } from "@/hooks/use-cron-cuotas";
import { Progress } from "@/components/ui/progress";

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { rolSistema } = useAuth();
  const isAdmin = rolSistema === "admin";
  const isStaff = rolSistema === "staff" || rolSistema === "coach";
  // Viewer/fan: dashboard estático informativo, sin KPIs financieros ni clics

  const showFinancialKPIs = isAdmin;
  // Staff puede ver datos no financieros (personas, docs, proyectos)
  const showNonFinancialKPIs = isAdmin || isStaff;
  // Solo admin tiene drill-down (clics que abren vistas filtradas)
  const allowDrilldown = isAdmin;

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

      {/* Próximas acciones (admin + staff con contenido relevante) */}
      <ProximasAcciones />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {showFinancialKPIs && (
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
            to={allowDrilldown ? "/transacciones" : undefined}
          />
        )}

        {showNonFinancialKPIs && (
          <KPICard
            title="Socios Activos"
            value={loading ? "…" : String(kpis.sociosActivos)}
            subtitle={`${kpis.categoriasCount} categorías`}
            icon={Users}
            gradient="kpi-gradient-2"
            delay={0.1}
            to={allowDrilldown ? "/personas" : undefined}
          />
        )}

        {showFinancialKPIs && (
          <KPICard
            title="Morosidad"
            value={loading ? "…" : String(kpis.morosos)}
            subtitle={`${kpis.morosidadPct.toFixed(1)}% del total`}
            icon={AlertCircle}
            gradient="kpi-gradient-3"
            delay={0.2}
            to={allowDrilldown ? "/cuotas?tab=morosos" : undefined}
          />
        )}

        {showNonFinancialKPIs && (
          <KPICard
            title="Docs por Vencer"
            value={loading ? "…" : String(kpis.docsPorVencer)}
            subtitle="Próximos 30 días"
            icon={FileWarning}
            gradient="kpi-gradient-4"
            delay={0.3}
            to={allowDrilldown ? "/documentos" : undefined}
          />
        )}

        {showNonFinancialKPIs && (
          <KPICard
            title="Proyectos Activos"
            value={loading ? "…" : String(proyectosKpi.activos)}
            subtitle={showFinancialKPIs ? `Presupuesto: ${fmtCLP(proyectosKpi.presupuesto)}` : "En ejecución"}
            icon={FolderKanban}
            gradient="kpi-gradient-1"
            delay={0.4}
            to={allowDrilldown ? "/proyectos" : undefined}
          />
        )}

        {showFinancialKPIs && (
          <KPICard
            title="Compras Pendientes"
            value={loading ? "…" : String(comprasPendientes)}
            subtitle="Por aprobar / en revisión"
            icon={ShoppingCart}
            gradient="kpi-gradient-2"
            delay={0.5}
            to={allowDrilldown ? "/compras" : undefined}
          />
        )}
      </div>

      {/* Sección financiera: solo admin */}
      {showFinancialKPIs && (
        <>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold">Compras por Estado</h3>
                <span className="text-xs text-muted-foreground">{comprasPendientes} pendientes</span>
              </div>
              {comprasPorEstado.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sin solicitudes registradas</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {comprasPorEstado.map((e) => (
                    <div key={e.estado} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-foreground">{e.estado}</span>
                      <span className="font-semibold text-foreground">{e.count}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-border/40 pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Compras recientes
                </h4>
                {comprasRecientes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Sin compras registradas</p>
                ) : (
                  <div className="space-y-2">
                    {comprasRecientes.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{c.titulo}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.proveedor} · {c.fecha}
                            {c.estado && <span className="ml-1 capitalize">· {c.estado}</span>}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">{fmtCLP(c.monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <TransaccionesRecientes data={transacciones} />
        </>
      )}

      {/* Vista para staff/coach: solo bloque de documentos por vencer */}
      {!showFinancialKPIs && showNonFinancialKPIs && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DocumentosVencimiento data={documentos} />
        </div>
      )}
    </div>
  );
}
