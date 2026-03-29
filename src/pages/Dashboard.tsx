import { DollarSign, AlertCircle, FileWarning, Users } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import MorosidadChart from "@/components/dashboard/MorosidadChart";
import DocumentosVencimiento from "@/components/dashboard/DocumentosVencimiento";
import TransaccionesRecientes from "@/components/dashboard/TransaccionesRecientes";

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen administrativo del club</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Caja Actual"
          value="$2.450.000"
          subtitle="+12% vs. mes anterior"
          icon={DollarSign}
          gradient="kpi-gradient-1"
          delay={0}
        />
        <KPICard
          title="Socios Activos"
          value="145"
          subtitle="7 categorías"
          icon={Users}
          gradient="kpi-gradient-2"
          delay={0.1}
        />
        <KPICard
          title="Morosidad"
          value="26"
          subtitle="17.9% del total"
          icon={AlertCircle}
          gradient="kpi-gradient-3"
          delay={0.2}
        />
        <KPICard
          title="Docs por Vencer"
          value="4"
          subtitle="Próximos 30 días"
          icon={FileWarning}
          gradient="kpi-gradient-4"
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MorosidadChart />
        <DocumentosVencimiento />
      </div>

      {/* Transactions */}
      <TransaccionesRecientes />
    </div>
  );
}
