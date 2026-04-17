import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string; nombre: string; descripcion: string | null;
  precio_mensual: number; precio_anual: number; moneda: string;
  limite_clubes: number | null; limite_usuarios: number | null;
  caracteristicas: any; activo: boolean; orden: number;
}

const empty = { nombre: "", descripcion: "", precio_mensual: 0, precio_anual: 0, moneda: "CLP", limite_clubes: "", limite_usuarios: "", caracteristicas: "", activo: true, orden: 0 };

export default function PlanesTab() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("planes_plataforma" as any).select("*").order("orden");
    setPlanes((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      ...p,
      limite_clubes: p.limite_clubes ?? "",
      limite_usuarios: p.limite_usuarios ?? "",
      caracteristicas: Array.isArray(p.caracteristicas) ? p.caracteristicas.join("\n") : "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nombre.trim()) { toast.error("Nombre requerido"); return; }
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
      precio_mensual: Number(form.precio_mensual) || 0,
      precio_anual: Number(form.precio_anual) || 0,
      moneda: form.moneda || "CLP",
      limite_clubes: form.limite_clubes === "" ? null : Number(form.limite_clubes),
      limite_usuarios: form.limite_usuarios === "" ? null : Number(form.limite_usuarios),
      caracteristicas: form.caracteristicas ? form.caracteristicas.split("\n").map((s: string) => s.trim()).filter(Boolean) : [],
      activo: form.activo,
      orden: Number(form.orden) || 0,
    };
    const { error } = editing
      ? await supabase.from("planes_plataforma" as any).update(payload).eq("id", editing.id)
      : await supabase.from("planes_plataforma" as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Plan actualizado" : "Plan creado");
    setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este plan?")) return;
    const { error } = await supabase.from("planes_plataforma" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Plan eliminado"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Catálogo de Planes</h3>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo plan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {planes.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-foreground">{p.nombre}</h4>
                <p className="text-xs text-muted-foreground">{p.descripcion}</p>
              </div>
              <Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
            </div>
            <div className="text-sm">
              <p className="font-mono">{p.moneda} ${p.precio_mensual.toLocaleString("es-CL")}/mes</p>
              <p className="font-mono text-xs text-muted-foreground">{p.moneda} ${p.precio_anual.toLocaleString("es-CL")}/año</p>
            </div>
            <div className="text-xs text-muted-foreground">
              {p.limite_clubes ?? "∞"} clubes · {p.limite_usuarios ?? "∞"} usuarios
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="w-3 h-3 mr-1" />Editar</Button>
              <Button size="sm" variant="outline" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar plan" : "Nuevo plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Precio mensual</Label><Input type="number" value={form.precio_mensual} onChange={(e) => setForm({ ...form, precio_mensual: e.target.value })} /></div>
              <div><Label>Precio anual</Label><Input type="number" value={form.precio_anual} onChange={(e) => setForm({ ...form, precio_anual: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Moneda</Label><Input value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} /></div>
              <div><Label>Límite clubes</Label><Input type="number" value={form.limite_clubes} onChange={(e) => setForm({ ...form, limite_clubes: e.target.value })} placeholder="∞" /></div>
              <div><Label>Límite usuarios</Label><Input type="number" value={form.limite_usuarios} onChange={(e) => setForm({ ...form, limite_usuarios: e.target.value })} placeholder="∞" /></div>
            </div>
            <div><Label>Características (una por línea)</Label><Textarea value={form.caracteristicas} onChange={(e) => setForm({ ...form, caracteristicas: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Orden</Label><Input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} /></div>
              <div className="flex items-end gap-2"><Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} /><Label>Activo</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
