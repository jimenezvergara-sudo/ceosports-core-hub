import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Upload, X, ChevronDown, ChevronUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
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
import { categoriasTransaccion } from "@/data/categoriasTransaccion";
import { cn } from "@/lib/utils";

interface Props {
  onCreated: () => void;
  /** Controlled open state (for FAB or external triggers) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When true, hides the default trigger button */
  hideTrigger?: boolean;
  /** Default tipo when opening (e.g., from FAB "Registrar gasto" → Egreso) */
  defaultTipo?: "Ingreso" | "Egreso";
}

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function NuevaTransaccionDialog({
  onCreated,
  open: openProp,
  onOpenChange,
  hideTrigger = false,
  defaultTipo,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [tipo, setTipo] = useState<"Ingreso" | "Egreso">(defaultTipo ?? "Egreso");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [estado, setEstado] = useState("Pagado"); // Smart default: most registrations are completed
  const [metodoPago, setMetodoPago] = useState("");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  const [catDeportiva, setCatDeportiva] = useState("");
  const [personaId, setPersonaId] = useState("");
  const [comprobante, setComprobante] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real data from Supabase
  const [categoriasDB, setCategoriasDB] = useState<{ id: string; nombre: string }[]>([]);
  const [jugadorasDB, setJugadorasDB] = useState<{ id: string; nombre: string; apellido: string; rut: string | null }[]>([]);

  // Sync defaultTipo when dialog opens
  useEffect(() => {
    if (open && defaultTipo) setTipo(defaultTipo);
  }, [open, defaultTipo]);

  // Load categorías deportivas from DB
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("categorias").select("id, nombre").order("nombre");
      if (data) setCategoriasDB(data);
    };
    load();
  }, []);

  // Load jugadoras when categoría deportiva changes
  useEffect(() => {
    if (!catDeportiva) {
      setJugadorasDB([]);
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("persona_categoria")
        .select("persona_id, personas!persona_categoria_persona_id_fkey(id, nombre, apellido, rut)")
        .eq("categoria_id", catDeportiva);
      if (data) {
        const personas = data
          .map((d: any) => d.personas)
          .filter(Boolean)
          .sort((a: any, b: any) => a.apellido.localeCompare(b.apellido));
        setJugadorasDB(personas);
      }
    };
    load();
  }, [catDeportiva]);

  // Filter categories by selected tipo
  const categoriasFiltradas = useMemo(
    () => categoriasTransaccion.filter((c) => c.tipo === tipo || c.tipo === "Ambos"),
    [tipo]
  );

  const categoriaSeleccionada = useMemo(
    () => categoriasTransaccion.find((c) => c.value === categoria),
    [categoria]
  );

  const subcategorias = categoriaSeleccionada?.subcategorias ?? [];
  const permiteCatDeportiva = categoriaSeleccionada?.permiteCategoriaDeportiva ?? false;
  const permiteJugadora = categoriaSeleccionada?.permiteJugadora ?? false;

  const handleTipoChange = (v: "Ingreso" | "Egreso") => {
    setTipo(v);
    setCategoria("");
    setSubcategoria("");
    setCatDeportiva("");
    setPersonaId("");
  };

  const handleCategoriaChange = (v: string) => {
    setCategoria(v);
    setSubcategoria("");
    setCatDeportiva("");
    setPersonaId("");
  };

  const resetForm = () => {
    setTipo(defaultTipo ?? "Egreso");
    setCategoria("");
    setSubcategoria("");
    setDescripcion("");
    setMonto("");
    setFecha(new Date().toISOString().split("T")[0]);
    setEstado("Pagado");
    setMetodoPago("");
    setReferencia("");
    setNotas("");
    setCatDeportiva("");
    setPersonaId("");
    setComprobante(null);
    setShowAdvanced(false);
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

    let comprobantePath: string | null = null;
    if (comprobante) {
      const ext = comprobante.name.split(".").pop();
      const path = `comprobantes/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documentos").upload(path, comprobante);
      if (upErr) {
        toast.error("Error al subir comprobante: " + upErr.message);
        setLoading(false);
        return;
      }
      comprobantePath = path;
    }

    const catNombre = categoriasDB.find(c => c.id === catDeportiva)?.nombre || null;

    const { error } = await supabase.from("transacciones").insert({
      tipo,
      categoria,
      subcategoria: subcategoria || null,
      descripcion,
      monto: montoNum,
      fecha,
      estado,
      metodo_pago: metodoPago || null,
      referencia: referencia || null,
      notas: comprobantePath ? `${notas || ""}\n[Comprobante: ${comprobantePath}]`.trim() : (notas || null),
      categoria_deportiva: catNombre,
      categoria_ref_id: catDeportiva || null,
      persona_ref_id: personaId || null,
      origen_tipo: "manual",
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

  const montoNum = parseInt(monto || "0", 10);
  const montoPreview = !isNaN(montoNum) && montoNum > 0 ? fmtCLP(montoNum) : "";

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Transacción
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Registrar Transacción
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Toggle grande Ingreso/Egreso */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-lg">
            <button
              type="button"
              onClick={() => handleTipoChange("Ingreso")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all",
                tipo === "Ingreso"
                  ? "bg-success/15 text-success shadow-sm ring-1 ring-success/30"
                  : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange("Egreso")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all",
                tipo === "Egreso"
                  ? "bg-destructive/15 text-destructive shadow-sm ring-1 ring-destructive/30"
                  : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Egreso
            </button>
          </div>

          {/* Categoría */}
          <div className="grid gap-1.5">
            <Label>Categoría *</Label>
            <Select value={categoria} onValueChange={handleCategoriaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriasFiltradas.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Monto (CLP) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="font-mono"
              />
              {montoPreview && (
                <p className="text-xs text-muted-foreground font-mono">{montoPreview}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="grid gap-1.5">
            <Label>Descripción *</Label>
            <Input
              placeholder="Ej: Compra de pelotas"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* Comprobante */}
          <div className="grid gap-1.5">
            <Label>Comprobante (opcional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
            />
            {comprobante ? (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border">
                <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{comprobante.name}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setComprobante(null)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="gap-2 justify-start text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Subir boleta o comprobante
              </Button>
            )}
          </div>

          {/* Sección colapsable: Más detalles */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground py-2 border-t border-border/40 mt-1"
          >
            <span className="font-medium">Más detalles (opcional)</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="grid gap-3 -mt-1">
              {/* Detalle */}
              {subcategorias.length > 0 && (
                <div className="grid gap-1.5">
                  <Label>Detalle</Label>
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

              {permiteCatDeportiva && (
                <div className="grid gap-1.5">
                  <Label>Categoría Deportiva</Label>
                  <Select value={catDeportiva} onValueChange={(v) => { setCatDeportiva(v); setPersonaId(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasDB.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {permiteJugadora && jugadorasDB.length > 0 && (
                <div className="grid gap-1.5">
                  <Label>Asignar a Jugadora</Label>
                  <Select value={personaId} onValueChange={setPersonaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona jugadora" />
                    </SelectTrigger>
                    <SelectContent>
                      {jugadorasDB.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.apellido}, {p.nombre} — {p.rut || "Sin RUT"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Estado</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagado">Pagado</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
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

              <div className="grid gap-1.5">
                <Label>Nº Referencia / Boleta</Label>
                <Input
                  placeholder="Ej: Boleta 00123"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                />
              </div>

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
          )}
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
            {loading ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
