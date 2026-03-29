import { Users, Plus, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { personasMock } from "@/data/personasMock";
import { DOCUMENTOS_OBLIGATORIOS, documentoVencido } from "@/types/persona";
import type { Persona } from "@/types/persona";
import PersonaDetailSheet from "@/components/personas/PersonaDetailSheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const categorias = ["Todas", "Escuelita", "U9", "U11", "U13", "U15", "U18", "Adulto"];

function DocStatusIcons({ persona }: { persona: Persona }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {DOCUMENTOS_OBLIGATORIOS.map((etiqueta) => {
          const doc = persona.documentos.find((d) => d.etiqueta === etiqueta);
          const vencido = doc?.etiqueta === "Certificado Médico" && doc && documentoVencido(doc);
          const iniciales = etiqueta === "Cédula Identidad" ? "CI" : etiqueta === "Certificado Médico" ? "CM" : "FF";

          return (
            <Tooltip key={etiqueta}>
              <TooltipTrigger asChild>
                <span className="cursor-default">
                  {!doc ? (
                    <XCircle className="w-4 h-4 text-destructive/70" />
                  ) : vencido ? (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-success/70" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {etiqueta}: {!doc ? "No cargado" : vencido ? "Vencido" : "OK"}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default function Personas() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  const personasFiltradas = personasMock.filter((p) => {
    const matchCategoria = filtroCategoria === "Todas" || p.categoria === filtroCategoria;
    const matchBusqueda = !busqueda || `${p.nombre} ${p.apellido} ${p.rut}`.toLowerCase().includes(busqueda.toLowerCase());
    return matchCategoria && matchBusqueda;
  });

  const handleClickPersona = (p: Persona) => {
    setSelectedPersona(p);
    setSheetOpen(true);
  };

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
          <Input
            placeholder="Buscar por nombre o RUT..."
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filtroCategoria === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`}
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
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Docs</th>
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {personasFiltradas.map((p) => (
              <tr
                key={p.id}
                onClick={() => handleClickPersona(p)}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <td className="p-4 font-medium text-foreground">{p.nombre} {p.apellido}</td>
                <td className="p-4 font-mono text-muted-foreground text-xs">{p.rut}</td>
                <td className="p-4"><Badge variant="secondary" className="text-xs">{p.categoria}</Badge></td>
                <td className="p-4 text-muted-foreground">{p.rama}</td>
                <td className="p-4 text-muted-foreground">{p.tipo}</td>
                <td className="p-4"><DocStatusIcons persona={p} /></td>
                <td className="p-4">
                  <Badge variant={p.estado === "Moroso" ? "destructive" : "outline"} className="text-xs">
                    {p.estado}
                  </Badge>
                </td>
              </tr>
            ))}
            {personasFiltradas.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                  No se encontraron personas con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <PersonaDetailSheet persona={selectedPersona} open={sheetOpen} onOpenChange={setSheetOpen} />
    </PageShell>
  );
}
