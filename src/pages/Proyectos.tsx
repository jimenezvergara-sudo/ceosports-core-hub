import { FolderKanban, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const proyectos = [
  { nombre: "Fondeporte 2026 - Escuelas Formativas", fondo: "Fondeporte", monto: 4500000, ejecutado: 2800000, estado: "En Ejecución", txs: 12 },
  { nombre: "Gob. Regional - Infraestructura Deportiva", fondo: "Gob. Regional", monto: 8000000, ejecutado: 8000000, estado: "Rendido", txs: 24 },
  { nombre: "IND - Programa Competitivo 2026", fondo: "IND", monto: 3200000, ejecutado: 650000, estado: "En Ejecución", txs: 4 },
];

export default function Proyectos() {
  return (
    <PageShell
      title="Proyectos"
      description="Subvenciones y rendición de fondos públicos"
      icon={FolderKanban}
      actions={
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </Button>
      }
    >
      <div className="grid gap-4">
        {proyectos.map((p, i) => {
          const pct = Math.round((p.ejecutado / p.monto) * 100);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="glass rounded-xl p-6 shadow-card hover:shadow-glow transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-foreground font-semibold">{p.nombre}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{p.fondo} · {p.txs} transacciones vinculadas</p>
                </div>
                <Badge variant={p.estado === "Rendido" ? "outline" : "secondary"} className="text-xs shrink-0">
                  {p.estado}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={pct} className="h-2" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
              </div>
              <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
                <span>Presupuesto: <span className="text-foreground font-medium">${p.monto.toLocaleString("es-CL")}</span></span>
                <span>Ejecutado: <span className="text-foreground font-medium">${p.ejecutado.toLocaleString("es-CL")}</span></span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
}
