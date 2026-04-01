import { Users, Plus, Search, CheckCircle2, XCircle, AlertTriangle, Upload, ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { personasMock } from "@/data/personasMock";
import { DOCUMENTOS_OBLIGATORIOS, documentoVencido } from "@/types/persona";
import type { Persona } from "@/types/persona";
import PersonaDetailSheet from "@/components/personas/PersonaDetailSheet";
import NuevaPersonaDialog from "@/components/personas/NuevaPersonaDialog";
import ImportMasivaDialog from "@/components/personas/ImportMasivaDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

const categorias = ["Todas", "Escuelita", "U9", "U11", "U13", "U15", "U18", "Adulto"];

function DocStatusIcons({ persona }: { persona: Persona }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {DOCUMENTOS_OBLIGATORIOS.map((etiqueta) => {
          const doc = persona.documentos.find((d) => d.etiqueta === etiqueta);
          const vencido = doc?.etiqueta === "Certificado Médico" && doc && documentoVencido(doc);
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

type SortKey = "nombre" | "rut" | "categoria" | "rama" | "tipo" | "estado";
type SortDir = "asc" | "desc" | null;

export default function Personas() {
  const [personas, setPersonas] = useState<Persona[]>(personasMock);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  const personasFiltradas = useMemo(() => {
    let filtered = personas.filter((p) => {
      const matchCategoria = filtroCategoria === "Todas" || p.categoria === filtroCategoria;
      const matchBusqueda = !busqueda || `${p.nombre} ${p.apellido} ${p.rut}`.toLowerCase().includes(busqueda.toLowerCase());
      return matchCategoria && matchBusqueda;
    });

    if (sortKey && sortDir) {
      filtered = [...filtered].sort((a, b) => {
        let valA: string, valB: string;
        if (sortKey === "nombre") {
          valA = `${a.nombre} ${a.apellido}`.toLowerCase();
          valB = `${b.nombre} ${b.apellido}`.toLowerCase();
        } else {
          valA = (a[sortKey] ?? "").toLowerCase();
          valB = (b[sortKey] ?? "").toLowerCase();
        }
        const cmp = valA.localeCompare(valB, "es");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return filtered;
  }, [personas, filtroCategoria, busqueda, sortKey, sortDir]);

  const handleClickPersona = (p: Persona) => {
    setSelectedPersona(p);
    setSheetOpen(true);
  };

  const handleNuevaPersona = (persona: Persona) => {
    setPersonas((prev) => {
      const idx = prev.findIndex((p) => p.rut === persona.rut);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...persona, id: prev[idx].id, documentos: prev[idx].documentos };
        return updated;
      }
      return [...prev, persona];
    });
  };

  const handleImport = (imported: Persona[]) => {
    setPersonas((prev) => {
      const result = [...prev];
      imported.forEach((p) => {
        const idx = result.findIndex((e) => e.rut === p.rut);
        if (idx >= 0) {
          result[idx] = { ...p, id: result[idx].id, documentos: result[idx].documentos };
        } else {
          result.push(p);
        }
      });
      return result;
    });
  };

  return (
    <PageShell
      title="Personas"
      description="Gestión de socios, jugadores y staff del club"
      icon={Users}
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" />
            Importar Excel
          </Button>
          <Button className="gap-2" onClick={() => setNuevaOpen(true)}>
            <Plus className="w-4 h-4" />
            Nueva Persona
          </Button>
        </div>
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
              {([
                ["nombre", "Nombre"],
                ["rut", "RUT"],
                ["categoria", "Categoría"],
                ["rama", "Rama"],
                ["tipo", "Tipo"],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {sortKey === key ? (
                      sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </span>
                </th>
              ))}
              <th className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider">Docs</th>
              <th
                onClick={() => handleSort("estado")}
                className="text-left p-4 text-muted-foreground font-medium text-xs uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
              >
                <span className="inline-flex items-center gap-1">
                  Estado
                  {sortKey === "estado" ? (
                    sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </span>
              </th>
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

      <PersonaDetailSheet
        persona={selectedPersona}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={(updated) => {
          setPersonas((prev) => prev.map((p) => p.id === updated.id ? updated : p));
          setSelectedPersona(updated);
        }}
      />
      <NuevaPersonaDialog open={nuevaOpen} onOpenChange={setNuevaOpen} onSave={handleNuevaPersona} />
      <ImportMasivaDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} existingRuts={personas.map((p) => p.rut)} />
    </PageShell>
  );
}
