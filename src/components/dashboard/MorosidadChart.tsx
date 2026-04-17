import { motion } from "framer-motion";
import type { MorosidadPorCategoria } from "@/hooks/use-dashboard";

interface Props {
  data: MorosidadPorCategoria[];
}

export default function MorosidadChart({ data }: Props) {
  const maxTotal = Math.max(1, ...data.map((d) => d.total));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-xl p-6 shadow-card"
    >
      <h3 className="text-foreground font-semibold text-sm mb-1">Morosidad por Categoría</h3>
      <p className="text-muted-foreground text-xs mb-6">Estado de pago de cuotas mensuales</p>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Sin datos de categorías con personas asignadas</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => {
            const pct = item.total > 0 ? (item.morosos / item.total) * 100 : 0;
            return (
              <div key={item.categoria} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 shrink-0 truncate">{item.categoria}</span>
                <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.total / maxTotal) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                    className="h-full bg-primary/30 rounded-md"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.morosos / maxTotal) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                    className="h-full bg-destructive/70 rounded-md absolute top-0 left-0"
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" /> Total
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-destructive/70" /> Morosos
        </div>
      </div>
    </motion.div>
  );
}
