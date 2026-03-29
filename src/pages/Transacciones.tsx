import { ArrowLeftRight, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const txs = [
  { fecha: "2026-03-28", desc: "Cuota Mensual - U13 Fem (15 socios)", monto: 675000, tipo: "Ingreso", categoria: "Cuotas", estado: "Pagado" },
  { fecha: "2026-03-27", desc: "Arriendo Cancha Municipal", monto: -120000, tipo: "Egreso", categoria: "Infraestructura", estado: "Pagado" },
  { fecha: "2026-03-25", desc: "Subvención Fondeporte Q1", monto: 850000, tipo: "Ingreso", categoria: "Subvención", estado: "Pagado" },
  { fecha: "2026-03-24", desc: "Implementación Deportiva (Balones)", monto: -230000, tipo: "Egreso", categoria: "Equipamiento", estado: "Pendiente" },
  { fecha: "2026-03-22", desc: "Inscripción Torneo Regional", monto: -85000, tipo: "Egreso", categoria: "Competencia", estado: "Pagado" },
  { fecha: "2026-03-20", desc: "Donación Empresa Sponsor", monto: 500000, tipo: "Ingreso", categoria: "Donación", estado: "Pagado" },
];

export default function Transacciones() {
  return (
    <PageShell
      title="Transacciones"
      description="Registro de ingresos y egresos del club"
      icon={ArrowLeftRight}
      actions={
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Transacción
        </Button>
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl shadow-card overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Fecha</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Descripción</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Categoría</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Tipo</th>
              <th className="text-right p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Monto</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                <td className="p-4 font-mono text-xs text-muted-foreground">{tx.fecha}</td>
                <td className="p-4 text-foreground">{tx.desc}</td>
                <td className="p-4"><Badge variant="secondary" className="text-xs">{tx.categoria}</Badge></td>
                <td className="p-4">
                  <Badge variant={tx.tipo === "Ingreso" ? "outline" : "destructive"} className="text-xs">
                    {tx.tipo}
                  </Badge>
                </td>
                <td className={`p-4 text-right font-mono font-medium ${tx.monto > 0 ? "text-success" : "text-destructive"}`}>
                  {tx.monto > 0 ? "+" : ""}{tx.monto.toLocaleString("es-CL")}
                </td>
                <td className="p-4">
                  <Badge variant={tx.estado === "Pendiente" ? "secondary" : "outline"} className="text-xs">
                    {tx.estado}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </PageShell>
  );
}
