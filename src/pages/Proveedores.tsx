import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Star, Pencil, Trash2, Search } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS_GASTO } from "@/data/comprasConstants";

interface Proveedor {
  id: string;
  nombre: string;
  rut: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  sitio_web: string | null;
  tipo_servicio: string;
  activo: boolean;
  observaciones: string | null;
  created_at: string;
  // computed
  avg_plazo?: number;
  avg_calidad?: number;
  avg_precio?: number;
  eval_count?: number;
}

interface EvalForm {
  puntaje_plazo: number;
  puntaje_calidad: number;
  puntaje_precio: number;
  comentario: string;
}

const TIPOS_SERVICIO = [...TIPOS_GASTO, "Servicios profesionales", "Arriendos", "General"];

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [evalTarget, setEvalTarget] = useState<Proveedor | null>(null);

  const [form, setForm] = useState({
    nombre: "", rut: "", telefono: "", email: "", direccion: "",
    sitio_web: "", tipo_servicio: "General", activo: true, observaciones: "",
  });

  const [evalForm, setEvalForm] = useState<EvalForm>({
    puntaje_plazo: 3, puntaje_calidad: 3, puntaje_precio: 3, comentario: "",
  });

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("proveedores" as any).select("*").order("nombre");
    const provs = (data as any[] ?? []) as Proveedor[];

    // Fetch evaluations averages
    const { data: evals } = await supabase.from("evaluaciones_proveedor" as any).select("*");
    const evalsByProv: Record<string, any[]> = {};
    (evals as any[] ?? []).forEach((e) => {
      if (!evalsByProv[e.proveedor_id]) evalsByProv[e.proveedor_id] = [];
      evalsByProv[e.proveedor_id].push(e);
    });

    provs.forEach((p) => {
      const pe = evalsByProv[p.id] || [];
      p.eval_count = pe.length;
      if (pe.length > 0) {
        p.avg_plazo = +(pe.reduce((s, e) => s + e.puntaje_plazo, 0) / pe.length).toFixed(1);
        p.avg_calidad = +(pe.reduce((s, e) => s + e.puntaje_calidad, 0) / pe.length).toFixed(1);
        p.avg_precio = +(pe.reduce((s, e) => s + e.puntaje_precio, 0) / pe.length).toFixed(1);
      }
    });

    setProveedores(provs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProveedores(); }, [fetchProveedores]);

  const openNew = () => {
    setEditing(null);
    setForm({ nombre: "", rut: "", telefono: "", email: "", direccion: "", sitio_web: "", tipo_servicio: "General", activo: true, observaciones: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Proveedor) => {
    setEditing(p);
    setForm({
      nombre: p.nombre, rut: p.rut || "", telefono: p.telefono || "",
      email: p.email || "", direccion: p.direccion || "", sitio_web: p.sitio_web || "",
      tipo_servicio: p.tipo_servicio, activo: p.activo, observaciones: p.observaciones || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    const payload = {
      nombre: form.nombre.trim(),
      rut: form.rut.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      sitio_web: form.sitio_web.trim() || null,
      tipo_servicio: form.tipo_servicio,
      activo: form.activo,
      observaciones: form.observaciones.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from("proveedores" as any).update(payload as any).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Proveedor actualizado");
    } else {
      const { error } = await supabase.from("proveedores" as any).insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Proveedor creado");
    }
    setDialogOpen(false);
    fetchProveedores();
  };

  const remove = async (id: string) => {
    await supabase.from("proveedores" as any).delete().eq("id", id);
    toast.success("Proveedor eliminado");
    fetchProveedores();
  };

  const openEval = (p: Proveedor) => {
    setEvalTarget(p);
    setEvalForm({ puntaje_plazo: 3, puntaje_calidad: 3, puntaje_precio: 3, comentario: "" });
    setEvalDialogOpen(true);
  };

  const saveEval = async () => {
    if (!evalTarget) return;
    const { error } = await supabase.from("evaluaciones_proveedor" as any).insert({
      proveedor_id: evalTarget.id,
      puntaje_plazo: evalForm.puntaje_plazo,
      puntaje_calidad: evalForm.puntaje_calidad,
      puntaje_precio: evalForm.puntaje_precio,
      comentario: evalForm.comentario.trim() || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Evaluación registrada");
    setEvalDialogOpen(false);
    fetchProveedores();
  };

  const filtered = proveedores.filter((p) => {
    const matchTipo = filtroTipo === "Todos" || p.tipo_servicio === filtroTipo;
    const matchBusqueda = !busqueda || `${p.nombre} ${p.rut || ""}`.toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchBusqueda;
  });

  const RatingStars = ({ value }: { value?: number }) => {
    if (value === undefined) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`w-3 h-3 ${i <= Math.round(value) ? "text-warning fill-warning" : "text-muted-foreground/30"}`} />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{value}</span>
      </div>
    );
  };

  const RatingInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5">
            <Star className={`w-5 h-5 transition-colors ${i <= value ? "text-warning fill-warning" : "text-muted-foreground/30 hover:text-warning/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <PageShell
      title="Proveedores"
      description="Gestión de proveedores y evaluaciones"
      icon={Truck}
      actions={
        <Button className="gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar proveedor..." className="pl-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los tipos</SelectItem>
            {TIPOS_SERVICIO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 bg-card border border-border rounded-lg">
          No se encontraron proveedores.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * i }}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{p.nombre}</h3>
                  {p.rut && <p className="text-[10px] font-mono text-muted-foreground">{p.rut}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={p.activo ? "secondary" : "destructive"} className="text-[10px]">
                    {p.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              <Badge variant="outline" className="text-[10px] mb-3">{p.tipo_servicio}</Badge>

              {p.telefono && <p className="text-xs text-muted-foreground">📞 {p.telefono}</p>}
              {p.email && <p className="text-xs text-muted-foreground">✉ {p.email}</p>}

              {/* Evaluations */}
              {(p.eval_count ?? 0) > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Evaluación ({p.eval_count} {p.eval_count === 1 ? "reseña" : "reseñas"})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-[10px] text-muted-foreground">Plazo</p><RatingStars value={p.avg_plazo} /></div>
                    <div><p className="text-[10px] text-muted-foreground">Calidad</p><RatingStars value={p.avg_calidad} /></div>
                    <div><p className="text-[10px] text-muted-foreground">Precio</p><RatingStars value={p.avg_precio} /></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openEval(p)}>
                  <Star className="w-3 h-3" /> Evaluar
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => openEdit(p)}>
                  <Pencil className="w-3 h-3" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1" onClick={() => remove(p.id)}>
                  <Trash2 className="w-3 h-3" /> Eliminar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">RUT</Label>
                <Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="76.XXX.XXX-X" className="mt-1 font-mono" />
              </div>
              <div>
                <Label className="text-xs">Tipo de Servicio *</Label>
                <Select value={form.tipo_servicio} onValueChange={(v) => setForm({ ...form, tipo_servicio: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_SERVICIO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Dirección</Label>
                <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Sitio Web</Label>
                <Input value={form.sitio_web} onChange={(e) => setForm({ ...form, sitio_web: e.target.value })} placeholder="https://..." className="mt-1" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} />
                <Label className="text-xs">Activo</Label>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Observaciones</Label>
                <Textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows={2} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Evaluar: {evalTarget?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <RatingInput label="Cumplimiento de Plazo" value={evalForm.puntaje_plazo} onChange={(v) => setEvalForm({ ...evalForm, puntaje_plazo: v })} />
            <RatingInput label="Calidad del Producto/Servicio" value={evalForm.puntaje_calidad} onChange={(v) => setEvalForm({ ...evalForm, puntaje_calidad: v })} />
            <RatingInput label="Precio / Relación Costo-Beneficio" value={evalForm.puntaje_precio} onChange={(v) => setEvalForm({ ...evalForm, puntaje_precio: v })} />
            <div>
              <Label className="text-xs">Comentario</Label>
              <Textarea value={evalForm.comentario} onChange={(e) => setEvalForm({ ...evalForm, comentario: e.target.value })} rows={3} className="mt-1" placeholder="Observaciones sobre la experiencia..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvalDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveEval}>Guardar Evaluación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
