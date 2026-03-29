import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Users, HeartPulse, FileText, Upload, AlertTriangle, CheckCircle2, XCircle, Calendar } from "lucide-react";
import type { Persona, DocumentoPersona } from "@/types/persona";
import { DOCUMENTOS_OBLIGATORIOS, ETIQUETAS_DOCUMENTO, documentoVencido, documentosPorVencer, requiereTutor } from "@/types/persona";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  persona: Persona | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function FamiliarCard({ titulo, familiar }: { titulo: string; familiar: Persona["padre"] }) {
  const tieneData = familiar.nombre || familiar.rut;
  if (!tieneData) {
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
        <InfoField label="Nombre" value={`${familiar.nombre} ${familiar.apellido}`} />
        <InfoField label="RUT" value={familiar.rut} />
        <InfoField label="Teléfono" value={familiar.telefono} />
        <InfoField label="Email" value={familiar.email} />
        <InfoField label="Dirección" value={familiar.direccion} />
        <InfoField label="Profesión" value={familiar.profesion} />
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

export default function PersonaDetailSheet({ persona, open, onOpenChange }: Props) {
  const [uploadLabel, setUploadLabel] = useState<string>("Cédula Identidad");

  if (!persona) return null;

  const getDoc = (etiqueta: string) => persona.documentos.find((d) => d.etiqueta === etiqueta);
  const necesitaTutor = requiereTutor(persona.categoria);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">{persona.nombre} {persona.apellido}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{persona.categoria}</Badge>
                <Badge variant={persona.estado === "Moroso" ? "destructive" : "outline"} className="text-xs">{persona.estado}</Badge>
                <span className="text-xs text-muted-foreground">{persona.tipo}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="personal" className="mt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="personal" className="gap-1.5 text-xs">
              <User className="w-3.5 h-3.5" /> Personal
            </TabsTrigger>
            <TabsTrigger value="familia" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Familia
            </TabsTrigger>
            <TabsTrigger value="salud" className="gap-1.5 text-xs">
              <HeartPulse className="w-3.5 h-3.5" /> Salud
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Documentos
            </TabsTrigger>
          </TabsList>

          {/* ─── PERSONAL ─── */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="glass rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Nombre" value={persona.nombre} />
                <InfoField label="Apellido" value={persona.apellido} />
                <InfoField label="RUT" value={persona.rut} />
                <InfoField label="Fecha de Nacimiento" value={persona.fechaNacimiento ? format(new Date(persona.fechaNacimiento), "dd 'de' MMMM, yyyy", { locale: es }) : "—"} />
                <InfoField label="Edad" value={`${persona.edad} años`} />
                <InfoField label="Categoría (auto)" value={persona.categoria} />
                <InfoField label="Rama" value={persona.rama} />
                <InfoField label="Tipo" value={persona.tipo} />
                <InfoField label="Colegio" value={persona.colegio} />
                <InfoField label="Estado" value={persona.estado} />
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
            <FamiliarCard titulo="Padre" familiar={persona.padre} />
            <FamiliarCard titulo="Madre" familiar={persona.madre} />
            <Separator />
            <FamiliarCard titulo="Apoderado / Tutor" familiar={persona.apoderado} />
          </TabsContent>

          {/* ─── SALUD ─── */}
          <TabsContent value="salud" className="space-y-4 mt-4">
            <div className="glass rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Talla" value={persona.talla} />
                <InfoField label="Peso" value={persona.peso} />
                <InfoField label="Talla Uniforme" value={persona.tallaUniforme} />
                <InfoField label="Previsión de Salud" value={persona.previsionSalud} />
                <InfoField label="Alergias" value={persona.alergias} />
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
            {/* Status de documentos obligatorios */}
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

            {/* Lista de documentos cargados */}
            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Documentos Cargados</h4>
              {persona.documentos.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin documentos cargados</p>
              ) : (
                <div className="space-y-2">
                  {persona.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-foreground">{doc.nombreArchivo}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.etiqueta} · {doc.fechaCarga}</p>
                        </div>
                      </div>
                      {doc.fechaVencimiento && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className={`text-[10px] ${documentoVencido(doc) ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                            {format(new Date(doc.fechaVencimiento), "dd/MM/yyyy")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subir documento */}
            <div className="glass rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Cargar Documento</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Etiqueta</Label>
                  <Select value={uploadLabel} onValueChange={setUploadLabel}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
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
                    <Input type="date" className="h-9 text-xs" />
                  </div>
                )}
              </div>
              <Button variant="secondary" className="w-full gap-2 h-9 text-xs" disabled>
                <Upload className="w-3.5 h-3.5" />
                Seleccionar Archivo (PDF, JPG, PNG)
              </Button>
              <p className="text-[10px] text-muted-foreground">La carga de archivos requiere conexión a Lovable Cloud</p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
