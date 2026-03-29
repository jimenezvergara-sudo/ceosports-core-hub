import { Users, Plus, Search } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const categorias = ["Todas", "Escuelita", "U9", "U11", "U13", "U15", "U18", "Adulto"];

const personas = [
  { nombre: "María López García", rut: "12.345.678-9", categoria: "U13", rama: "Fem", estado: "Activo", tipo: "Jugadora" },
  { nombre: "Carlos Díaz Muñoz", rut: "9.876.543-2", categoria: "Adulto", rama: "Masc", estado: "Moroso", tipo: "Socio" },
  { nombre: "Sofía Rojas Pérez", rut: "21.456.789-0", categoria: "U9", rama: "Fem", estado: "Activo", tipo: "Jugadora" },
  { nombre: "Diego Fernández", rut: "15.678.234-5", categoria: "U18", rama: "Masc", estado: "Activo", tipo: "Jugador" },
  { nombre: "Valentina Soto", rut: "22.345.678-1", categoria: "Escuelita", rama: "Mixto", estado: "Activo", tipo: "Jugadora" },
  { nombre: "Andrés Muñoz", rut: "11.222.333-4", categoria: "U15", rama: "Masc", estado: "Activo", tipo: "Jugador" },
];

export default function Personas() {
  return (
    <PageShell
      title="Personas"
      description="Gestión de socios, jugadores y staff del club"
      icon={Users}
      actions={
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Persona
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o RUT..." className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categorias.map((cat) => (
            <button
              key={cat}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors first:bg-primary first:text-primary-foreground first:border-primary"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl shadow-card overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Nombre</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">RUT</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Categoría</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Rama</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Tipo</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                <td className="p-4 font-medium text-foreground">{p.nombre}</td>
                <td className="p-4 font-mono text-muted-foreground text-xs">{p.rut}</td>
                <td className="p-4"><Badge variant="secondary" className="text-xs">{p.categoria}</Badge></td>
                <td className="p-4 text-muted-foreground">{p.rama}</td>
                <td className="p-4 text-muted-foreground">{p.tipo}</td>
                <td className="p-4">
                  <Badge variant={p.estado === "Moroso" ? "destructive" : "outline"} className="text-xs">
                    {p.estado}
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
