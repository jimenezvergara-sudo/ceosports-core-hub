import { Users, Plus, Search, CheckCircle2, XCircle, AlertTriangle, Upload, ArrowUp, ArrowDown, ArrowUpDown, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect, useCallback } from "react";
import { DOCUMENTOS_OBLIGATORIOS } from "@/types/persona";
import type { Persona } from "@/types/persona";
import { calcularEdad, calcularCategoria } from "@/types/persona";
import PersonaDetailSheet from "@/components/personas/PersonaDetailSheet";
import NuevaPersonaDialog from "@/components/personas/NuevaPersonaDialog";
import ImportMasivaDialog from "@/components/personas/ImportMasivaDialog";
import CategoriasManager from "@/components/personas/CategoriasManager";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useCategorias } from "@/hooks/use-relational-data";

const familiarVacio = { nombre: "", apellido: "", rut: "", telefono: "", email: "", direccion: "", profesion: "" };

function dbToPersona(row: any): Persona {
  const fechaNac = row.fecha_nacimiento || "";
  const edad = fechaNac ? calcularEdad(fechaNac) : 0;
  const catAuto = fechaNac ? calcularCategoria(fechaNac) : "—";
  const tipoMap: Record<string, string> = { jugador: "Jugador", jugadora: "Jugadora", socio: "Socio", socia: "Socia", apoderado: "Apoderado", staff: "Staff" };
  const estadoMap: Record<string, string> = { activo: "Activo", moroso: "Moroso", inactivo: "Inactivo" };

  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    rut: row.rut || "",
    fechaNacimiento: fechaNac,
    edad,
    categoria: catAuto,
    rama: "Mixto" as any,
    tipo: (tipoMap[row.tipo_persona] || row.tipo_persona) as any,
    estado: (estadoMap[row.estado] || row.estado) as any,
    talla: "",
    tallaUniforme: "",
    peso: "",
    colegio: "",
    previsionSalud: "",
    alergias: "",
    padre: { ...familiarVacio },
    madre: { ...familiarVacio },
    apoderado: { ...familiarVacio },
    documentos: [],
  };
}

function DocStatusIcons({ personaId }: { personaId: string }) {
  const [statuses, setStatuses] = useState<Record<string, "ok" | "expired" | "missing">>({});

  useEffect(() => {
    supabase
      .from("documentos")
      .select("etiqueta, fecha_vencimiento")
      .eq("persona_id", personaId)
      .then(({ data }) => {
        const map: Record<string, "ok" | "expired" | "missing"> = {};
        DOCUMENTOS_OBLIGATORIOS.forEach((et) => {
          const doc = data?.find((d) => d.etiqueta === et);
          if (!doc) { map[et] = "missing"; return; }
          if (et === "Certificado Médico" && doc.fecha_vencimiento && new Date(doc.fecha_vencimiento) < new Date()) {
            map[et] = "expired";
          } else {
            map[et] = "ok";
          }
        });
        setStatuses(map);
      });
  }, [personaId]);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {DOCUMENTOS_OBLIGATORIOS.map((et) => {
          const s = statuses[et] ?? "missing";
          return (
            <Tooltip key={et}>
              <TooltipTrigger asChild>
                <span className="cursor-default">
                  {s === "missing" ? <XCircle className="w-4 h-4 text-destructive/70" /> :
                   s === "expired" ? <AlertTriangle className="w-4 h-4 text-warning" /> :
                   <CheckCircle2 className="w-4 h-4 text-success/70" />}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {et}: {s === "missing" ? "No cargado" : s === "expired" ? "Vencido" : "OK"}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

type SortKey = "nombre" | "rut" | "categoria" | "tipo" | "estado";
type SortDir = "asc" | "desc" | null;

export default function Personas() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [categoriasOpen, setCategoriasOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [busqueda, setBusqueda] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const { categorias: dbCategorias } = useCategorias();
  const categoriasFilter = ["Todas", ...dbCategorias.map((c) => c.nombre)];

  // Category assignments map: personaId -> category names
  const [personaCatMap, setPersonaCatMap] = useState<Record<string, string[]>>({});

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("personas")
      .select("*")
      .order("apellido");
    const rows = (data as any[]) ?? [];
    setPersonas(rows.map(dbToPersona));

    // Load category assignments
    const { data: pcData } = await supabase
      .from("persona_categoria")
      .select("persona_id, categoria_id");
    const catMap: Record<string, string[]> = {};
    (pcData as any[])?.forEach((pc) => {
      const catName = dbCategorias.find((c) => c.id === pc.categoria_id)?.nombre;
      if (catName) {
        if (!catMap[pc.persona_id]) catMap[pc.persona_id] = [];
        catMap[pc.persona_id].push(catName);
      }
    });
    setPersonaCatMap(catMap);
    setLoading(false);
  }, [dbCategorias]);

  useEffect(() => { fetchPersonas(); }, [fetchPersonas]);

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
    else if (sortDir === "asc") { setSortDir("desc"); }
    else { setSortKey(null); setSortDir(null); }
  };

  const personasFiltradas = useMemo(() => {
    let filtered = personas.filter((p) => {
      const assignedCats = personaCatMap[p.id] ?? [];
      const matchCategoria = filtroCategoria === "Todas" || assignedCats.includes(filtroCategoria) || p.categoria === filtroCategoria;
      const matchBusqueda = !busqueda || `${p.nombre} ${p.apellido} ${p.rut}`.toLowerCase().includes(busqueda.toLowerCase());
      return matchCategoria && matchBusqueda;
    });

    if (sortKey && sortDir) {
      filtered = [...filtered].sort((a, b) => {
        let valA: string, valB: string;
        if (sortKey === "nombre") {
          valA = `${a.apellido} ${a.nombre}`.toLowerCase();
          valB = `${b.apellido} ${b.nombre}`.toLowerCase();
        } else if (sortKey === "categoria") {
          valA = (personaCatMap[a.id]?.[0] ?? a.categoria).toLowerCase();
          valB = (personaCatMap[b.id]?.[0] ?? b.categoria).toLowerCase();
        } else {
          valA = (a[sortKey] ?? "").toLowerCase();
          valB = (b[sortKey] ?? "").toLowerCase();
        }
        const cmp = valA.localeCompare(valB, "es");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return filtered;
  }, [personas, personaCatMap, filtroCategoria, busqueda, sortKey, sortDir]);

  const handleClickPersona = (p: Persona) => {
    setSelectedPersona(p);
    setSheetOpen(true);
  };

  const handleNuevaPersona = () => {
    fetchPersonas();
  };

  const handleImport = (imported: Persona[]) => {
    fetchPersonas();
  };

  const [personaAEliminar, setPersonaAEliminar] = useState<Persona | null>(null);

  const handleEliminar = async () => {
    if (!personaAEliminar) return;
    const id = personaAEliminar.id;
    await supabase.from("persona_categoria").delete().eq("persona_id", id);
    await supabase.from("persona_relaciones").delete().eq("persona_id", id);
    await supabase.from("persona_relaciones").delete().eq("relacionado_id", id);
    const { error } = await supabase.from("personas").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar: " + error.message);
    } else {
      toast.success("Persona eliminada");
      fetchPersonas();
    }
    setPersonaAEliminar(null);
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
            <span className="hidden sm:inline">Importar Excel</span>
          </Button>
          <Button className="gap-2" onClick={() => setNuevaOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Persona</span>
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o RUT..." className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {categoriasFilter.map((cat) => (
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
          <button
            onClick={() => setCategoriasOpen(true)}
            className="px-2 py-1.5 text-xs rounded-md border border-dashed border-border text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
            title="Administrar categorías"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="hidden md:block glass rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {([
                ["nombre", "Nombre"],
                ["rut", "RUT"],
                ["categoria", "Categoría"],
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
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
            ) : personasFiltradas.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">No se encontraron personas.</td></tr>
            ) : personasFiltradas.map((p) => (
              <tr key={p.id} onClick={() => handleClickPersona(p)} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                <td className="p-4 font-medium text-foreground">{p.apellido}, {p.nombre}</td>
                <td className="p-4 font-mono text-muted-foreground text-xs">{p.rut || "—"}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {getCategoryDisplay(p).map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-muted-foreground capitalize">{p.tipo}</td>
                <td className="p-4"><DocStatusIcons personaId={p.id} /></td>
                <td className="p-4">
                  <Badge variant={p.estado === "Moroso" ? "destructive" : "outline"} className="text-xs">{p.estado}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Mobile Cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="md:hidden space-y-2">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : personasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">No se encontraron personas.</div>
        ) : personasFiltradas.map((p) => (
          <button
            key={p.id}
            onClick={() => handleClickPersona(p)}
            className="w-full text-left bg-card border border-border rounded-lg p-4 hover:bg-muted/30 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-medium text-foreground text-sm">{p.apellido}, {p.nombre}</h3>
                <p className="text-xs text-muted-foreground font-mono">{p.rut || "Sin RUT"}</p>
              </div>
              <Badge variant={p.estado === "Moroso" ? "destructive" : "outline"} className="text-[10px] shrink-0">{p.estado}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {getCategoryDisplay(p).map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                ))}
              </div>
              <span className="text-xs text-muted-foreground capitalize">{p.tipo}</span>
            </div>
          </button>
        ))}
      </motion.div>

      <PersonaDetailSheet
        persona={selectedPersona}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={(updated) => {
          fetchPersonas();
          setSelectedPersona(updated);
        }}
      />
      <NuevaPersonaDialog open={nuevaOpen} onOpenChange={setNuevaOpen} onSave={handleNuevaPersona} />
      <ImportMasivaDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} existingRuts={personas.map((p) => p.rut)} />
      <CategoriasManager open={categoriasOpen} onOpenChange={setCategoriasOpen} />
    </PageShell>
  );
}
