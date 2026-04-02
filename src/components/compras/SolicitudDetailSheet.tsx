import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, XCircle, Clock, FileText, Upload } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ESTADO_COLOR, MEDIOS_PAGO } from "@/data/comprasConstants";
import type { EstadoCompra } from "@/data/comprasConstants";
import { usePersonas, useProyectos, useStaffRoles, useCentrosCosto, personaLabel } from "@/hooks/use-relational-data";

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
  comprobante_path: string | null;
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
  const [uploading, setUploading] = useState(false);

  const { personas } = usePersonas();
  const { proyectos } = useProyectos();
  const { roles: staffRoles } = useStaffRoles();
  const [nivelesAprobacion, setNivelesAprobacion] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("niveles_aprobacion" as any).select("*").eq("activo", true).order("monto_minimo").then(({ data }) => {
      setNivelesAprobacion((data as any[]) ?? []);
    });
  }, []);

  // Filter personas authorized to approve based on purchase amount
  const personasAutorizadas = (() => {
    if (!solicitud) return [];
    const monto = solicitud.monto_estimado;
    const nivel = nivelesAprobacion.find((n: any) =>
      monto >= n.monto_minimo && (n.monto_maximo === null || monto <= n.monto_maximo)
    );
    if (!nivel) return personas; // fallback: show all
    const rolesAutorizados: string[] = nivel.roles_autorizados;
    const personaIdsAutorizadas = staffRoles
      .filter(sr => sr.activo && rolesAutorizados.includes(sr.rol))
      .map(sr => sr.persona_id);
    return personas.filter(p => personaIdsAutorizadas.includes(p.id));
  })();

  const [apForm, setApForm] = useState({ aprobado_por_id: "", decision: "aprobada", monto_aprobado: 0, centro_costo: "", proyecto_id: "", responsable_compra_id: "", observaciones: "" });
  const [ejForm, setEjForm] = useState({ proveedor_real: "", monto_real: 0, fecha_compra: "", medio_pago: "", numero_comprobante: "", comprobante_path: "", observaciones: "", ejecutado_por_id: "" });
  const [reForm, setReForm] = useState({ monto_rendido: 0, observaciones_tesoreria: "", estado_revision: "rendida", revisado_por_id: "" });

  useEffect(() => {
    if (solicitud) {
      fetchRelated(solicitud.id);
      setTab("detalle");
      setApForm(f => ({ ...f, monto_aprobado: solicitud.monto_estimado }));
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

  const logHistory = async (solicitud_id: string, accion: string, responsable: string, responsable_id?: string, detalle?: string) => {
    await supabase.from("historial_compra" as any).insert({
      solicitud_id, accion, responsable, responsable_id: responsable_id || null, detalle,
    } as any);
  };

  const updateEstado = async (nuevoEstado: string, responsable: string, responsable_id?: string) => {
    if (!solicitud) return;
    await supabase.from("solicitudes_compra" as any).update({ estado: nuevoEstado } as any).eq("id", solicitud.id);
    await logHistory(solicitud.id, `Estado cambiado a ${nuevoEstado}`, responsable, responsable_id);
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `comprobantes/${solicitud!.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("documentos").upload(path, file);
    setUploading(false);
    if (error) {
      toast.error("Error al subir comprobante");
      return null;
    }
    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleAprobar = async () => {
    if (!solicitud || !apForm.aprobado_por_id) { toast.error("Selecciona quién aprueba"); return; }
    const persona = personas.find(p => p.id === apForm.aprobado_por_id);
    const responsablePersona = personas.find(p => p.id === apForm.responsable_compra_id);
    const proyectoObj = proyectos.find(p => p.id === apForm.proyecto_id);

    await supabase.from("aprobaciones_compra" as any).insert({
      solicitud_id: solicitud.id,
      aprobado_por_id: apForm.aprobado_por_id,
      aprobado_por: persona ? `${persona.nombre} ${persona.apellido}` : "",
      decision: apForm.decision,
      monto_aprobado: apForm.monto_aprobado || null,
      centro_costo: apForm.centro_costo || null,
      proyecto_id: apForm.proyecto_id || null,
      proyecto_asociado: proyectoObj?.nombre || null,
      responsable_compra_id: apForm.responsable_compra_id || null,
      responsable_compra: responsablePersona ? `${responsablePersona.nombre} ${responsablePersona.apellido}` : null,
      observaciones: apForm.observaciones || null,
    } as any);
    const personaName = persona ? `${persona.nombre} ${persona.apellido}` : "";
    await updateEstado(apForm.decision === "aprobada" ? "aprobada" : "rechazada", personaName, apForm.aprobado_por_id);
    toast.success(apForm.decision === "aprobada" ? "Solicitud aprobada" : "Solicitud rechazada");
    onUpdated(); fetchRelated(solicitud.id); setTab("detalle");
  };

  const handleEjecutar = async () => {
    if (!solicitud || !ejForm.proveedor_real.trim() || !ejForm.medio_pago) { toast.error("Completa proveedor y medio de pago"); return; }
    if (ejForm.monto_real <= 0) { toast.error("El monto real debe ser mayor a 0"); return; }
    const montoAprobado = aprobacion?.monto_aprobado || solicitud.monto_estimado;
    if (ejForm.monto_real > montoAprobado * 1.1) {
      const ok = confirm(`⚠️ El monto real ($${ejForm.monto_real.toLocaleString()}) supera en más de 10% al aprobado ($${montoAprobado.toLocaleString()}). ¿Continuar?`);
      if (!ok) return;
    }
    await supabase.from("ejecuciones_compra" as any).insert({
      solicitud_id: solicitud.id,
      proveedor_real: ejForm.proveedor_real,
      monto_real: ejForm.monto_real,
      fecha_compra: ejForm.fecha_compra || new Date().toISOString().split("T")[0],
      medio_pago: ejForm.medio_pago,
      numero_comprobante: ejForm.numero_comprobante || null,
      comprobante_path: ejForm.comprobante_path || null,
      observaciones: ejForm.observaciones || null,
      ejecutado_por_id: ejForm.ejecutado_por_id || null,
    } as any);
    const ejecutor = personas.find(p => p.id === ejForm.ejecutado_por_id);
    await updateEstado("comprada", ejecutor ? `${ejecutor.nombre} ${ejecutor.apellido}` : "Sistema", ejForm.ejecutado_por_id);
    toast.success("Compra registrada"); onUpdated(); fetchRelated(solicitud.id); setTab("detalle");
  };

  const handleRendir = async () => {
    if (!solicitud) return;
    const montoAprobado = aprobacion?.monto_aprobado || solicitud.monto_estimado;
    const diferencia = reForm.monto_rendido - montoAprobado;
    await supabase.from("rendiciones_compra" as any).insert({
      solicitud_id: solicitud.id, monto_rendido: reForm.monto_rendido, diferencia,
      estado_revision: reForm.estado_revision,
      observaciones_tesoreria: reForm.observaciones_tesoreria || null,
      fecha_cierre: reForm.estado_revision === "cerrada" ? new Date().toISOString() : null,
      revisado_por_id: reForm.revisado_por_id || null,
    } as any);
    const revisor = personas.find(p => p.id === reForm.revisado_por_id);
    await updateEstado(reForm.estado_revision, revisor ? `${revisor.nombre} ${revisor.apellido}` : "Tesorería", reForm.revisado_por_id);
    toast.success("Rendición registrada"); onUpdated(); fetchRelated(solicitud.id); setTab("detalle");
  };

  if (!solicitud) return null;

  const estado = solicitud.estado as EstadoCompra;
  const canApprove = ["enviada", "en revisión"].includes(estado);
  const canExecute = estado === "aprobada";
  const canRender = ["comprada", "observada"].includes(estado);

  const tabs = [
    { key: "detalle" as const, label: "Detalle", show: true },
    { key: "aprobar" as const, label: "Aprobar", show: canApprove },
    { key: "ejecutar" as const, label: "Ejecutar", show: canExecute },
    { key: "rendir" as const, label: "Rendir", show: canRender },
  ].filter((t) => t.show);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full">
        <div className="p-4 sm:p-6 pb-0">
          <SheetHeader>
            <SheetTitle className="text-base sm:text-lg leading-tight pr-6">{solicitud.titulo}</SheetTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={`text-[10px] sm:text-xs capitalize ${ESTADO_COLOR[estado] || "bg-muted text-muted-foreground"}`}>{estado}</Badge>
              <Badge variant="outline" className="text-[10px] sm:text-xs capitalize">{solicitud.prioridad}</Badge>
            </div>
          </SheetHeader>

          <div className="flex gap-0 mt-4 border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {tab === "detalle" && (
            <>
              <Section title="Solicitud">
                <Field label="Descripción" value={solicitud.descripcion} />
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
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

              {aprobacion && (
                <Section title="Aprobación" icon={aprobacion.decision === "aprobada" ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <Field label="Decisión" value={aprobacion.decision} />
                    <Field label="Aprobado por" value={aprobacion.aprobado_por} />
                    <Field label="Monto Aprobado" value={aprobacion.monto_aprobado ? `$${aprobacion.monto_aprobado.toLocaleString("es-CL")}` : null} />
                    <Field label="Centro de Costo" value={aprobacion.centro_costo} />
                    <Field label="Responsable" value={aprobacion.responsable_compra} />
                    <Field label="Fecha" value={format(new Date(aprobacion.fecha_aprobacion), "dd/MM/yyyy HH:mm", { locale: es })} />
                  </div>
                  {aprobacion.observaciones && <Field label="Observaciones" value={aprobacion.observaciones} />}
                </Section>
              )}

              {ejecucion && (
                <Section title="Ejecución" icon={<FileText className="w-4 h-4 text-primary" />}>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <Field label="Proveedor" value={ejecucion.proveedor_real} />
                    <Field label="Monto Real" value={`$${ejecucion.monto_real.toLocaleString("es-CL")}`} />
                    <Field label="Fecha Compra" value={format(new Date(ejecucion.fecha_compra), "dd/MM/yyyy")} />
                    <Field label="Medio de Pago" value={ejecucion.medio_pago} />
                    <Field label="N° Comprobante" value={ejecucion.numero_comprobante} />
                  </div>
                  {aprobacion?.monto_aprobado && ejecucion.monto_real > aprobacion.monto_aprobado * 1.1 && (
                    <div className="flex items-center gap-2 p-2.5 bg-destructive/10 rounded-md text-xs sm:text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Monto real supera en más de 10% al aprobado
                    </div>
                  )}
                  {ejecucion.comprobante_path && (
                    <div>
                      <p className="text-xs text-muted-foreground">Comprobante</p>
                      <a href={ejecucion.comprobante_path} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Ver comprobante</a>
                    </div>
                  )}
                  {ejecucion.observaciones && <Field label="Observaciones" value={ejecucion.observaciones} />}
                </Section>
              )}

              {rendicion && (
                <Section title="Rendición">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <Field label="Monto Rendido" value={`$${rendicion.monto_rendido.toLocaleString("es-CL")}`} />
                    <Field label="Diferencia" value={`$${rendicion.diferencia.toLocaleString("es-CL")}`} />
                    <Field label="Estado" value={rendicion.estado_revision} />
                    <Field label="Cierre" value={rendicion.fecha_cierre ? format(new Date(rendicion.fecha_cierre), "dd/MM/yyyy HH:mm", { locale: es }) : null} />
                  </div>
                  {rendicion.observaciones_tesoreria && <Field label="Obs. Tesorería" value={rendicion.observaciones_tesoreria} />}
                </Section>
              )}

              {historial.length > 0 && (
                <Section title="Historial" icon={<Clock className="w-4 h-4 text-muted-foreground" />}>
                  <div className="space-y-2">
                    {historial.map((h) => (
                      <div key={h.id} className="flex items-start gap-2 text-xs sm:text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium">{h.accion}</span>
                          <span className="text-muted-foreground"> — {h.responsable}</span>
                          {h.detalle && <p className="text-muted-foreground text-xs">{h.detalle}</p>}
                          <p className="text-muted-foreground text-[10px]">{format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {tab === "aprobar" && (
            <FormSection>
              {(() => {
                const monto = solicitud.monto_estimado;
                const nivel = nivelesAprobacion.find((n: any) =>
                  monto >= n.monto_minimo && (n.monto_maximo === null || monto <= n.monto_maximo)
                );
                return nivel ? (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md mb-1">
                    <span className="font-medium">Nivel de autorización:</span> {nivel.descripcion}
                  </div>
                ) : null;
              })()}
              <FormField label="Aprobado por *">
                <Select value={apForm.aprobado_por_id} onValueChange={(v) => setApForm(f => ({ ...f, aprobado_por_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                  <SelectContent>
                    {personasAutorizadas.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">No hay staff autorizado para este monto</div>
                    )}
                    {personasAutorizadas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Decisión">
                <Select value={apForm.decision} onValueChange={(v) => setApForm(f => ({ ...f, decision: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobada">Aprobar</SelectItem>
                    <SelectItem value="rechazada">Rechazar</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Monto Aprobado ($)">
                <Input type="number" value={apForm.monto_aprobado} onChange={(e) => setApForm(f => ({ ...f, monto_aprobado: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Centro de Costo">
                <Input value={apForm.centro_costo} onChange={(e) => setApForm(f => ({ ...f, centro_costo: e.target.value }))} />
              </FormField>
              <FormField label="Proyecto Asociado">
                <Select value={apForm.proyecto_id} onValueChange={(v) => setApForm(f => ({ ...f, proyecto_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar proyecto" /></SelectTrigger>
                  <SelectContent>
                    {proyectos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Responsable de Compra">
                <Select value={apForm.responsable_compra_id} onValueChange={(v) => setApForm(f => ({ ...f, responsable_compra_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Observaciones">
                <Textarea value={apForm.observaciones} onChange={(e) => setApForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} />
              </FormField>
            </FormSection>
          )}

          {tab === "ejecutar" && (
            <FormSection>
              <FormField label="Ejecutado por">
                <Select value={ejForm.ejecutado_por_id} onValueChange={(v) => setEjForm(f => ({ ...f, ejecutado_por_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Proveedor Real *">
                <Input value={ejForm.proveedor_real} onChange={(e) => setEjForm(f => ({ ...f, proveedor_real: e.target.value }))} />
              </FormField>
              <FormField label="Monto Real * ($)">
                <Input type="number" value={ejForm.monto_real} onChange={(e) => setEjForm(f => ({ ...f, monto_real: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Fecha de Compra">
                <Input type="date" value={ejForm.fecha_compra} onChange={(e) => setEjForm(f => ({ ...f, fecha_compra: e.target.value }))} />
              </FormField>
              <FormField label="Medio de Pago *">
                <Select value={ejForm.medio_pago} onValueChange={(v) => setEjForm(f => ({ ...f, medio_pago: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {MEDIOS_PAGO.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="N° Boleta/Factura">
                <Input value={ejForm.numero_comprobante} onChange={(e) => setEjForm(f => ({ ...f, numero_comprobante: e.target.value }))} />
              </FormField>
              <FormField label="Comprobante (foto/PDF)">
                <label className="flex items-center gap-2 p-3 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/30 active:bg-muted/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? "Subiendo..." : ejForm.comprobante_path ? "Comprobante cargado ✓" : "Toca para adjuntar"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file);
                        if (url) setEjForm(f => ({ ...f, comprobante_path: url }));
                      }
                    }}
                  />
                </label>
              </FormField>
              <FormField label="Observaciones">
                <Textarea value={ejForm.observaciones} onChange={(e) => setEjForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} />
              </FormField>
            </FormSection>
          )}

          {tab === "rendir" && (
            <FormSection>
              <FormField label="Revisado por">
                <Select value={reForm.revisado_por_id} onValueChange={(v) => setReForm(f => ({ ...f, revisado_por_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Monto Rendido ($)">
                <Input type="number" value={reForm.monto_rendido} onChange={(e) => setReForm(f => ({ ...f, monto_rendido: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Estado de Revisión">
                <Select value={reForm.estado_revision} onValueChange={(v) => setReForm(f => ({ ...f, estado_revision: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rendida">Rendida</SelectItem>
                    <SelectItem value="observada">Observada</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Observaciones de Tesorería">
                <Textarea value={reForm.observaciones_tesoreria} onChange={(e) => setReForm(f => ({ ...f, observaciones_tesoreria: e.target.value }))} rows={3} />
              </FormField>
            </FormSection>
          )}
        </div>

        {/* Sticky bottom actions */}
        <div className="border-t border-border p-4 sm:p-6 bg-card">
          {tab === "detalle" && estado === "borrador" && (
            <Button className="w-full h-12 sm:h-10 text-sm" onClick={async () => { await updateEstado("enviada", solicitud.solicitante); toast.success("Solicitud enviada"); onUpdated(); fetchRelated(solicitud.id); }}>
              Enviar Solicitud
            </Button>
          )}
          {tab === "detalle" && estado === "enviada" && (
            <Button variant="outline" className="w-full h-12 sm:h-10 text-sm" onClick={async () => { await updateEstado("en revisión", "Sistema"); toast.success("En revisión"); onUpdated(); fetchRelated(solicitud.id); }}>
              Marcar En Revisión
            </Button>
          )}
          {tab === "aprobar" && (
            <Button className="w-full h-12 sm:h-10 text-sm" onClick={handleAprobar}>
              {apForm.decision === "aprobada" ? "Aprobar Solicitud" : "Rechazar Solicitud"}
            </Button>
          )}
          {tab === "ejecutar" && (
            <Button className="w-full h-12 sm:h-10 text-sm" disabled={uploading} onClick={handleEjecutar}>
              Registrar Compra
            </Button>
          )}
          {tab === "rendir" && (
            <Button className="w-full h-12 sm:h-10 text-sm" onClick={handleRendir}>
              Registrar Rendición
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="bg-muted/30 rounded-md p-3 space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
      <p className="text-xs sm:text-sm text-foreground">{value}</p>
    </div>
  );
}

function FormSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
