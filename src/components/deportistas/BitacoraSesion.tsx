import { useEffect, useState } from "react";
import { Plus, Trash2, Save, GripVertical, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  useEjerciciosSesion, type SesionEntrenamiento, type Intensidad, type TipoEntrenamiento,
} from "@/hooks/use-deportistas";
import { cn } from "@/lib/utils";

const TIPOS: TipoEntrenamiento[] = ["Técnico", "Físico", "Táctico", "Partido", "Mixto"];
const INTENSIDADES: Intensidad[] = ["Baja", "Media", "Alta"];

const INTENSIDAD_COLOR: Record<Intensidad, string> = {
  Baja: "bg-success/15 text-success border-success/30",
  Media: "bg-warning/15 text-warning border-warning/30",
  Alta: "bg-destructive/15 text-destructive border-destructive/30",
};

interface Props {
  sesion: SesionEntrenamiento;
  canEdit: boolean;
  onUpdated?: () => void;
}

export default function BitacoraSesion({ sesion, canEdit, onUpdated }: Props) {
  const { clubId, user } = useAuth();
  const { ejercicios, refetch } = useEjerciciosSesion(sesion.id);

  const [tipo, setTipo] = useState<TipoEntrenamiento>((sesion.tipo_entrenamiento as TipoEntrenamiento) || "Mixto");
  const [intensidad, setIntensidad] = useState<Intensidad>((sesion.intensidad as Intensidad) || "Media");
  const [objetivo, setObjetivo] = useState(sesion.objetivo_dia || "");
  const [notas, setNotas] = useState(sesion.notas_entrenador || "");
  const [resultado, setResultado] = useState(sesion.resultado_sesion || "");
  const [drafts, setDrafts] = useState<Array<{ id?: string; nombre: string; duracion_min: number; orden: number }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDrafts(ejercicios.map((e) => ({ id: e.id, nombre: e.nombre, duracion_min: e.duracion_min, orden: e.orden })));
  }, [ejercicios]);

  const totalMin = drafts.reduce((s, d) => s + (Number(d.duracion_min) || 0), 0);

  const addEjercicio = () => {
    setDrafts((d) => [...d, { nombre: "", duracion_min: 10, orden: d.length }]);
  };

  const updateEjercicio = (idx: number, patch: Partial<{ nombre: string; duracion_min: number }>) => {
    setDrafts((d) => d.map((e, i) => i === idx ? { ...e, ...patch } : e));
  };

  const removeEjercicio = (idx: number) => {
    setDrafts((d) => d.filter((_, i) => i !== idx).map((e, i) => ({ ...e, orden: i })));
  };

  const guardar = async () => {
    if (!clubId) return;
    setSaving(true);

    // 1. Update sesión
    const updateData: any = {
      tipo_entrenamiento: tipo,
      intensidad,
      objetivo_dia: objetivo || null,
      notas_entrenador: notas || null,
      resultado_sesion: tipo === "Partido" ? (resultado || null) : null,
    };
    if (!sesion.created_by && user) updateData.created_by = user.id;

    const { error: sesErr } = await supabase
      .from("sesiones_entrenamiento" as any)
      .update(updateData)
      .eq("id", sesion.id);

    if (sesErr) {
      toast.error("Error al guardar bitácora");
      console.error(sesErr);
      setSaving(false);
      return;
    }

    // 2. Sync ejercicios: borra todos y reinserta (simple y consistente)
    await supabase.from("sesion_ejercicios" as any).delete().eq("sesion_id", sesion.id);

    const validos = drafts.filter((d) => d.nombre.trim() !== "");
    if (validos.length > 0) {
      const rows = validos.map((d, i) => ({
        sesion_id: sesion.id,
        club_id: clubId,
        nombre: d.nombre.trim(),
        duracion_min: Number(d.duracion_min) || 0,
        orden: i,
      }));
      const { error: ejErr } = await supabase.from("sesion_ejercicios" as any).insert(rows);
      if (ejErr) {
        toast.error("Error al guardar ejercicios");
        console.error(ejErr);
      }
    }

    toast.success("Bitácora guardada");
    setSaving(false);
    refetch();
    onUpdated?.();
  };

  const readOnly = !canEdit;

  return (
    <div className="space-y-4 pb-24">
      {readOnly && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5" />
          <span>Solo lectura. No tienes permisos para editar la bitácora.</span>
        </div>
      )}

      <Card className="p-3 space-y-3">
        <div>
          <Label className="text-xs">Tipo de entrenamiento</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mt-1">
            {TIPOS.map((t) => (
              <button
                key={t}
                disabled={readOnly}
                onClick={() => setTipo(t)}
                className={cn(
                  "h-10 rounded-md border text-xs font-medium transition-all active:scale-95 disabled:opacity-50",
                  tipo === t ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Intensidad general</Label>
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {INTENSIDADES.map((i) => (
              <button
                key={i}
                disabled={readOnly}
                onClick={() => setIntensidad(i)}
                className={cn(
                  "h-10 rounded-md border text-xs font-medium transition-all active:scale-95 disabled:opacity-50",
                  intensidad === i ? INTENSIDAD_COLOR[i] : "bg-background hover:bg-muted/50"
                )}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="objetivo" className="text-xs">Objetivo del día</Label>
          <Textarea
            id="objetivo"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Ej: Mejorar rotación defensiva tras pick & roll"
            disabled={readOnly}
            rows={2}
            className="mt-1 resize-none"
          />
        </div>
      </Card>

      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Ejercicios</Label>
          <span className="text-xs text-muted-foreground">{totalMin} min totales</span>
        </div>

        {drafts.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">Aún no agregaste ejercicios</p>
        )}

        {drafts.map((d, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder={`Ejercicio ${idx + 1}`}
              value={d.nombre}
              onChange={(e) => updateEjercicio(idx, { nombre: e.target.value })}
              disabled={readOnly}
              className="h-10 flex-1"
            />
            <Input
              type="number"
              min={0}
              value={d.duracion_min}
              onChange={(e) => updateEjercicio(idx, { duracion_min: Number(e.target.value) })}
              disabled={readOnly}
              className="h-10 w-20 text-center"
              aria-label="Duración en minutos"
            />
            <span className="text-xs text-muted-foreground w-6">min</span>
            {!readOnly && (
              <button
                onClick={() => removeEjercicio(idx)}
                className="p-2 rounded-md hover:bg-destructive/10 shrink-0"
                aria-label="Eliminar ejercicio"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addEjercicio} className="w-full mt-1">
            <Plus className="w-4 h-4 mr-1" /> Agregar ejercicio
          </Button>
        )}
      </Card>

      <Card className="p-3 space-y-3">
        <div>
          <Label htmlFor="notas-coach" className="text-xs">Notas del entrenador</Label>
          <Textarea
            id="notas-coach"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Reflexiones, ajustes, qué funcionó y qué no..."
            disabled={readOnly}
            rows={4}
            className="mt-1 resize-none"
          />
        </div>

        {tipo === "Partido" && (
          <div>
            <Label htmlFor="resultado" className="text-xs">Resultado del partido</Label>
            <Input
              id="resultado"
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              placeholder="Ej: Ganamos 65-58"
              disabled={readOnly}
              className="mt-1"
            />
          </div>
        )}
      </Card>

      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t p-3 sm:left-[var(--sidebar-width,16rem)]">
          <div className="max-w-3xl mx-auto">
            <Button onClick={guardar} disabled={saving} size="lg" className="w-full h-12 gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar bitácora"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
