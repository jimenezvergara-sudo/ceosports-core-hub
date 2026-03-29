import { motion } from "framer-motion";
import { AlertTriangle, Clock, FileCheck } from "lucide-react";

const docs = [
  { nombre: "Certificado Médico - María López", tipo: "Certificado Médico", vence: "2026-04-02", estado: "critico" },
  { nombre: "Seguro Deportivo - U13 Fem", tipo: "Seguro", vence: "2026-04-10", estado: "urgente" },
  { nombre: "Contrato - Juan Pérez (PF)", tipo: "Contrato", vence: "2026-04-15", estado: "urgente" },
  { nombre: "Boleta Fondeporte #456", tipo: "Boleta", vence: "2026-04-28", estado: "proximo" },
  { nombre: "Cédula - Carlos Díaz", tipo: "Cédula", vence: "2026-05-12", estado: "ok" },
];

const estadoConfig = {
  critico: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  urgente: { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  proximo: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  ok: { icon: FileCheck, color: "text-success", bg: "bg-success/10" },
};

export default function DocumentosVencimiento() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass rounded-xl p-6 shadow-card"
    >
      <h3 className="text-foreground font-semibold text-sm mb-1">Vencimiento de Documentos</h3>
      <p className="text-muted-foreground text-xs mb-4">Próximos vencimientos</p>
      <div className="space-y-2">
        {docs.map((doc) => {
          const cfg = estadoConfig[doc.estado as keyof typeof estadoConfig];
          const Icon = cfg.icon;
          return (
            <div key={doc.nombre} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
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
    </motion.div>
  );
}
