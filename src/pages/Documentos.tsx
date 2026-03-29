import { FileText, Plus, Upload } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const docs = [
  { nombre: "Certificado Médico - María López", tipo: "Certificado Médico", persona: "María López", vence: "2026-04-02", estado: "Por Vencer" },
  { nombre: "Contrato Entrenador - Juan Pérez", tipo: "Contrato", persona: "Juan Pérez", vence: "2026-12-31", estado: "Vigente" },
  { nombre: "Cédula de Identidad - Carlos Díaz", tipo: "Cédula", persona: "Carlos Díaz", vence: "2028-06-15", estado: "Vigente" },
  { nombre: "Seguro Deportivo U13 Fem", tipo: "Seguro", persona: "Equipo U13", vence: "2026-04-10", estado: "Por Vencer" },
  { nombre: "Boleta #456 Fondeporte", tipo: "Boleta de Gasto", persona: "Club", vence: "-", estado: "Archivado" },
];

const estadoBadge = (estado: string) => {
  if (estado === "Por Vencer") return "destructive" as const;
  if (estado === "Vigente") return "outline" as const;
  return "secondary" as const;
};

export default function Documentos() {
  return (
    <PageShell
      title="Documentos"
      description="Repositorio digital de cédulas, certificados, contratos y boletas"
      icon={FileText}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Subir
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo
          </Button>
        </div>
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
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Documento</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Tipo</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Persona/Entidad</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Vencimiento</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                <td className="p-4 text-foreground font-medium">{doc.nombre}</td>
                <td className="p-4"><Badge variant="secondary" className="text-xs">{doc.tipo}</Badge></td>
                <td className="p-4 text-muted-foreground">{doc.persona}</td>
                <td className="p-4 font-mono text-xs text-muted-foreground">{doc.vence}</td>
                <td className="p-4"><Badge variant={estadoBadge(doc.estado)} className="text-xs">{doc.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </PageShell>
  );
}
