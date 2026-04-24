import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategorias, type CategoriaRow } from "@/hooks/use-relational-data";
import { useCronCuotas } from "@/hooks/use-cron-cuotas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import GenerarCuotasDialog from "./GenerarCuotasDialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Config {
  id: string;
  categoria_id: string | null;
  nombre: string;
  monto_base: number;
  frecuencia: string;
  dia_vencimiento: number;
  activa: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

const emptyForm = {
  categoria_id: "",
  nombre: "",
  monto_base: 0,
  frecuencia: "mensual",
  dia_vencimiento: 10,
  activa: true,
  fecha_inicio: "",
  fecha_fin: "",
};

export default function CuotasConfiguracion() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const { categorias } = useCategorias();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Config | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cuota_configuraciones")
      .select("*")
      .order("nombre");
    setConfigs((data as unknown as Config[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Config) => {
    setEditing(c);
    setForm({
      categoria_id: c.categoria_id ?? "",
      nombre: c.nombre,
      monto_base: c.monto_base,
      frecuencia: c.frecuencia,
      dia_vencimiento: c.dia_vencimiento,
      activa: c.activa,
      fecha_inicio: c.fecha_inicio ?? "",
      fecha_fin: c.fecha_fin ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nombre || !form.monto_base) {
      toast.error("Nombre y monto son obligatorios");
      return;
    }

    const payload = {
      nombre: form.nombre,
      monto_base: form.monto_base,
      frecuencia: form.frecuencia,
      dia_vencimiento: form.dia_vencimiento,
      activa: form.activa,
      categoria_id: form.categoria_id || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
    };

    if (editing) {
      await supabase.from("cuota_configuraciones").update(payload as any).eq("id", editing.id);
      toast.success("Configuración actualizada");
    } else {
      await supabase.from("cuota_configuraciones").insert(payload as any);
      toast.success("Configuración creada");
    }
    setOpen(false);
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("cuota_configuraciones").delete().eq("id", id);
    toast.success("Configuración eliminada");
    fetch();
  };

  const catName = (id: string | null) => categorias.find((c) => c.id === id)?.nombre ?? "—";

  const cron = useCronCuotas();

  const categoriasSinConfig = useMemo(() => {
    const conConfig = new Set(configs.filter((c) => c.activa).map((c) => c.categoria_id));
    return categorias.filter((c) => !conConfig.has(c.id));
  }, [configs, categorias]);

  const proximaLabel = cron.proximaEjecucion.toLocaleDateString("es-CL", { day: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      {/* Banner estado generación automática */}
      {categoriasSinConfig.length === 0 ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Generación automática activa</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Las cuotas se emiten automáticamente el día 1 de cada mes. Próxima ejecución: <span className="font-medium text-foreground">{proximaLabel}</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {categoriasSinConfig.length} categoría{categoriasSinConfig.length === 1 ? "" : "s"} sin configuración activa
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No se generarán cuotas automáticas para: {categoriasSinConfig.map((c) => c.nombre).join(", ")}.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Configuraciones de Cuota</h3>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">Más opciones</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                Respaldo manual — el flujo normal es automático.
              </div>
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <div className="w-full">
                  <GenerarCuotasDialog
                    onGenerated={() => { fetch(); cron.refresh(); }}
                    triggerLabel="Forzar generación manual"
                    triggerVariant="ghost"
                  />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Nueva</Button>
        </div>
      </div>

      {/* Desktop table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Nombre</th>
              <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Categoría</th>
              <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Monto</th>
              <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Día Venc.</th>
              <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
              <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
            ) : configs.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay configuraciones.</td></tr>
            ) : configs.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{c.nombre}</td>
                <td className="p-3 text-foreground">{catName(c.categoria_id)}</td>
                <td className="p-3 text-right font-mono font-medium text-foreground">${c.monto_base.toLocaleString("es-CL")}</td>
                <td className="p-3 text-center text-foreground">{c.dia_vencimiento}</td>
                <td className="p-3 text-center">
                  <Badge variant={c.activa ? "default" : "secondary"} className="text-xs">{c.activa ? "Activa" : "Inactiva"}</Badge>
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : configs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">No hay configuraciones.</div>
        ) : configs.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{catName(c.categoria_id)}</p>
              </div>
              <Badge variant={c.activa ? "default" : "secondary"} className="text-[10px]">{c.activa ? "Activa" : "Inactiva"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground text-sm">${c.monto_base.toLocaleString("es-CL")}</span>
              <span className="text-xs text-muted-foreground">Vence día {c.dia_vencimiento}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5 mr-1" />Editar</Button>
              <Button variant="outline" size="sm" className="h-9 text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog for create/edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Configuración" : "Nueva Configuración"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Cuota mensual U13" />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto base ($)</Label>
                <Input type="number" value={form.monto_base || ""} onChange={(e) => setForm({ ...form, monto_base: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Día vencimiento</Label>
                <Input type="number" min={1} max={28} value={form.dia_vencimiento} onChange={(e) => setForm({ ...form, dia_vencimiento: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.activa} onCheckedChange={(v) => setForm({ ...form, activa: v })} />
              <Label>Activa</Label>
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
