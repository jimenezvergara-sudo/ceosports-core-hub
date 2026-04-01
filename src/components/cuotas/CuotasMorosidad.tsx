import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCategorias } from "@/hooks/use-relational-data";
import { motion } from "framer-motion";

interface CuotaRow {
  id: string;
  persona_id: string;
  apoderado_id: string | null;
  categoria_id: string | null;
  monto_final: number;
  estado: string;
  periodo: string;
}

export default function CuotasMorosidad() {
  const [cuotas, setCuotas] = useState<CuotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { categorias } = useCategorias();
  const [personasMap, setPersonasMap] = useState<Record<string, string>>({});

  // Current period
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("cuotas").select("id, persona_id, apoderado_id, categoria_id, monto_final, estado, periodo").eq("periodo", currentPeriod);
      const rows = (data as unknown as CuotaRow[]) ?? [];
      setCuotas(rows);

      // Fetch names
      const allIds = [...new Set([...rows.map((r) => r.persona_id), ...rows.map((r) => r.apoderado_id).filter(Boolean)] as string[])];
      if (allIds.length) {
        const { data: p } = await supabase.from("personas").select("id, nombre, apellido").in("id", allIds);
        const pm: Record<string, string> = {};
        (p as any[])?.forEach((x) => { pm[x.id] = `${x.apellido}, ${x.nombre}`; });
        setPersonasMap(pm);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const catMap: Record<string, string> = {};
  categorias.forEach((c) => { catMap[c.id] = c.nombre; });

  // Stats
  const emitidas = cuotas.length;
  const pagadas = cuotas.filter((c) => c.estado === "pagada").length;
  const montoRecaudado = cuotas.filter((c) => c.estado === "pagada").reduce((s, c) => s + c.monto_final, 0);
  const montoVencido = cuotas.filter((c) => ["vencida", "pendiente"].includes(c.estado)).reduce((s, c) => s + c.monto_final, 0);
  const pctMorosidad = emitidas ? Math.round(((emitidas - pagadas) / emitidas) * 100) : 0;

  // By category
  const byCat: Record<string, { total: number; morosos: number }> = {};
  cuotas.forEach((c) => {
    const cat = catMap[c.categoria_id ?? ""] ?? "Sin categoría";
    if (!byCat[cat]) byCat[cat] = { total: 0, morosos: 0 };
    byCat[cat].total++;
    if (c.estado !== "pagada") byCat[cat].morosos++;
  });
  const catData = Object.entries(byCat).sort(([a], [b]) => a.localeCompare(b));
  const maxTotal = Math.max(...catData.map(([, v]) => v.total), 1);

  // By apoderado (morosos)
  const byApo: Record<string, { name: string; count: number; monto: number }> = {};
  cuotas.filter((c) => c.estado !== "pagada" && c.apoderado_id).forEach((c) => {
    const key = c.apoderado_id!;
    if (!byApo[key]) byApo[key] = { name: personasMap[key] ?? "—", count: 0, monto: 0 };
    byApo[key].count++;
    byApo[key].monto += c.monto_final;
  });
  const apoData = Object.values(byApo).sort((a, b) => b.monto - a.monto).slice(0, 10);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-foreground">Dashboard Morosidad — {currentPeriod}</h3>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
        <KPI label="Emitidas" value={String(emitidas)} />
        <KPI label="Pagadas" value={String(pagadas)} color="text-success" />
        <KPI label="Recaudado" value={`$${montoRecaudado.toLocaleString("es-CL")}`} />
        <KPI label="Vencido" value={`$${montoVencido.toLocaleString("es-CL")}`} color="text-destructive" />
        <KPI label="Morosidad" value={`${pctMorosidad}%`} color={pctMorosidad > 30 ? "text-destructive" : "text-warning-foreground"} />
      </div>

      {/* Chart by category */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h4 className="text-sm font-semibold text-foreground mb-1">Morosidad por Categoría</h4>
        <p className="text-xs text-muted-foreground mb-4">Estado de pago del periodo actual</p>
        {catData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos para este periodo.</p>
        ) : (
          <div className="space-y-3">
            {catData.map(([cat, vals], i) => {
              const pct = vals.total ? Math.round((vals.morosos / vals.total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 sm:w-24 shrink-0 truncate">{cat}</span>
                  <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(vals.total / maxTotal) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                      className="h-full bg-primary/30 rounded-md"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(vals.morosos / maxTotal) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                      className="h-full bg-destructive/70 rounded-md absolute top-0 left-0"
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-12 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-primary/30" /> Total</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-destructive/70" /> Morosos</div>
        </div>
      </motion.div>

      {/* Morosos by apoderado */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h4 className="text-sm font-semibold text-foreground mb-1">Morosos por Apoderado</h4>
        <p className="text-xs text-muted-foreground mb-4">Top apoderados con cuotas impagas</p>
        {apoData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin morosos.</p>
        ) : (
          <div className="space-y-2">
            {apoData.map((a) => (
              <div key={a.name} className="flex items-center justify-between bg-muted/20 border border-border rounded-md p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.count} cuota{a.count > 1 ? "s" : ""} impaga{a.count > 1 ? "s" : ""}</p>
                </div>
                <span className="font-mono font-semibold text-destructive text-sm">${a.monto.toLocaleString("es-CL")}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base sm:text-xl font-mono font-bold ${color ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
