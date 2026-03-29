import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  categoriasIngreso,
  categoriasEgreso,
  type CategoriaTransaccion,
} from "@/data/categoriasTransaccion";

interface Props {
  onCreated: () => void;
}

export default function NuevaTransaccionDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tipo, setTipo] = useState<"Ingreso" | "Egreso">("Ingreso");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [estado, setEstado] = useState("Pendiente");
  const [metodoPago, setMetodoPago] = useState("");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");

  const categorias: CategoriaTransaccion[] =
    tipo === "Ingreso" ? categoriasIngreso : categoriasEgreso;

  const subcategorias =
    categorias.find((c) => c.value === categoria)?.subcategorias ?? [];

  const handleTipoChange = (v: "Ingreso" | "Egreso") => {
    setTipo(v);
    setCategoria("");
    setSubcategoria("");
  };

  const handleCategoriaChange = (v: string) => {
    setCategoria(v);
    setSubcategoria("");
  };

  const resetForm = () => {
    setTipo("Ingreso");
    setCategoria("");
    setSubcategoria("");
    setDescripcion("");
    setMonto("");
    setFecha(new Date().toISOString().split("T")[0]);
    setEstado("Pendiente");
    setMetodoPago("");
    setReferencia("");
    setNotas("");
  };

  const handleSubmit = async () => {
    if (!categoria || !descripcion || !monto) {
      toast.error("Completa los campos obligatorios: categoría, descripción y monto.");
      return;
    }

    const montoNum = parseInt(monto, 10);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error("El monto debe ser un número positivo.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("transacciones" as any).insert({
      tipo,
      categoria,
      subcategoria: subcategoria || null,
      descripcion,
      monto: montoNum,
      fecha,
      estado,
      metodo_pago: metodoPago || null,
      referencia: referencia || null,
      notas: notas || null,
    } as any);

    setLoading(false);

    if (error) {
      toast.error("Error al registrar transacción: " + error.message);
      return;
    }

    toast.success("Transacción registrada correctamente");
    resetForm();
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Transacción
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Registrar Transacción
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Tipo */}
          <div className="grid gap-1.5">
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={handleTipoChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ingreso">Ingreso</SelectItem>
                <SelectItem value="Egreso">Egreso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoría */}
          <div className="grid gap-1.5">
            <Label>Categoría *</Label>
            <Select value={categoria} onValueChange={handleCategoriaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoría */}
          {subcategorias.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Subcategoría</Label>
              <Select value={subcategoria} onValueChange={setSubcategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {subcategorias.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fecha y Monto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Monto (CLP) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="grid gap-1.5">
            <Label>Descripción *</Label>
            <Input
              placeholder="Ej: Cuota mensual U13 Femenino"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* Estado y Método de Pago */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                  <SelectItem value="Anulado">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Método de Pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Referencia */}
          <div className="grid gap-1.5">
            <Label>Nº Referencia / Comprobante</Label>
            <Input
              placeholder="Ej: Boleta 00123"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="grid gap-1.5">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observaciones adicionales..."
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="certification"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Guardando..." : "Registrar Transacción"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
