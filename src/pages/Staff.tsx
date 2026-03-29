import { ShieldCheck } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const roles = [
  { rol: "Presidente", nombre: "Roberto Martínez", email: "r.martinez@club.cl", estado: "Activo" },
  { rol: "Vicepresidente", nombre: "Ana Soto", email: "a.soto@club.cl", estado: "Activo" },
  { rol: "Tesorero", nombre: "Luis Fernández", email: "l.fernandez@club.cl", estado: "Activo" },
  { rol: "Secretario", nombre: "Carmen Díaz", email: "c.diaz@club.cl", estado: "Activo" },
  { rol: "Entrenador", nombre: "Juan Pérez", email: "j.perez@club.cl", estado: "Activo" },
  { rol: "Preparador Físico", nombre: "Miguel Torres", email: "m.torres@club.cl", estado: "Activo" },
  { rol: "Encargado de Finanzas", nombre: "Patricia Rojas", email: "p.rojas@club.cl", estado: "Activo" },
  { rol: "Estadístico", nombre: "Felipe Muñoz", email: "f.munoz@club.cl", estado: "Pendiente" },
  { rol: "Coordinador", nombre: "Daniela Silva", email: "d.silva@club.cl", estado: "Activo" },
];

export default function Staff() {
  return (
    <PageShell
      title="Staff del Club"
      description="Gestión de los 9 roles administrativos del club"
      icon={ShieldCheck}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((r, i) => (
          <motion.div
            key={r.rol}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="glass rounded-xl p-5 shadow-card hover:shadow-glow transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <Badge variant="secondary" className="text-xs">{r.rol}</Badge>
              <Badge variant={r.estado === "Pendiente" ? "destructive" : "outline"} className="text-xs">
                {r.estado}
              </Badge>
            </div>
            <p className="text-foreground font-semibold">{r.nombre}</p>
            <p className="text-muted-foreground text-sm">{r.email}</p>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
