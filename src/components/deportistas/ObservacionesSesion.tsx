import { useState } from "react";
import { Heart, TrendingUp, HeartPulse, UserX, Star, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  useObservacionesSesion, useAsistencia, type SesionEntrenamiento, type TipoObservacion,
} from "@/hooks/use-deportistas";
import { cn } from "@/lib/utils";

const TIPOS: { value: TipoObservacion; label: string; icon: any; classes: string }[] = [
  { value: "positiva", label: "Positiva", icon: Heart, classes: "bg-success/15 text-success border-success/30" },
  { value: "destacada", label: "Destacada", icon: Star, classes: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "mejora", label: "A mejorar", icon: TrendingUp, classes: "bg-warning/15 text-warning border-warning/30" },
  { value: "lesion", label: "Lesión", icon: HeartPulse, classes: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "ausencia", label: "Ausencia", icon: UserX, classes: "bg-muted text-muted-foreground border-border" },
];

interface Props {
  sesion: SesionEntrenamiento;
  canEdit: boolean;
}

export default function ObservacionesSesion({ sesion, canEdit }: Props) {
  const { clubId, user } = useAuth();
  const { observaciones, refetch } = useObservacionesSesion(sesion.id);
  const { asistencia } = useAsistencia(sesion.id);

  const [openDialog, setOpenDialog] = useState(false);
  const [personaSel, setPersonaSel] = useState<string>("");
  const [tipoSel, setTipoSel] = useState<TipoObservacion>("positiva");
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  const abrirNueva = (personaId: string) => {
    setPersonaSel(personaId);
    setTipoSel("positiva");
    setTexto("");
    setOpenDialog(true);
  };

  const guardar = async () => {
    if (!texto.trim() || !clubId || !user) return;
    setSaving(true);
    const { error } = await supabase.from("observaciones_jugadora" as any).insert({
      sesion_id: sesion.id,
      persona_id: personaSel,
      club_id: clubId,
      tipo: tipoSel,
      texto: texto.trim(),
      created_by: user.id,
    });
    setSaving(false);
    if (error) { toast.error("Error al guardar"); console.error(error); return; }
    toast.success("Observación añadida");
    setOpenDialog(false);
    refetch();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar observación?")) return;
    await supabase.from("observaciones_jugadora" as any).delete().eq("id", id);
    toast.success("Eliminada");
    refetch();
  };

  // Agrupar observaciones por persona
  const obsPorPersona = new Map<string, typeof observaciones>();
  observaciones.forEach((o) => {
    if (!obsPorPersona.has(o.persona_id)) obsPorPersona.set(o.persona_id, []);
    obsPorPersona.get(o.persona_id)!.push(o);
  });

  return (
    <div className="space-y-2 pb-4">
      {asistencia.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Sin jugadoras en esta sesión. Carga la asistencia primero.
        </p>
      ) : asistencia.map((a) => {
        const obs = obsPorPersona.get(a.persona_id) || [];
        return (
          <Card key={a.persona_id} className="p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-medium text-sm">{a.persona_apellido}, {a.persona_nombre}</p>
              {canEdit && (
                <Button size="sm" variant="ghost" onClick={() => abrirNueva(a.persona_id)} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Observación
                </Button>
              )}
            </div>

            {obs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin observaciones</p>
            ) : (
              <div className="space-y-1.5">
                {obs.map((o) => {
                  const tipo = TIPOS.find((t) => t.value === o.tipo) || TIPOS[0];
                  const Icon = tipo.icon;
                  const puedeEliminar = canEdit && o.created_by === user?.id;
                  return (
                    <div key={o.id} className={cn("flex items-start gap-2 p-2 rounded-md border text-xs", tipo.classes)}>
                      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <Badge variant="outline" className="text-[10px] mb-1 bg-background/60">{tipo.label}</Badge>
                        <p className="leading-snug">{o.texto}</p>
                        <p className="text-[10px] opacity-70 mt-1">
                          {format(new Date(o.created_at), "d MMM HH:mm", { locale: es })}
                        </p>
                      </div>
                      {puedeEliminar && (
                        <button onClick={() => eliminar(o.id)} className="p-1 hover:bg-background/30 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva observación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipo</p>
              <div className="grid grid-cols-5 gap-1">
                {TIPOS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTipoSel(t.value)}
                      className={cn(
                        "h-16 rounded-md border-2 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all active:scale-95",
                        tipoSel === t.value ? t.classes + " shadow-md" : "border-border"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <Textarea
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Describe la observación..."
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button onClick={guardar} disabled={saving || !texto.trim()} className="w-full sm:w-auto">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
