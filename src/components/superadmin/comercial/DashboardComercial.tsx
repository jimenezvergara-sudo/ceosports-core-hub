import { useEffect, useState } from "react";
import { TrendingUp, Users, Clock, AlertCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  mrr: number;
  porPlan: { nombre: string; cantidad: number }[];
  trial: number;
  vencidos: number;
  leadsPipeline: number;
}

const ESTADOS_PIPELINE = ["Prospecto", "Contactado", "Demo agendada", "Propuesta enviada", "Negociación"];

export default function DashboardComercial() {
  const [stats, setStats] = useState<Stats>({ mrr: 0, porPlan: [], trial: 0, vencidos: 0, leadsPipeline: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: subs }, { data: planes }, { data: leads }] = await Promise.all([
        supabase.from("suscripciones_club" as any).select("estado, plan_id, ciclo_facturacion"),
        supabase.from("planes_plataforma" as any).select("id, nombre, precio_mensual, precio_anual"),
        supabase.from("leads_comerciales" as any).select("estado"),
      ]);

      const planMap: Record<string, any> = {};
      (planes as any[] ?? []).forEach((p) => { planMap[p.id] = p; });

      let mrr = 0;
      const porPlanMap: Record<string, number> = {};
      let trial = 0;
      let vencidos = 0;

      (subs as any[] ?? []).forEach((s) => {
        const plan = s.plan_id ? planMap[s.plan_id] : null;
        if (s.estado === "activo" && plan) {
          mrr += s.ciclo_facturacion === "anual" ? Math.round((plan.precio_anual || 0) / 12) : (plan.precio_mensual || 0);
          const k = plan.nombre;
          porPlanMap[k] = (porPlanMap[k] || 0) + 1;
        }
        if (s.estado === "trial") trial++;
        if (s.estado === "vencido") vencidos++;
      });

      const leadsPipeline = (leads as any[] ?? []).filter((l) => ESTADOS_PIPELINE.includes(l.estado)).length;

      setStats({
        mrr,
        porPlan: Object.entries(porPlanMap).map(([nombre, cantidad]) => ({ nombre, cantidad })),
        trial,
        vencidos,
        leadsPipeline,
      });
    })();
  }, []);

  const cards = [
    { icon: TrendingUp, label: "MRR (Ingresos recurrentes)", value: `$${stats.mrr.toLocaleString("es-CL")}`, color: "text-success" },
    { icon: Users, label: "Clubes activos", value: stats.porPlan.reduce((s, p) => s + p.cantidad, 0), color: "text-primary" },
    { icon: Clock, label: "Clubes en trial", value: stats.trial, color: "text-warning" },
    { icon: AlertCircle, label: "Clubes vencidos", value: stats.vencidos, color: "text-destructive" },
    { icon: Target, label: "Leads en pipeline", value: stats.leadsPipeline, color: "text-accent-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className={`text-2xl font-mono font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Distribución de clubes activos por plan</h3>
        {stats.porPlan.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos aún.</p>
        ) : (
          <div className="space-y-2">
            {stats.porPlan.map((p) => (
              <div key={p.nombre} className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.nombre}</span>
                <span className="font-mono text-muted-foreground">{p.cantidad} clubes</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
