import { Building2, Edit } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Organizacion() {
  return (
    <PageShell
      title="Organización"
      description="Datos del club deportivo"
      icon={Building2}
      actions={
        <Button variant="outline" className="gap-2">
          <Edit className="w-4 h-4" />
          Editar
        </Button>
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-8 shadow-card max-w-2xl"
      >
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl kpi-gradient-1 flex items-center justify-center text-primary-foreground font-bold text-2xl">
            CS
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Club Deportivo CEO Sports</h2>
            <p className="text-muted-foreground text-sm">Organización deportiva sin fines de lucro</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: "RUT", value: "65.123.456-7" },
            { label: "Nombre Legal", value: "Club Deportivo CEO Sports" },
            { label: "Representante Legal", value: "Roberto Martínez S." },
            { label: "Dirección", value: "Av. Deportiva 1234, Santiago" },
            { label: "Teléfono", value: "+56 9 1234 5678" },
            { label: "Email", value: "admin@ceosports.cl" },
          ].map((field) => (
            <div key={field.label}>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{field.label}</p>
              <p className="text-foreground font-medium">{field.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </PageShell>
  );
}
