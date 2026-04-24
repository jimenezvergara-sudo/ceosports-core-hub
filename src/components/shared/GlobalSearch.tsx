import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, ArrowLeftRight, FolderKanban, FileText } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface ResultGroup {
  personas: any[];
  transacciones: any[];
  proyectos: any[];
  documentos: any[];
}

const EMPTY: ResultGroup = { personas: [], transacciones: [], proyectos: [], documentos: [] };

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultGroup>(EMPTY);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { clubId, rolSistema } = useAuth();

  const role = (rolSistema || "viewer").toLowerCase();
  const isAdmin = role === "admin" || role === "owner";
  const isStaff = role === "staff" || role === "coach";

  // Atajo Cmd/Ctrl + K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const like = `%${q}%`;

        const personasRes = isAdmin || isStaff
          ? await supabase
              .from("personas")
              .select("id, nombre, apellido, rut, email")
              .eq("club_id", clubId)
              .or(`nombre.ilike.${like},apellido.ilike.${like},rut.ilike.${like},email.ilike.${like}`)
              .limit(5)
          : { data: [] as any[] };

        const txRes = isAdmin
          ? await supabase
              .from("transacciones" as any)
              .select("id, fecha, descripcion, monto, tipo")
              .eq("club_id", clubId)
              .ilike("descripcion", like)
              .limit(5)
          : { data: [] as any[] };

        const proyRes = isAdmin || isStaff
          ? await supabase
              .from("proyectos")
              .select("id, nombre, estado")
              .eq("club_id", clubId)
              .ilike("nombre", like)
              .limit(5)
          : { data: [] as any[] };

        const docRes = isAdmin || isStaff
          ? await supabase
              .from("documentos")
              .select("id, nombre_archivo, etiqueta, persona_id")
              .eq("club_id", clubId)
              .or(`nombre_archivo.ilike.${like},etiqueta.ilike.${like}`)
              .limit(5)
          : { data: [] as any[] };

        setResults({
          personas: (personasRes.data as any[]) ?? [],
          transacciones: (txRes.data as any[]) ?? [],
          proyectos: (proyRes.data as any[]) ?? [],
          documentos: (docRes.data as any[]) ?? [],
        });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open, clubId, isAdmin, isStaff]);

  const go = (path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  };

  const total =
    results.personas.length +
    results.transacciones.length +
    results.proyectos.length +
    results.documentos.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background hover:bg-muted/60 text-muted-foreground text-sm transition-colors"
        aria-label="Buscar"
        title="Buscar (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="hidden md:inline ml-2 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar personas, transacciones, proyectos, documentos..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          ) : loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : total === 0 ? (
            <CommandEmpty>Sin resultados</CommandEmpty>
          ) : (
            <>
              {results.personas.length > 0 && (
                <CommandGroup heading="Personas">
                  {results.personas.map((p) => (
                    <CommandItem key={p.id} value={`p-${p.id}-${p.nombre}`} onSelect={() => go(`/personas?id=${p.id}`)}>
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{p.nombre} {p.apellido}</span>
                      {p.rut && <span className="ml-2 text-xs text-muted-foreground">{p.rut}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.transacciones.length > 0 && (
                <CommandGroup heading="Transacciones">
                  {results.transacciones.map((t) => (
                    <CommandItem key={t.id} value={`t-${t.id}-${t.descripcion}`} onSelect={() => go(`/transacciones?id=${t.id}`)}>
                      <ArrowLeftRight className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium truncate">{t.descripcion}</span>
                      <span className="ml-auto font-mono text-xs">${Number(t.monto).toLocaleString("es-CL")}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.proyectos.length > 0 && (
                <CommandGroup heading="Proyectos">
                  {results.proyectos.map((p) => (
                    <CommandItem key={p.id} value={`pr-${p.id}-${p.nombre}`} onSelect={() => go(`/proyectos?id=${p.id}`)}>
                      <FolderKanban className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium">{p.nombre}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{p.estado}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.documentos.length > 0 && (
                <CommandGroup heading="Documentos">
                  {results.documentos.map((d) => (
                    <CommandItem key={d.id} value={`d-${d.id}-${d.nombre_archivo}`} onSelect={() => go(`/documentos?id=${d.id}`)}>
                      <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium truncate">{d.nombre_archivo}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{d.etiqueta}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
