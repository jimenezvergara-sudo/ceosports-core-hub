import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const txs = [
  { desc: "Cuota Mensual - U13 Fem", monto: 45000, tipo: "ingreso", fecha: "28 Mar" },
  { desc: "Arriendo Cancha Municipal", monto: -120000, tipo: "egreso", fecha: "27 Mar" },
  { desc: "Subvención Fondeporte Q1", monto: 850000, tipo: "ingreso", fecha: "25 Mar" },
  { desc: "Implementación Deportiva", monto: -230000, tipo: "egreso", fecha: "24 Mar" },
  { desc: "Cuota Mensual - Adulto Masc", monto: 35000, tipo: "ingreso", fecha: "23 Mar" },
];

export default function TransaccionesRecientes() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass rounded-xl p-6 shadow-card"
    >
      <h3 className="text-foreground font-semibold text-sm mb-1">Transacciones Recientes</h3>
      <p className="text-muted-foreground text-xs mb-4">Últimos movimientos financieros</p>
      <div className="space-y-2">
        {txs.map((tx, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
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
    </motion.div>
  );
}
