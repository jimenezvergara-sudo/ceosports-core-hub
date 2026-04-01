import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Users, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonaRow {
  id: string;
  nombre: string;
  apellido: string;
  rut: string | null;
  tipo_persona: string;
}

interface Relacion {
  id: string;
  persona_id: string;
  relacionado_id: string;
  tipo_relacion: string;
  created_at: string;
  // joined persona data
  persona?: PersonaRow;
  relacionado?: PersonaRow;
}

const TIPOS_RELACION = [
  { value: "apoderado", label: "Apoderado" },
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "tutor", label: "Tutor" },
];

interface Props {
  personaId: string;
  tipoPersona: string; // jugador, apoderado, etc.
}

export default function RelacionesTab({ personaId, tipoPersona }: Props) {
  const [relaciones, setRelaciones] = useState<Relacion[]>([]);
  const [allPersonas, setAllPersonas] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newRelacionadoId, setNewRelacionadoId] = useState("");
  const [newTipoRelacion, setNewTipoRelacion] = useState("apoderado");

  const isJugador = tipoPersona === "jugador";

  const fetchRelaciones = useCallback(async () => {
    setLoading(true);

    // Get relations where this person is the jugador (persona_id)
    const { data: asJugador } = await supabase
      .from("persona_relaciones" as any)
      .select("*")
      .eq("persona_id", personaId);

    // Get relations where this person is the apoderado (relacionado_id)
    const { data: asApoderado } = await supabase
      .from("persona_relaciones" as any)
      .select("*")
      .eq("relacionado_id", personaId);

    const allRels = [
      ...((asJugador as unknown as Relacion[]) || []),
      ...((asApoderado as unknown as Relacion[]) || []),
    ];

    // Fetch related persona details
    const relatedIds = new Set<string>();
    allRels.forEach((r) => {
      relatedIds.add(r.persona_id);
      relatedIds.add(r.relacionado_id);
    });
    relatedIds.delete(personaId);

    if (relatedIds.size > 0) {
      const { data: personasData } = await supabase
        .from("personas" as any)
        .select("id, nombre, apellido, rut, tipo_persona")
        .in("id", Array.from(relatedIds));

      const personasMap = new Map<string, PersonaRow>();
      ((personasData as unknown as PersonaRow[]) || []).forEach((p) => personasMap.set(p.id, p));

      allRels.forEach((r) => {
        r.persona = personasMap.get(r.persona_id);
        r.relacionado = personasMap.get(r.relacionado_id);
      });
    }

    setRelaciones(allRels);
    setLoading(false);
  }, [personaId]);

  const fetchAllPersonas = useCallback(async () => {
    const { data } = await supabase
      .from("personas" as any)
      .select("id, nombre, apellido, rut, tipo_persona")
      .neq("id", personaId)
      .order("apellido");
    setAllPersonas((data as unknown as PersonaRow[]) || []);
  }, [personaId]);

  useEffect(() => {
    fetchRelaciones();
    fetchAllPersonas();
  }, [fetchRelaciones, fetchAllPersonas]);

  const handleAdd = async () => {
    if (!newRelacionadoId) {
      toast.error("Selecciona una persona");
      return;
    }

    const insertData = isJugador
      ? { persona_id: personaId, relacionado_id: newRelacionadoId, tipo_relacion: newTipoRelacion }
      : { persona_id: newRelacionadoId, relacionado_id: personaId, tipo_relacion: newTipoRelacion };

    const { error } = await supabase
      .from("persona_relaciones" as any)
      .insert(insertData as any);

    if (error) {
      if (error.code === "23505") {
        toast.error("Esta relación ya existe");
      } else {
        toast.error("Error al agregar relación");
      }
      return;
    }

    toast.success("Relación agregada");
    setNewRelacionadoId("");
    setAdding(false);
    fetchRelaciones();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("persona_relaciones" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar relación");
      return;
    }

    toast.success("Relación eliminada");
    fetchRelaciones();
  };

  // Split into "mis apoderados" (where I'm jugador) and "mis jugadores" (where I'm apoderado)
  const misApoderados = relaciones.filter((r) => r.persona_id === personaId);
  const misJugadores = relaciones.filter((r) => r.relacionado_id === personaId);

  const getRelacionLabel = (tipo: string) =>
    TIPOS_RELACION.find((t) => t.value === tipo)?.label || tipo;

  return (
    <div className="space-y-4 mt-4">
      {/* My guardians (when I'm a player) */}
      {(isJugador || misApoderados.length > 0) && (
        <div className="glass rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {isJugador ? "Mis Apoderados" : "Apoderados vinculados"}
            </h4>
          </div>

          {misApoderados.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin apoderados vinculados</p>
          ) : (
            <div className="space-y-2">
              {misApoderados.map((r) => {
                const persona = r.relacionado;
                return (
                  <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-md p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {persona ? `${persona.nombre} ${persona.apellido}` : "Persona eliminada"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {getRelacionLabel(r.tipo_relacion)}
                        </Badge>
                        {persona?.rut && (
                          <span className="text-[10px] font-mono text-muted-foreground">{persona.rut}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My players (when I'm a guardian) */}
      {(!isJugador || misJugadores.length > 0) && (
        <div className="glass rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {!isJugador ? "Mis Jugadores" : "Jugadores vinculados"}
            </h4>
          </div>

          {misJugadores.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin jugadores vinculados</p>
          ) : (
            <div className="space-y-2">
              {misJugadores.map((r) => {
                const persona = r.persona;
                return (
                  <div key={r.id} className="flex items-center justify-between bg-muted/30 rounded-md p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {persona ? `${persona.nombre} ${persona.apellido}` : "Persona eliminada"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {getRelacionLabel(r.tipo_relacion)}
                        </Badge>
                        {persona?.rut && (
                          <span className="text-[10px] font-mono text-muted-foreground">{persona.rut}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add new relation */}
      {!adding ? (
        <Button variant="outline" className="w-full gap-2" onClick={() => setAdding(true)}>
          <UserPlus className="w-4 h-4" />
          Agregar Relación
        </Button>
      ) : (
        <div className="glass rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Nueva Relación</h4>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo de Relación</Label>
              <Select value={newTipoRelacion} onValueChange={setNewTipoRelacion}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RELACION.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">
                {isJugador ? "Seleccionar Apoderado" : "Seleccionar Jugador"}
              </Label>
              <Select value={newRelacionadoId} onValueChange={setNewRelacionadoId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Buscar persona..." />
                </SelectTrigger>
                <SelectContent>
                  {allPersonas
                    .filter((p) =>
                      isJugador
                        ? p.tipo_persona === "apoderado"
                        : p.tipo_persona === "jugador"
                    )
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.apellido}, {p.nombre}
                        {p.rut ? ` — ${p.rut}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setAdding(false); setNewRelacionadoId(""); }}>
              Cancelar
            </Button>
            <Button size="sm" className="flex-1" onClick={handleAdd}>
              Agregar
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-xs text-muted-foreground text-center py-4">Cargando relaciones...</p>
      )}
    </div>
  );
}
