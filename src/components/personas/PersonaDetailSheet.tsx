import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Users, HeartPulse, FileText, Upload, AlertTriangle, CheckCircle2, XCircle, Calendar, Pencil, Save, X, Loader2, Eye, Trash2, Camera } from "lucide-react";
import type { Persona, DocumentoPersona, Familiar } from "@/types/persona";
import { DOCUMENTOS_OBLIGATORIOS, ETIQUETAS_DOCUMENTO, documentoVencido, documentosPorVencer, requiereTutor, calcularEdad, calcularCategoria } from "@/types/persona";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type ApoderadoSource = "padre" | "madre" | "otro";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Props {
  persona: Persona | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (persona: Persona) => void;
}

function InfoField({ label, value, editing, onChange, type = "text" }: { label: string; value: string; editing?: boolean; onChange?: (v: string) => void; type?: string }) {
  if (editing && onChange) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} type={type} className="h-8 text-sm" />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function FamiliarCard({ titulo, familiar, editing, onChange }: { titulo: string; familiar: Familiar; editing?: boolean; onChange?: (f: Familiar) => void }) {
  const tieneData = familiar.nombre || familiar.rut;
  const update = (field: keyof Familiar, value: string) => {
    onChange?.({ ...familiar, [field]: value });
  };

  if (!editing && !tieneData) {
    return (
      <div className="glass rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">{titulo}</h4>
        <p className="text-xs text-muted-foreground italic">Sin información registrada</p>
      </div>
    );
  }
  return (
    <div className="glass rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{titulo}</h4>
      <div className="grid grid-cols-2 gap-3">
        <InfoField label="Nombre" value={`${familiar.nombre}${!editing ? ' ' + familiar.apellido : ''}`} editing={editing} onChange={(v) => update("nombre", v)} />
        {editing && <InfoField label="Apellido" value={familiar.apellido} editing={editing} onChange={(v) => update("apellido", v)} />}
        {!editing && <InfoField label="RUT" value={familiar.rut} />}
        {editing && <InfoField label="RUT" value={familiar.rut} editing onChange={(v) => update("rut", v)} />}
        <InfoField label="Teléfono" value={familiar.telefono} editing={editing} onChange={(v) => update("telefono", v)} />
        <InfoField label="Email" value={familiar.email} editing={editing} onChange={(v) => update("email", v)} />
        <InfoField label="Dirección" value={familiar.direccion} editing={editing} onChange={(v) => update("direccion", v)} />
        <InfoField label="Profesión" value={familiar.profesion} editing={editing} onChange={(v) => update("profesion", v)} />
      </div>
    </div>
  );
}

function DocStatusIcon({ doc }: { doc?: DocumentoPersona }) {
  if (!doc) return <XCircle className="w-4 h-4 text-destructive" />;
  if (doc.etiqueta === "Certificado Médico" && documentoVencido(doc)) {
    return <AlertTriangle className="w-4 h-4 text-warning" />;
  }
  return <CheckCircle2 className="w-4 h-4 text-success" />;
}

export default function PersonaDetailSheet({ persona, open, onOpenChange, onSave }: Props) {
  const [uploadLabel, setUploadLabel] = useState<string>("Cédula Identidad");
  const [uploadVencimiento, setUploadVencimiento] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Persona | null>(null);
  const [apoderadoSource, setApoderadoSource] = useState<ApoderadoSource>("otro");
  const [uploading, setUploading] = useState(false);
  const [dbDocs, setDbDocs] = useState<Array<{ id: string; etiqueta: string; nombre_archivo: string; tipo_mime: string; storage_path: string; url_publica: string | null; fecha_carga: string; fecha_vencimiento: string | null }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDbDocs = useCallback(async () => {
    if (!persona) return;
    const { data } = await supabase
      .from("documentos")
      .select("*")
      .eq("persona_id", persona.id)
      .order("fecha_carga", { ascending: false });
    if (data) setDbDocs(data);
  }, [persona]);

  useEffect(() => {
    if (open && persona) loadDbDocs();
  }, [open, persona, loadDbDocs]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !persona) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato no soportado. Usa JPG, PNG, WebP o PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const storagePath = `${persona.id}/${Date.now()}_${uploadLabel.replace(/\s/g, "_")}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(storagePath);

      const { error: dbError } = await supabase.from("documentos").insert({
        persona_id: persona.id,
        etiqueta: uploadLabel,
        nombre_archivo: file.name,
        tipo_mime: file.type,
        storage_path: storagePath,
        url_publica: urlData.publicUrl,
        fecha_vencimiento: uploadLabel === "Certificado Médico" && uploadVencimiento ? uploadVencimiento : null,
      });

      if (dbError) throw dbError;

      toast.success(`${uploadLabel} subido correctamente`);
      setUploadVencimiento("");
      await loadDbDocs();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir: " + (err.message || "Intenta de nuevo"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (doc: typeof dbDocs[0]) => {
    const { error: storageErr } = await supabase.storage.from("documentos").remove([doc.storage_path]);
    if (storageErr) { toast.error("Error al eliminar archivo"); return; }
    const { error: dbErr } = await supabase.from("documentos").delete().eq("id", doc.id);
    if (dbErr) { toast.error("Error al eliminar registro"); return; }
    toast.success("Documento eliminado");
    await loadDbDocs();
  };

  useEffect(() => {
    if (persona) {
      setDraft({ ...persona, padre: { ...persona.padre }, madre: { ...persona.madre }, apoderado: { ...persona.apoderado }, documentos: [...persona.documentos] });
      // Detect if apoderado matches padre or madre
      const matchPadre = persona.padre.rut && persona.apoderado.rut && persona.padre.rut === persona.apoderado.rut;
      const matchMadre = persona.madre.rut && persona.apoderado.rut && persona.madre.rut === persona.apoderado.rut;
      setApoderadoSource(matchPadre ? "padre" : matchMadre ? "madre" : "otro");
    }
    setEditing(false);
  }, [persona]);

  if (!persona || !draft) return null;

  const getDoc = (etiqueta: string) => draft.documentos.find((d) => d.etiqueta === etiqueta);
  const necesitaTutor = requiereTutor(draft.categoria);

  const updateDraft = (field: keyof Persona, value: any) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (field === "fechaNacimiento" && value) {
        updated.edad = calcularEdad(value);
        updated.categoria = calcularCategoria(value);
      }
      return updated;
    });
  };

  const handleSave = () => {
    if (draft) {
      onSave?.(draft);
      setEditing(false);
      toast.success("Datos guardados correctamente");
    }
  };

  const handleCancel = () => {
    setDraft({ ...persona, padre: { ...persona.padre }, madre: { ...persona.madre }, apoderado: { ...persona.apoderado }, documentos: [...persona.documentos] });
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-lg">{draft.nombre} {draft.apellido}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{draft.categoria}</Badge>
                <Badge variant={draft.estado === "Moroso" ? "destructive" : "outline"} className="text-xs">{draft.estado}</Badge>
                <span className="text-xs text-muted-foreground">{draft.tipo}</span>
              </SheetDescription>
            </div>
            <div className="flex gap-1.5">
              {editing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={handleCancel} className="gap-1.5 text-xs">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs">
                    <Save className="w-3.5 h-3.5" /> Guardar
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)} className="gap-1.5 text-xs">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="personal" className="mt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="personal" className="gap-1.5 text-xs"><User className="w-3.5 h-3.5" /> Personal</TabsTrigger>
            <TabsTrigger value="familia" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Familia</TabsTrigger>
            <TabsTrigger value="salud" className="gap-1.5 text-xs"><HeartPulse className="w-3.5 h-3.5" /> Salud</TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Documentos</TabsTrigger>
          </TabsList>

          {/* ─── PERSONAL ─── */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="glass rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Nombre" value={draft.nombre} editing={editing} onChange={(v) => updateDraft("nombre", v)} />
                <InfoField label="Apellido" value={draft.apellido} editing={editing} onChange={(v) => updateDraft("apellido", v)} />
                <InfoField label="RUT" value={draft.rut} editing={editing} onChange={(v) => updateDraft("rut", v)} />
                <InfoField
                  label="Fecha de Nacimiento"
                  value={editing ? draft.fechaNacimiento : (draft.fechaNacimiento ? format(new Date(draft.fechaNacimiento), "dd 'de' MMMM, yyyy", { locale: es }) : "—")}
                  editing={editing}
                  type="date"
                  onChange={(v) => updateDraft("fechaNacimiento", v)}
                />
                <InfoField label="Edad" value={`${draft.edad} años`} />
                <InfoField label="Categoría (auto)" value={draft.categoria} />
                {editing ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Rama</Label>
                    <Select value={draft.rama} onValueChange={(v) => updateDraft("rama", v)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fem">Fem</SelectItem>
                        <SelectItem value="Masc">Masc</SelectItem>
                        <SelectItem value="Mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <InfoField label="Rama" value={draft.rama} />
                )}
                {editing ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Select value={draft.tipo} onValueChange={(v) => updateDraft("tipo", v as any)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jugador">Jugador</SelectItem>
                        <SelectItem value="Jugadora">Jugadora</SelectItem>
                        <SelectItem value="Socio">Socio</SelectItem>
                        <SelectItem value="Socia">Socia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <InfoField label="Tipo" value={draft.tipo} />
                )}
                <InfoField label="Colegio" value={draft.colegio} editing={editing} onChange={(v) => updateDraft("colegio", v)} />
                {editing ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <Select value={draft.estado} onValueChange={(v) => updateDraft("estado", v as any)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Moroso">Moroso</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <InfoField label="Estado" value={draft.estado} />
                )}
              </div>
            </div>
            {necesitaTutor && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-warning">Esta categoría requiere un Apoderado/Tutor vinculado obligatoriamente.</p>
              </div>
            )}
          </TabsContent>

          {/* ─── FAMILIA ─── */}
          <TabsContent value="familia" className="space-y-4 mt-4">
            <FamiliarCard titulo="Padre" familiar={draft.padre} editing={editing} onChange={(f) => {
              setDraft((p) => {
                if (!p) return p;
                const updated = { ...p, padre: f };
                if (apoderadoSource === "padre") updated.apoderado = { ...f };
                return updated;
              });
            }} />
            <FamiliarCard titulo="Madre" familiar={draft.madre} editing={editing} onChange={(f) => {
              setDraft((p) => {
                if (!p) return p;
                const updated = { ...p, madre: f };
                if (apoderadoSource === "madre") updated.apoderado = { ...f };
                return updated;
              });
            }} />
            <Separator />
            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Apoderado / Tutor</h4>
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">¿Quién es el apoderado?</Label>
                    <Select value={apoderadoSource} onValueChange={(v: ApoderadoSource) => {
                      setApoderadoSource(v);
                      if (v === "padre") setDraft((p) => p ? { ...p, apoderado: { ...p.padre } } : p);
                      else if (v === "madre") setDraft((p) => p ? { ...p, apoderado: { ...p.madre } } : p);
                      else setDraft((p) => p ? { ...p, apoderado: { nombre: "", apellido: "", rut: "", telefono: "", email: "", direccion: "", profesion: "" } } : p);
                    }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="padre">Mismo que el Padre</SelectItem>
                        <SelectItem value="madre">Misma que la Madre</SelectItem>
                        <SelectItem value="otro">Otra persona</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {apoderadoSource === "otro" && (
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Nombre" value={draft.apoderado.nombre} editing onChange={(v) => setDraft((p) => p ? { ...p, apoderado: { ...p.apoderado, nombre: v } } : p)} />
                      <InfoField label="Apellido" value={draft.apoderado.apellido} editing onChange={(v) => setDraft((p) => p ? { ...p, apoderado: { ...p.apoderado, apellido: v } } : p)} />
                      <InfoField label="RUT" value={draft.apoderado.rut} editing onChange={(v) => setDraft((p) => p ? { ...p, apoderado: { ...p.apoderado, rut: v } } : p)} />
                      <InfoField label="Teléfono" value={draft.apoderado.telefono} editing onChange={(v) => setDraft((p) => p ? { ...p, apoderado: { ...p.apoderado, telefono: v } } : p)} />
                      <InfoField label="Email" value={draft.apoderado.email} editing onChange={(v) => setDraft((p) => p ? { ...p, apoderado: { ...p.apoderado, email: v } } : p)} />
                      <InfoField label="Dirección" value={draft.apoderado.direccion} editing onChange={(v) => setDraft((p) => p ? { ...p, apoderado: { ...p.apoderado, direccion: v } } : p)} />
                      <InfoField label="Profesión" value={draft.apoderado.profesion} editing onChange={(v) => setDraft((p) => p ? { ...p, apoderado: { ...p.apoderado, profesion: v } } : p)} />
                    </div>
                  )}
                  {apoderadoSource !== "otro" && (
                    <p className="text-xs text-muted-foreground italic">
                      Los datos del apoderado se copiarán automáticamente del {apoderadoSource === "padre" ? "Padre" : "la Madre"}.
                    </p>
                  )}
                </div>
              ) : (
                (() => {
                  const ap = draft.apoderado;
                  const tieneData = ap.nombre || ap.rut;
                  if (!tieneData) return <p className="text-xs text-muted-foreground italic">Sin información registrada</p>;
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <InfoField label="Nombre" value={`${ap.nombre} ${ap.apellido}`} />
                      <InfoField label="RUT" value={ap.rut} />
                      <InfoField label="Teléfono" value={ap.telefono} />
                      <InfoField label="Email" value={ap.email} />
                      <InfoField label="Dirección" value={ap.direccion} />
                      <InfoField label="Profesión" value={ap.profesion} />
                    </div>
                  );
                })()
              )}
            </div>
          </TabsContent>

          {/* ─── SALUD ─── */}
          <TabsContent value="salud" className="space-y-4 mt-4">
            <div className="glass rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Talla" value={draft.talla} editing={editing} onChange={(v) => updateDraft("talla", v)} />
                <InfoField label="Peso" value={draft.peso} editing={editing} onChange={(v) => updateDraft("peso", v)} />
                <InfoField label="Talla Uniforme" value={draft.tallaUniforme} editing={editing} onChange={(v) => updateDraft("tallaUniforme", v)} />
                <InfoField label="Previsión de Salud" value={draft.previsionSalud} editing={editing} onChange={(v) => updateDraft("previsionSalud", v)} />
                <InfoField label="Alergias" value={draft.alergias} editing={editing} onChange={(v) => updateDraft("alergias", v)} />
              </div>
            </div>
            {(() => {
              const certMedico = getDoc("Certificado Médico");
              if (!certMedico) return null;
              const vencido = documentoVencido(certMedico);
              const porVencer = documentosPorVencer(certMedico);
              return (
                <div className={`rounded-lg border p-3 flex items-start gap-2 ${vencido ? "border-destructive/40 bg-destructive/10" : porVencer ? "border-warning/40 bg-warning/10" : "border-success/40 bg-success/10"}`}>
                  {vencido ? <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" /> : porVencer ? <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-xs font-medium">{vencido ? "Certificado Médico VENCIDO" : porVencer ? "Certificado Médico próximo a vencer" : "Certificado Médico vigente"}</p>
                    {certMedico.fechaVencimiento && (
                      <p className="text-xs text-muted-foreground">Vence: {format(new Date(certMedico.fechaVencimiento), "dd/MM/yyyy")}</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* ─── DOCUMENTOS ─── */}
          <TabsContent value="documentos" className="space-y-4 mt-4">
            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Estado de Documentos Obligatorios</h4>
              <div className="space-y-2">
                {DOCUMENTOS_OBLIGATORIOS.map((etiqueta) => {
                  const doc = getDoc(etiqueta);
                  const vencido = doc?.etiqueta === "Certificado Médico" && doc && documentoVencido(doc);
                  return (
                    <div key={etiqueta} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-foreground">{etiqueta}</span>
                      <div className="flex items-center gap-2">
                        {doc && vencido && <Badge variant="destructive" className="text-[10px]">Vencido</Badge>}
                        <DocStatusIcon doc={doc} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Documentos en la Nube</h4>
              {dbDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin documentos subidos aún</p>
              ) : (
                <div className="space-y-2">
                  {dbDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-foreground">{doc.nombre_archivo}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.etiqueta} · {format(new Date(doc.fecha_carga), "dd/MM/yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {doc.fecha_vencimiento && (
                          <span className="text-[10px] text-muted-foreground">
                            Vence: {format(new Date(doc.fecha_vencimiento), "dd/MM/yyyy")}
                          </span>
                        )}
                        {doc.url_publica && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                            <a href={doc.url_publica} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteDoc(doc)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Cargar Documento</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Etiqueta</Label>
                  <Select value={uploadLabel} onValueChange={setUploadLabel}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ETIQUETAS_DOCUMENTO.map((e) => (
                        <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {uploadLabel === "Certificado Médico" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha de Vencimiento</Label>
                    <Input type="date" value={uploadVencimiento} onChange={(e) => setUploadVencimiento(e.target.value)} className="h-9 text-xs" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="secondary"
                className="w-full gap-2 h-9 text-xs"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? "Subiendo..." : "Seleccionar Archivo (PDF, JPG, PNG)"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
