import { motion } from "framer-motion";
import { AlertTriangle, Clock, FileCheck } from "lucide-react";
import type { DocumentoVencimiento } from "@/hooks/use-dashboard";

const estadoConfig = {
  critico: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  urgente: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  proximo: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  ok: { icon: FileCheck, color: "text-success", bg: "bg-success/10" },
};

interface Props {
  data: DocumentoVencimiento[];
}

export default function DocumentosVencimiento({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass rounded-xl p-6 shadow-card"
    >
      <h3 className="text-foreground font-semibold text-sm mb-1">Vencimiento de Documentos</h3>
      <p className="text-muted-foreground text-xs mb-4">Próximos 30 días</p>
      {data.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Sin documentos por vencer</p>
      ) : (
        <div className="space-y-2">
          {data.map((doc) => {
            const cfg = estadoConfig[doc.estado];
            const Icon = cfg.icon;
            return (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className={`w-8 h-8 rounded-md ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm truncate">{doc.nombre}</p>
                  <p className="text-muted-foreground text-xs">{doc.tipo}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0">{doc.vence}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
