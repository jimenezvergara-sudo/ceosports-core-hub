import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const FUENTES = ["Fondeporte", "IND", "Gob. Regional", "Municipal", "Privado", "Otro"];
const ESTADOS = ["En Ejecución", "Rendido", "Cerrado", "Pausado"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proyecto?: any;
  onSaved: () => void;
}

export default function NuevoProyectoDialog({ open, onOpenChange, proyecto, onSaved }: Props) {
  const { clubId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    fuente_financiamiento: "Fondeporte",
    presupuesto: 0,
    fecha_inicio: "",
    fecha_fin: "",
    estado: "En Ejecución",
  });

  useEffect(() => {
    if (proyecto) {
      setForm({
        nombre: proyecto.nombre ?? "",
        descripcion: proyecto.descripcion ?? "",
        fuente_financiamiento: proyecto.fuente_financiamiento ?? "Otro",
        presupuesto: proyecto.presupuesto ?? 0,
        fecha_inicio: proyecto.fecha_inicio ?? "",
        fecha_fin: proyecto.fecha_fin ?? "",
        estado: proyecto.estado ?? "En Ejecución",
      });
    } else {
      setForm({ nombre: "", descripcion: "", fuente_financiamiento: "Fondeporte", presupuesto: 0, fecha_inicio: "", fecha_fin: "", estado: "En Ejecución" });
    }
  }, [proyecto, open]);

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error("Nombre requerido"); return; }
    setSaving(true);
    const payload = {
      ...form,
      tipo: form.fuente_financiamiento,
      presupuesto: Number(form.presupuesto) || 0,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      club_id: clubId,
    };
    const { error } = proyecto?.id
      ? await supabase.from("proyectos").update(payload).eq("id", proyecto.id)
      : await supabase.from("proyectos").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(proyecto?.id ? "Proyecto actualizado" : "Proyecto creado");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{proyecto?.id ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fuente Financiamiento</Label>
              <Select value={form.fuente_financiamiento} onValueChange={(v) => setForm({ ...form, fuente_financiamiento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FUENTES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Presupuesto Total (CLP)</Label>
            <Input type="number" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha Inicio</Label>
              <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            </div>
            <div>
              <Label>Fecha Término</Label>
              <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
