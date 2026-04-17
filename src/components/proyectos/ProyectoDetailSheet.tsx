import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  proyectoId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (p: any) => void;
  onChanged: () => void;
}

export default function ProyectoDetailSheet({ proyectoId, open, onOpenChange, onEdit, onChanged }: Props) {
  const [proyecto, setProyecto] = useState<any>(null);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);

  const load = async () => {
    if (!proyectoId) return;
    const { data: p } = await supabase.from("proyectos").select("*").eq("id", proyectoId).single();
    setProyecto(p);
    const { data: txs } = await supabase
      .from("transacciones")
      .select("id, fecha, descripcion, tipo, monto, estado, categoria")
      .eq("proyecto_id", proyectoId)
      .order("fecha", { ascending: false });
    setTransacciones(txs ?? []);
    const { data: libres } = await supabase
      .from("transacciones")
      .select("id, fecha, descripcion, tipo, monto")
      .is("proyecto_id", null)
      .order("fecha", { ascending: false })
      .limit(50);
    setDisponibles(libres ?? []);
  };

  useEffect(() => { if (open) load(); }, [open, proyectoId]);

  if (!proyecto) return null;

  const ejecutado = transacciones
    .filter((t) => t.tipo === "Egreso")
    .reduce((s, t) => s + Number(t.monto || 0), 0);
  const pct = proyecto.presupuesto > 0 ? Math.round((ejecutado / proyecto.presupuesto) * 100) : 0;

  const vincular = async (txId: string) => {
    const { error } = await supabase.from("transacciones").update({ proyecto_id: proyectoId }).eq("id", txId);
    if (error) return toast.error(error.message);
    toast.success("Transacción vinculada");
    load(); onChanged();
  };
  const desvincular = async (txId: string) => {
    const { error } = await supabase.from("transacciones").update({ proyecto_id: null }).eq("id", txId);
    if (error) return toast.error(error.message);
    toast.success("Transacción desvinculada");
    load(); onChanged();
  };
  const eliminar = async () => {
    const { error } = await supabase.from("proyectos").delete().eq("id", proyecto.id);
    if (error) return toast.error(error.message);
    toast.success("Proyecto eliminado");
    onChanged(); onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle>{proyecto.nombre}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">{proyecto.fuente_financiamiento ?? proyecto.tipo}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => onEdit(proyecto)}><Pencil className="w-4 h-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                    <AlertDialogDescription>Las transacciones vinculadas quedarán sin proyecto. Esta acción no se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={eliminar}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Estado:</span> <Badge variant="secondary">{proyecto.estado}</Badge></div>
            <div><span className="text-muted-foreground">Inicio:</span> {proyecto.fecha_inicio ?? "—"}</div>
            <div><span className="text-muted-foreground">Término:</span> {proyecto.fecha_fin ?? "—"}</div>
            <div><span className="text-muted-foreground">Transacciones:</span> {transacciones.length}</div>
          </div>
          {proyecto.descripcion && <p className="text-sm text-muted-foreground">{proyecto.descripcion}</p>}

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ejecutado</span>
              <span className="font-mono">${ejecutado.toLocaleString("es-CL")} / ${Number(proyecto.presupuesto).toLocaleString("es-CL")}</span>
            </div>
            <Progress value={Math.min(pct, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-right">{pct}% ejecutado</div>
          </div>

          <Tabs defaultValue="vinculadas">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="vinculadas">Vinculadas ({transacciones.length})</TabsTrigger>
              <TabsTrigger value="disponibles">Vincular nuevas</TabsTrigger>
            </TabsList>
            <TabsContent value="vinculadas" className="space-y-2 mt-3">
              {transacciones.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin transacciones vinculadas</p>}
              {transacciones.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{t.fecha} · {t.categoria}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-xs ${t.tipo === "Egreso" ? "text-destructive" : "text-emerald-600"}`}>
                      {t.tipo === "Egreso" ? "-" : "+"}${Number(t.monto).toLocaleString("es-CL")}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => desvincular(t.id)}><Unlink className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="disponibles" className="space-y-2 mt-3">
              {disponibles.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay transacciones sin proyecto</p>}
              {disponibles.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{t.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{t.fecha} · ${Number(t.monto).toLocaleString("es-CL")}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => vincular(t.id)} className="gap-1">
                    <Link2 className="w-3 h-3" /> Vincular
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
