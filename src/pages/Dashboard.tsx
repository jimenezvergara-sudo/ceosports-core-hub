import { DollarSign, AlertCircle, FileWarning, Users } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import MorosidadChart from "@/components/dashboard/MorosidadChart";
import DocumentosVencimiento from "@/components/dashboard/DocumentosVencimiento";
import TransaccionesRecientes from "@/components/dashboard/TransaccionesRecientes";
import { useDashboard } from "@/hooks/use-dashboard";

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { loading, kpis, morosidad, documentos, transacciones } = useDashboard();

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MorosidadChart data={morosidad} />
        <DocumentosVencimiento data={documentos} />
      </div>

      <TransaccionesRecientes data={transacciones} />
    </div>
  );
}
