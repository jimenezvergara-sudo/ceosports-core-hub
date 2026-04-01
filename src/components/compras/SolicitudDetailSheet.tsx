import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ESTADO_COLOR, MEDIOS_PAGO } from "@/data/comprasConstants";
import type { EstadoCompra } from "@/data/comprasConstants";

interface Solicitud {
  id: string;
  titulo: string;
  descripcion: string;
  categoria_equipo: string | null;
  tipo_gasto: string;
  proyecto_asociado: string | null;
  cantidad: number;
  monto_estimado: number;
  prioridad: string;
  fecha_requerida: string | null;
  proveedor_sugerido: string | null;
  justificacion: string | null;
  estado: string;
  solicitante: string;
  created_at: string;
}

interface Aprobacion {
  id: string;
  aprobado_por: string;
  decision: string;
  monto_aprobado: number | null;
  centro_costo: string | null;
  proyecto_asociado: string | null;
  responsable_compra: string | null;
  observaciones: string | null;
  fecha_aprobacion: string;
}

interface Ejecucion {
  id: string;
  proveedor_real: string;
  monto_real: number;
  fecha_compra: string;
  medio_pago: string;
  numero_comprobante: string | null;
  observaciones: string | null;
}

interface Rendicion {
  id: string;
  monto_rendido: number;
  diferencia: number;
  estado_revision: string;
  observaciones_tesoreria: string | null;
  fecha_cierre: string | null;
}

interface HistorialItem {
  id: string;
  accion: string;
  responsable: string;
  detalle: string | null;
  created_at: string;
}

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export default function SolicitudDetailSheet({ solicitud, open, onOpenChange, onUpdated }: Props) {
  const [aprobacion, setAprobacion] = useState<Aprobacion | null>(null);
  const [ejecucion, setEjecucion] = useState<Ejecucion | null>(null);
  const [rendicion, setRendicion] = useState<Rendicion | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [tab, setTab] = useState<"detalle" | "aprobar" | "ejecutar" | "rendir">("detalle");

  // Forms
  const [apForm, setApForm] = useState({ aprobado_por: "", decision: "aprobada", monto_aprobado: 0, centro_costo: "", proyecto_asociado: "", responsable_compra: "", observaciones: "" });
  const [ejForm, setEjForm] = useState({ proveedor_real: "", monto_real: 0, fecha_compra: "", medio_pago: "", numero_comprobante: "", observaciones: "" });
  const [reForm, setReForm] = useState({ monto_rendido: 0, observaciones_tesoreria: "", estado_revision: "rendida" });

  useEffect(() => {
    if (solicitud) {
      fetchRelated(solicitud.id);
      setTab("detalle");
      setApForm(f => ({ ...f, monto_aprobado: solicitud.monto_estimado, proyecto_asociado: solicitud.proyecto_asociado || "" }));
    }
  }, [solicitud]);

  const fetchRelated = async (id: string) => {
    const [ap, ej, re, hi] = await Promise.all([
      supabase.from("aprobaciones_compra" as any).select("*").eq("solicitud_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("ejecuciones_compra" as any).select("*").eq("solicitud_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("rendiciones_compra" as any).select("*").eq("solicitud_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("historial_compra" as any).select("*").eq("solicitud_id", id).order("created_at", { ascending: false }),
    ]);
    setAprobacion((ap.data as any)?.[0] ?? null);
    setEjecucion((ej.data as any)?.[0] ?? null);
    setRendicion((re.data as any)?.[0] ?? null);
    setHistorial((hi.data as any) ?? []);
  };

  const logHistory = async (solicitud_id: string, accion: string, responsable: string, detalle?: string) => {
    await supabase.from("historial_compra" as any).insert({ solicitud_id, accion, responsable, detalle } as any);
  };

  const updateEstado = async (nuevoEstado: string, responsable: string) => {
    if (!solicitud) return;
    await supabase.from("solicitudes_compra" as any).update({ estado: nuevoEstado } as any).eq("id", solicitud.id);
    await logHistory(solicitud.id, `Estado cambiado a ${nuevoEstado}`, responsable);
  };

  // Handle approval
  const handleAprobar = async () => {
    if (!solicitud || !apForm.aprobado_por.trim()) { toast.error("Ingresa quién aprueba"); return; }
    const decision = apForm.decision;
    await supabase.from("aprobaciones_compra" as any).insert({ solicitud_id: solicitud.id, ...apForm, monto_aprobado: apForm.monto_aprobado || null } as any);
    await updateEstado(decision === "aprobada" ? "aprobada" : "rechazada", apForm.aprobado_por);
    toast.success(decision === "aprobada" ? "Solicitud aprobada" : "Solicitud rechazada");
    onUpdated();
    fetchRelated(solicitud.id);
    setTab("detalle");
  };

  // Handle execution
  const handleEjecutar = async () => {
    if (!solicitud || !ejForm.proveedor_real.trim() || !ejForm.medio_pago) { toast.error("Completa proveedor y medio de pago"); return; }
    if (ejForm.monto_real <= 0) { toast.error("El monto real debe ser mayor a 0"); return; }

    // Check 10% rule
    const montoAprobado = aprobacion?.monto_aprobado || solicitud.monto_estimado;
    if (ejForm.monto_real > montoAprobado * 1.1) {
      const ok = confirm(`⚠️ El monto real ($${ejForm.monto_real.toLocaleString()}) supera en más de 10% al aprobado ($${montoAprobado.toLocaleString()}). ¿Continuar?`);
      if (!ok) return;
    }

    await supabase.from("ejecuciones_compra" as any).insert({ solicitud_id: solicitud.id, ...ejForm, fecha_compra: ejForm.fecha_compra || new Date().toISOString().split("T")[0] } as any);
    await updateEstado("comprada", "Sistema");
    toast.success("Compra registrada");
    onUpdated();
    fetchRelated(solicitud.id);
    setTab("detalle");
  };

  // Handle rendicion
  const handleRendir = async () => {
    if (!solicitud) return;
    const montoAprobado = aprobacion?.monto_aprobado || solicitud.monto_estimado;
    const diferencia = reForm.monto_rendido - montoAprobado;
    await supabase.from("rendiciones_compra" as any).insert({
      solicitud_id: solicitud.id,
      monto_rendido: reForm.monto_rendido,
      diferencia,
      estado_revision: reForm.estado_revision,
      observaciones_tesoreria: reForm.observaciones_tesoreria || null,
      fecha_cierre: reForm.estado_revision === "cerrada" ? new Date().toISOString() : null,
    } as any);
    await updateEstado(reForm.estado_revision, "Tesorería");
    toast.success("Rendición registrada");
    onUpdated();
    fetchRelated(solicitud.id);
    setTab("detalle");
  };

  if (!solicitud) return null;

  const estado = solicitud.estado as EstadoCompra;
  const canApprove = ["enviada", "en revisión"].includes(estado);
  const canExecute = estado === "aprobada";
  const canRender = ["comprada", "observada"].includes(estado);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{solicitud.titulo}</SheetTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={`text-xs capitalize ${ESTADO_COLOR[estado] || "bg-muted text-muted-foreground"}`}>
              {estado}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">{solicitud.prioridad}</Badge>
          </div>
        </SheetHeader>

        {/* Action tabs */}
        <div className="flex gap-1 mt-4 border-b border-border">
          <button onClick={() => setTab("detalle")} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "detalle" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Detalle
          </button>
          {canApprove && (
            <button onClick={() => setTab("aprobar")} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "aprobar" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Aprobar
            </button>
          )}
          {canExecute && (
            <button onClick={() => setTab("ejecutar")} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "ejecutar" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Ejecutar
            </button>
          )}
          {canRender && (
            <button onClick={() => setTab("rendir")} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "rendir" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Rendir
            </button>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {tab === "detalle" && (
            <>
              {/* Solicitud info */}
              <Section title="Solicitud">
                <Field label="Descripción" value={solicitud.descripcion} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo de Gasto" value={solicitud.tipo_gasto} />
                  <Field label="Categoría/Equipo" value={solicitud.categoria_equipo} />
                  <Field label="Proyecto" value={solicitud.proyecto_asociado} />
                  <Field label="Cantidad" value={String(solicitud.cantidad)} />
                  <Field label="Monto Estimado" value={`$${solicitud.monto_estimado.toLocaleString("es-CL")}`} />
                  <Field label="Fecha Requerida" value={solicitud.fecha_requerida ? format(new Date(solicitud.fecha_requerida), "dd/MM/yyyy") : null} />
                  <Field label="Proveedor Sugerido" value={solicitud.proveedor_sugerido} />
                  <Field label="Solicitante" value={solicitud.solicitante} />
                </div>
                {solicitud.justificacion && <Field label="Justificación" value={solicitud.justificacion} />}
                <Field label="Creada" value={format(new Date(solicitud.created_at), "dd/MM/yyyy HH:mm", { locale: es })} />
              </Section>

              {/* Aprobación */}
              {aprobacion && (
                <Section title="Aprobación" icon={aprobacion.decision === "aprobada" ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Decisión" value={aprobacion.decision} />
                    <Field label="Aprobado por" value={aprobacion.aprobado_por} />
                    <Field label="Monto Aprobado" value={aprobacion.monto_aprobado ? `$${aprobacion.monto_aprobado.toLocaleString("es-CL")}` : null} />
                    <Field label="Centro de Costo" value={aprobacion.centro_costo} />
                    <Field label="Responsable Compra" value={aprobacion.responsable_compra} />
                    <Field label="Fecha" value={format(new Date(aprobacion.fecha_aprobacion), "dd/MM/yyyy HH:mm", { locale: es })} />
                  </div>
                  {aprobacion.observaciones && <Field label="Observaciones" value={aprobacion.observaciones} />}
                </Section>
              )}

              {/* Ejecución */}
              {ejecucion && (
                <Section title="Ejecución de Compra" icon={<FileText className="w-4 h-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Proveedor" value={ejecucion.proveedor_real} />
                    <Field label="Monto Real" value={`$${ejecucion.monto_real.toLocaleString("es-CL")}`} />
                    <Field label="Fecha Compra" value={format(new Date(ejecucion.fecha_compra), "dd/MM/yyyy")} />
                    <Field label="Medio de Pago" value={ejecucion.medio_pago} />
                    <Field label="N° Comprobante" value={ejecucion.numero_comprobante} />
                  </div>
                  {/* Alert if over 10% */}
                  {aprobacion?.monto_aprobado && ejecucion.monto_real > aprobacion.monto_aprobado * 1.1 && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Monto real supera en más de 10% al aprobado
                    </div>
                  )}
                  {ejecucion.observaciones && <Field label="Observaciones" value={ejecucion.observaciones} />}
                </Section>
              )}

              {/* Rendición */}
              {rendicion && (
                <Section title="Rendición">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Monto Rendido" value={`$${rendicion.monto_rendido.toLocaleString("es-CL")}`} />
                    <Field label="Diferencia" value={`$${rendicion.diferencia.toLocaleString("es-CL")}`} />
                    <Field label="Estado Revisión" value={rendicion.estado_revision} />
                    <Field label="Fecha Cierre" value={rendicion.fecha_cierre ? format(new Date(rendicion.fecha_cierre), "dd/MM/yyyy HH:mm", { locale: es }) : null} />
                  </div>
                  {rendicion.observaciones_tesoreria && <Field label="Observaciones Tesorería" value={rendicion.observaciones_tesoreria} />}
                </Section>
              )}

              {/* Historial */}
              {historial.length > 0 && (
                <Section title="Historial" icon={<Clock className="w-4 h-4 text-muted-foreground" />}>
                  <div className="space-y-2">
                    {historial.map((h) => (
                      <div key={h.id} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium">{h.accion}</span>
                          <span className="text-muted-foreground"> — {h.responsable}</span>
                          {h.detalle && <p className="text-muted-foreground text-xs">{h.detalle}</p>}
                          <p className="text-muted-foreground text-xs">{format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Quick actions */}
              {estado === "borrador" && (
                <Button className="w-full" onClick={async () => { await updateEstado("enviada", solicitud.solicitante); toast.success("Solicitud enviada"); onUpdated(); fetchRelated(solicitud.id); }}>
                  Enviar Solicitud
                </Button>
              )}
              {estado === "enviada" && (
                <Button variant="outline" className="w-full" onClick={async () => { await updateEstado("en revisión", "Sistema"); toast.success("En revisión"); onUpdated(); fetchRelated(solicitud.id); }}>
                  Marcar En Revisión
                </Button>
              )}
            </>
          )}

          {/* Approve form */}
          {tab === "aprobar" && (
            <div className="space-y-4">
              <div>
                <Label>Aprobado por *</Label>
                <Input value={apForm.aprobado_por} onChange={(e) => setApForm(f => ({ ...f, aprobado_por: e.target.value }))} />
              </div>
              <div>
                <Label>Decisión</Label>
                <Select value={apForm.decision} onValueChange={(v) => setApForm(f => ({ ...f, decision: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobada">Aprobar</SelectItem>
                    <SelectItem value="rechazada">Rechazar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Monto Aprobado</Label>
                <Input type="number" value={apForm.monto_aprobado} onChange={(e) => setApForm(f => ({ ...f, monto_aprobado: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Centro de Costo</Label>
                <Input value={apForm.centro_costo} onChange={(e) => setApForm(f => ({ ...f, centro_costo: e.target.value }))} />
              </div>
              <div>
                <Label>Responsable de Compra</Label>
                <Input value={apForm.responsable_compra} onChange={(e) => setApForm(f => ({ ...f, responsable_compra: e.target.value }))} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea value={apForm.observaciones} onChange={(e) => setApForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} />
              </div>
              <Button className="w-full" onClick={handleAprobar}>
                {apForm.decision === "aprobada" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
              </Button>
            </div>
          )}

          {/* Execute form */}
          {tab === "ejecutar" && (
            <div className="space-y-4">
              <div>
                <Label>Proveedor Real *</Label>
                <Input value={ejForm.proveedor_real} onChange={(e) => setEjForm(f => ({ ...f, proveedor_real: e.target.value }))} />
              </div>
              <div>
                <Label>Monto Real *</Label>
                <Input type="number" value={ejForm.monto_real} onChange={(e) => setEjForm(f => ({ ...f, monto_real: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Fecha de Compra</Label>
                <Input type="date" value={ejForm.fecha_compra} onChange={(e) => setEjForm(f => ({ ...f, fecha_compra: e.target.value }))} />
              </div>
              <div>
                <Label>Medio de Pago *</Label>
                <Select value={ejForm.medio_pago} onValueChange={(v) => setEjForm(f => ({ ...f, medio_pago: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {MEDIOS_PAGO.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>N° Boleta/Factura</Label>
                <Input value={ejForm.numero_comprobante} onChange={(e) => setEjForm(f => ({ ...f, numero_comprobante: e.target.value }))} />
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea value={ejForm.observaciones} onChange={(e) => setEjForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} />
              </div>
              <Button className="w-full" onClick={handleEjecutar}>Registrar Compra</Button>
            </div>
          )}

          {/* Rendicion form */}
          {tab === "rendir" && (
            <div className="space-y-4">
              <div>
                <Label>Monto Rendido</Label>
                <Input type="number" value={reForm.monto_rendido} onChange={(e) => setReForm(f => ({ ...f, monto_rendido: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Estado de Revisión</Label>
                <Select value={reForm.estado_revision} onValueChange={(v) => setReForm(f => ({ ...f, estado_revision: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rendida">Rendida</SelectItem>
                    <SelectItem value="observada">Observada</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observaciones de Tesorería</Label>
                <Textarea value={reForm.observaciones_tesoreria} onChange={(e) => setReForm(f => ({ ...f, observaciones_tesoreria: e.target.value }))} rows={3} />
              </div>
              <Button className="w-full" onClick={handleRendir}>Registrar Rendición</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper components
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="bg-muted/30 rounded-md p-3 space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
