import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { TransaccionReciente } from "@/hooks/use-dashboard";

interface Props {
  data: TransaccionReciente[];
}

export default function TransaccionesRecientes({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass rounded-xl p-6 shadow-card"
    >
      <h3 className="text-foreground font-semibold text-sm mb-1">Transacciones Recientes</h3>
      <p className="text-muted-foreground text-xs mb-4">Últimos movimientos financieros</p>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Sin transacciones registradas</p>
      ) : (
        <div className="space-y-2">
          {data.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                tx.tipo === "ingreso" ? "bg-success/10" : "bg-destructive/10"
              }`}>
                {tx.tipo === "ingreso" ? (
                  <ArrowDownLeft className="w-4 h-4 text-success" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm truncate">{tx.desc}</p>
                <p className="text-muted-foreground text-xs">{tx.fecha}</p>
              </div>
              <span className={`text-sm font-mono font-medium shrink-0 ${
                tx.tipo === "ingreso" ? "text-success" : "text-destructive"
              }`}>
                {tx.tipo === "ingreso" ? "+" : ""}{tx.monto.toLocaleString("es-CL")}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
