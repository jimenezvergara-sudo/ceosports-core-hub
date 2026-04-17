import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { usePersonas } from "@/hooks/use-relational-data";

interface Cuota {
  id: string;
  persona_id: string;
  apoderado_id: string | null;
  categoria_id: string | null;
  configuracion_id: string | null;
  periodo: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_original: number;
  descuento: number;
  recargo: number;
  monto_final: number;
  estado: string;
  observaciones: string | null;
  created_at: string;
}

interface Pago {
  id: string;
  cuota_id: string;
  fecha_pago: string;
  monto_pagado: number;
  metodo_pago: string | null;
  referencia: string | null;
  observaciones: string | null;
  created_at: string;
}

interface Props {
  cuota: Cuota | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdated: () => void;
  personasMap: Record<string, string>;
  catMap: Record<string, string>;
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-warning/15 text-warning-foreground",
  pagada: "bg-success/15 text-success",
  vencida: "bg-destructive/15 text-destructive",
  parcial: "bg-accent text-accent-foreground",
  anulada: "bg-muted text-muted-foreground",
};

export default function CuotaDetailSheet({ cuota, open, onOpenChange, onUpdated, personasMap, catMap }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [showPago, setShowPago] = useState(false);
  const { personas } = usePersonas();

  // Payment form
  const [montoPago, setMontoPago] = useState(0);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [obsPago, setObsPago] = useState("");
  const [recibidoPorId, setRecibidoPorId] = useState("");

  useEffect(() => {
    if (!cuota) return;
    fetchPagos();
    // Set default payment amount to remaining
    const remaining = cuota.monto_final - pagos.reduce((s, p) => s + p.monto_pagado, 0);
    setMontoPago(Math.max(0, remaining));
    setShowPago(false);
  }, [cuota?.id]);

  const fetchPagos = async () => {
    if (!cuota) return;
    const { data } = await supabase
      .from("pagos_cuotas")
      .select("*")
      .eq("cuota_id", cuota.id)
      .order("fecha_pago", { ascending: false });
    const rows = (data as unknown as Pago[]) ?? [];
    setPagos(rows);
    const remaining = cuota.monto_final - rows.reduce((s, p) => s + p.monto_pagado, 0);
    setMontoPago(Math.max(0, remaining));
  };

  const registrarPago = async () => {
    if (!cuota || !montoPago) return;
    const payload: any = {
      cuota_id: cuota.id,
      fecha_pago: new Date().toISOString().slice(0, 10),
      monto_pagado: montoPago,
      metodo_pago: metodoPago,
      referencia: referenciaPago || null,
      observaciones: obsPago || null,
      recibido_por_id: recibidoPorId || null,
    };
    const { error } = await supabase.from("pagos_cuotas").insert(payload);
    if (error) {
      toast.error("Error al registrar pago");
      return;
    }

    // Auto-update cuota status if fully paid
    const nuevoTotal = totalPagado + montoPago;
    if (nuevoTotal >= cuota.monto_final) {
      await supabase.from("cuotas").update({ estado: "pagada" }).eq("id", cuota.id);
    } else if (nuevoTotal > 0) {
      await supabase.from("cuotas").update({ estado: "parcial" }).eq("id", cuota.id);
    }

    toast.success("Pago registrado. Cerrando en 3s...");
    setShowPago(false);
    setReferenciaPago("");
    setObsPago("");
    fetchPagos();
    onUpdated();

    // Auto-close to prevent duplicate payments
    setTimeout(() => onOpenChange(false), 3000);
  };

  const saldoPendiente = cuota ? cuota.monto_final - totalPagado : 0;
  const estaPagada = cuota?.estado === "pagada" || saldoPendiente <= 0;

  const totalPagado = pagos.reduce((s, p) => s + p.monto_pagado, 0);

  if (!cuota) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Cuota — {cuota.periodo}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Jugador" value={personasMap[cuota.persona_id] ?? "—"} />
            <InfoField label="Categoría" value={catMap[cuota.categoria_id ?? ""] ?? "—"} />
            <InfoField label="Periodo" value={cuota.periodo} />
            <InfoField label="Vencimiento" value={format(new Date(cuota.fecha_vencimiento), "dd/MM/yyyy")} />
            <InfoField label="Monto Original" value={`$${cuota.monto_original.toLocaleString("es-CL")}`} />
            <InfoField label="Descuento" value={`$${cuota.descuento.toLocaleString("es-CL")}`} />
            <InfoField label="Recargo" value={`$${cuota.recargo.toLocaleString("es-CL")}`} />
            <InfoField label="Monto Final" value={`$${cuota.monto_final.toLocaleString("es-CL")}`} highlight />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado:</span>
            <Badge className={`capitalize ${ESTADO_COLOR[cuota.estado] ?? ""}`}>{cuota.estado}</Badge>
          </div>

          {cuota.observaciones && (
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{cuota.observaciones}</p>
          )}

          <Separator />

          {/* Payment history */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-foreground">Historial de Pagos</h4>
              <span className="text-xs font-mono text-muted-foreground">
                Pagado: ${totalPagado.toLocaleString("es-CL")} / ${cuota.monto_final.toLocaleString("es-CL")}
              </span>
            </div>
            {pagos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
            ) : (
              <div className="space-y-2">
                {pagos.map((p) => (
                  <div key={p.id} className="bg-muted/20 border border-border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-foreground">${p.monto_pagado.toLocaleString("es-CL")}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(p.fecha_pago), "dd/MM/yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{p.metodo_pago ?? "—"}</span>
                      {p.referencia && <span>· Ref: {p.referencia}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Register payment */}
          {cuota.estado !== "pagada" && cuota.estado !== "anulada" && (
            <>
              <Separator />
              {!showPago ? (
                <Button className="w-full h-12" onClick={() => setShowPago(true)}>Registrar Pago</Button>
              ) : (
                <div className="space-y-3 bg-card border border-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground">Nuevo Pago</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Monto ($)</Label>
                      <Input type="number" value={montoPago || ""} onChange={(e) => setMontoPago(Number(e.target.value))} />
                    </div>
                    <div>
                      <Label>Método</Label>
                      <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Referencia</Label>
                    <Input value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="N° comprobante" />
                  </div>
                  <div>
                    <Label>Recibido por</Label>
                    <Select value={recibidoPorId} onValueChange={setRecibidoPorId}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {personas.filter((p) => p.tipo_persona !== "jugador").map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.apellido}, {p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observaciones</Label>
                    <Textarea value={obsPago} onChange={(e) => setObsPago(e.target.value)} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-11" onClick={() => setShowPago(false)}>Cancelar</Button>
                    <Button className="flex-1 h-11" onClick={registrarPago}>Confirmar Pago</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm ${highlight ? "font-bold text-foreground" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
