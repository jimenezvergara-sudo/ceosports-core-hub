import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TIPOS_GASTO, PRIORIDADES } from "@/data/comprasConstants";
import { usePersonas, useCategorias, useProyectos, useStaffRoles, personaLabel } from "@/hooks/use-relational-data";

interface Props {
  onCreated: () => void;
}

export default function NuevaSolicitudDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { personas } = usePersonas();
  const { categorias } = useCategorias();
  const { proyectos } = useProyectos();
  const { roles: staffRoles } = useStaffRoles();

  // Build solicitante options from active staff
  const solicitanteOptions = staffRoles
    .filter((r) => r.activo)
    .map((r) => ({
      id: r.persona_id,
      label: `${r.persona_apellido}, ${r.persona_nombre} — ${r.rol}${r.categoria_nombre ? ` (${r.categoria_nombre})` : ""}`,
    }))
    // deduplicate by persona_id (show first role found)
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo_gasto: "",
    cantidad: 1,
    monto_estimado: 0,
    prioridad: "media",
    fecha_requerida: "",
    proveedor_sugerido: "",
    justificacion: "",
    solicitante_id: "",
    categoria_id: "",
    proyecto_id: "",
  });

  const set = (k: string, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const resetForm = () =>
    setForm({
      titulo: "", descripcion: "", tipo_gasto: "",
      cantidad: 1, monto_estimado: 0, prioridad: "media",
      fecha_requerida: "", proveedor_sugerido: "", justificacion: "",
      solicitante_id: "", categoria_id: "", proyecto_id: "",
    });

  const handleSubmit = async (estado: "borrador" | "enviada") => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.tipo_gasto || !form.solicitante_id) {
      toast.error("Completa los campos obligatorios: título, descripción, tipo de gasto y solicitante.");
      return;
    }
    if (form.monto_estimado <= 0) {
      toast.error("El monto estimado debe ser mayor a 0.");
      return;
    }

    const solicitantePersona = personas.find(p => p.id === form.solicitante_id);
    const categoriaObj = categorias.find(c => c.id === form.categoria_id);

    setLoading(true);
    const { error } = await supabase.from("solicitudes_compra" as any).insert({
      titulo: form.titulo,
      descripcion: form.descripcion,
      tipo_gasto: form.tipo_gasto,
      cantidad: form.cantidad,
      monto_estimado: form.monto_estimado,
      prioridad: form.prioridad,
      fecha_requerida: form.fecha_requerida || null,
      proveedor_sugerido: form.proveedor_sugerido || null,
      justificacion: form.justificacion || null,
      estado,
      // Relational FK columns
      solicitante_id: form.solicitante_id || null,
      categoria_id: form.categoria_id || null,
      proyecto_id: form.proyecto_id || null,
      // Legacy TEXT columns for backward compat
      solicitante: solicitantePersona ? `${solicitantePersona.nombre} ${solicitantePersona.apellido}` : "",
      categoria_equipo: categoriaObj ? categoriaObj.nombre : null,
      proyecto_asociado: proyectos.find(p => p.id === form.proyecto_id)?.nombre || null,
    } as any);

    if (error) {
      toast.error("Error al crear solicitud");
    } else {
      toast.success(estado === "enviada" ? "Solicitud enviada" : "Borrador guardado");
      setOpen(false);
      resetForm();
      onCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-10 sm:h-9">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Solicitud</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Nueva Solicitud de Compra</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
          <div className="sm:col-span-2">
            <Label className="text-xs">Título *</Label>
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej: Balones de fútbol para Sub-14" className="mt-1" />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Descripción *</Label>
            <Textarea value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Detalle de lo que se necesita" rows={3} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Solicitante *</Label>
            <Select value={form.solicitante_id} onValueChange={(v) => set("solicitante_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar solicitante" /></SelectTrigger>
              <SelectContent>
                {solicitanteOptions.length === 0 ? (
                  <SelectItem value="__empty" disabled>Asigna roles en Staff primero</SelectItem>
                ) : (
                  solicitanteOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Tipo de Gasto *</Label>
            <Select value={form.tipo_gasto} onValueChange={(v) => set("tipo_gasto", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {TIPOS_GASTO.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Categoría / Equipo</Label>
            <Select value={form.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.rama})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Proyecto Asociado</Label>
            <Select value={form.proyecto_id} onValueChange={(v) => set("proyecto_id", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar proyecto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gastos_corrientes">Gastos Corrientes</SelectItem>
                {proyectos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Cantidad</Label>
            <Input type="number" min={1} value={form.cantidad} onChange={(e) => set("cantidad", Number(e.target.value))} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Monto Estimado * ($)</Label>
            <Input type="number" min={0} value={form.monto_estimado} onChange={(e) => set("monto_estimado", Number(e.target.value))} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Prioridad</Label>
            <Select value={form.prioridad} onValueChange={(v) => set("prioridad", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Fecha Requerida</Label>
            <Input type="date" value={form.fecha_requerida} onChange={(e) => set("fecha_requerida", e.target.value)} className="mt-1" />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Proveedor Sugerido</Label>
            <Input value={form.proveedor_sugerido} onChange={(e) => set("proveedor_sugerido", e.target.value)} placeholder="Opcional" className="mt-1" />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Justificación</Label>
            <Textarea value={form.justificacion} onChange={(e) => set("justificacion", e.target.value)} placeholder="¿Por qué es necesaria esta compra?" rows={2} className="mt-1" />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
          <Button variant="outline" disabled={loading} onClick={() => handleSubmit("borrador")} className="h-11 sm:h-9">
            Guardar Borrador
          </Button>
          <Button disabled={loading} onClick={() => handleSubmit("enviada")} className="h-11 sm:h-9">
            Enviar Solicitud
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
