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

interface Props {
  onCreated: () => void;
}

export default function NuevaSolicitudDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    categoria_equipo: "",
    tipo_gasto: "",
    proyecto_asociado: "",
    cantidad: 1,
    monto_estimado: 0,
    prioridad: "media",
    fecha_requerida: "",
    proveedor_sugerido: "",
    justificacion: "",
    solicitante: "",
  });

  const set = (k: string, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (estado: "borrador" | "enviada") => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.tipo_gasto || !form.solicitante.trim()) {
      toast.error("Completa los campos obligatorios: título, descripción, tipo de gasto y solicitante.");
      return;
    }
    if (form.monto_estimado <= 0) {
      toast.error("El monto estimado debe ser mayor a 0.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("solicitudes_compra" as any).insert({
      ...form,
      fecha_requerida: form.fecha_requerida || null,
      estado,
    } as any);

    if (error) {
      toast.error("Error al crear solicitud");
    } else {
      // Log history
      // We'd need the ID but insert doesn't return it easily via 'as any'
      toast.success(estado === "enviada" ? "Solicitud enviada" : "Borrador guardado");
      setOpen(false);
      setForm({
        titulo: "", descripcion: "", categoria_equipo: "", tipo_gasto: "",
        proyecto_asociado: "", cantidad: 1, monto_estimado: 0, prioridad: "media",
        fecha_requerida: "", proveedor_sugerido: "", justificacion: "", solicitante: "",
      });
      onCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Compra</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej: Balones de fútbol para Sub-14" />
          </div>

          <div className="md:col-span-2">
            <Label>Descripción *</Label>
            <Textarea value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Detalle de lo que se necesita comprar" rows={3} />
          </div>

          <div>
            <Label>Solicitante *</Label>
            <Input value={form.solicitante} onChange={(e) => set("solicitante", e.target.value)} placeholder="Nombre del solicitante" />
          </div>

          <div>
            <Label>Tipo de Gasto *</Label>
            <Select value={form.tipo_gasto} onValueChange={(v) => set("tipo_gasto", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {TIPOS_GASTO.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categoría / Equipo</Label>
            <Input value={form.categoria_equipo} onChange={(e) => set("categoria_equipo", e.target.value)} placeholder="Ej: Sub-14" />
          </div>

          <div>
            <Label>Proyecto Asociado</Label>
            <Input value={form.proyecto_asociado} onChange={(e) => set("proyecto_asociado", e.target.value)} placeholder="Opcional" />
          </div>

          <div>
            <Label>Cantidad</Label>
            <Input type="number" min={1} value={form.cantidad} onChange={(e) => set("cantidad", Number(e.target.value))} />
          </div>

          <div>
            <Label>Monto Estimado *</Label>
            <Input type="number" min={0} value={form.monto_estimado} onChange={(e) => set("monto_estimado", Number(e.target.value))} placeholder="$" />
          </div>

          <div>
            <Label>Prioridad</Label>
            <Select value={form.prioridad} onValueChange={(v) => set("prioridad", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORIDADES.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fecha Requerida</Label>
            <Input type="date" value={form.fecha_requerida} onChange={(e) => set("fecha_requerida", e.target.value)} />
          </div>

          <div>
            <Label>Proveedor Sugerido</Label>
            <Input value={form.proveedor_sugerido} onChange={(e) => set("proveedor_sugerido", e.target.value)} placeholder="Opcional" />
          </div>

          <div className="md:col-span-2">
            <Label>Justificación</Label>
            <Textarea value={form.justificacion} onChange={(e) => set("justificacion", e.target.value)} placeholder="¿Por qué es necesaria esta compra?" rows={2} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" disabled={loading} onClick={() => handleSubmit("borrador")}>
            Guardar Borrador
          </Button>
          <Button disabled={loading} onClick={() => handleSubmit("enviada")}>
            Enviar Solicitud
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
