import { Building2, Edit, Save, X, Upload, Download, Trash2, FileText, Globe, Phone, Mail, MapPin, Calendar, Shield, Users, Instagram, Facebook, Twitter, Youtube, Plus, ExternalLink, Loader2 } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClubData {
  id: string;
  nombre: string;
  deporte: string;
  ciudad: string | null;
  logo_url: string | null;
  rut: string | null;
  representante_legal: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  fecha_fundacion: string | null;
  tipo_organizacion: string | null;
  descripcion: string | null;
  redes_sociales: Record<string, string> | null;
  numero_registro: string | null;
  municipalidad: string | null;
  region: string | null;
}

interface ClubDocumento {
  id: string;
  nombre: string;
  etiqueta: string;
  descripcion: string | null;
  storage_path: string;
  nombre_archivo: string;
  tipo_mime: string;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
}

interface StaffMember {
  id: string;
  rol: string;
  activo: boolean;
  personas: {
    id: string;
    nombre: string;
    apellido: string;
    email: string | null;
    telefono: string | null;
  };
}

const ETIQUETAS_DOCUMENTO = [
  "Constitución",
  "Estatutos",
  "Acta de asamblea",
  "Inscripción municipal",
  "Inscripción IND",
  "Personalidad jurídica",
  "Certificado vigencia",
  "RUT organización",
  "Cuenta bancaria",
  "Póliza de seguro",
  "Certificado SENCE",
  "Otro",
];

const REGIONES_CHILE = [
  "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
  "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble",
  "Biobío", "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
];

export default function Organizacion() {
  const { clubId, rolSistema } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ClubData>>({});
  const [savingLogo, setSavingLogo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ nombre: "", etiqueta: "Otro", descripcion: "", fecha_emision: "", fecha_vencimiento: "", notas: "" });
  const docFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const isAdmin = rolSistema === "admin";

  // Fetch club data
  const { data: club, isLoading } = useQuery({
    queryKey: ["club-detail", clubId],
    queryFn: async () => {
      if (!clubId) return null;
      const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();
      if (error) throw error;
      return data as unknown as ClubData;
    },
    enabled: !!clubId,
  });

  // Fetch club documents
  const { data: documentos = [] } = useQuery({
    queryKey: ["club-documentos", clubId],
    queryFn: async () => {
      if (!clubId) return [];
      const { data, error } = await supabase
        .from("club_documentos" as any)
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as ClubDocumento[];
    },
    enabled: !!clubId,
  });

  // Fetch directiva (staff with directiva roles)
  const { data: directiva = [] } = useQuery({
    queryKey: ["club-directiva", clubId],
    queryFn: async () => {
      if (!clubId) return [];
      const { data, error } = await supabase
        .from("staff_roles")
        .select("id, rol, activo, personas:persona_id(id, nombre, apellido, email, telefono)")
        .eq("club_id", clubId)
        .eq("activo", true);
      if (error) throw error;
      return (data as any[]) as StaffMember[];
    },
    enabled: !!clubId,
  });

  useEffect(() => {
    if (club) setFormData(club);
  }, [club]);

  // Save club data
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ClubData>) => {
      const { error } = await supabase
        .from("clubs")
        .update({
          nombre: data.nombre,
          deporte: data.deporte,
          ciudad: data.ciudad,
          rut: data.rut,
          representante_legal: data.representante_legal,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          sitio_web: data.sitio_web,
          fecha_fundacion: data.fecha_fundacion,
          tipo_organizacion: data.tipo_organizacion,
          descripcion: data.descripcion,
          redes_sociales: data.redes_sociales as any,
          numero_registro: data.numero_registro,
          municipalidad: data.municipalidad,
          region: data.region,
        } as any)
        .eq("id", clubId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-detail", clubId] });
      toast.success("Datos del club actualizados");
      setEditing(false);
    },
    onError: () => toast.error("Error al guardar los cambios"),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clubId) return;
    setSavingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${clubId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("club-documentos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("club-documentos").getPublicUrl(path);
      await supabase.from("clubs").update({ logo_url: urlData.publicUrl } as any).eq("id", clubId);
      queryClient.invalidateQueries({ queryKey: ["club-detail", clubId] });
      toast.success("Logo actualizado");
    } catch {
      toast.error("Error al subir el logo");
    } finally {
      setSavingLogo(false);
    }
  };

  const handleDocUpload = async () => {
    const file = docFileRef.current?.files?.[0];
    if (!file || !clubId) return;
    setUploadingDoc(true);
    try {
      const path = `${clubId}/docs/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("club-documentos")
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("club_documentos" as any).insert({
        club_id: clubId,
        nombre: newDoc.nombre || file.name,
        etiqueta: newDoc.etiqueta,
        descripcion: newDoc.descripcion || null,
        storage_path: path,
        nombre_archivo: file.name,
        tipo_mime: file.type,
        fecha_emision: newDoc.fecha_emision || null,
        fecha_vencimiento: newDoc.fecha_vencimiento || null,
        notas: newDoc.notas || null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["club-documentos", clubId] });
      toast.success("Documento subido correctamente");
      setDocDialogOpen(false);
      setNewDoc({ nombre: "", etiqueta: "Otro", descripcion: "", fecha_emision: "", fecha_vencimiento: "", notas: "" });
    } catch {
      toast.error("Error al subir el documento");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocDownload = async (doc: ClubDocumento) => {
    const { data, error } = await supabase.storage.from("club-documentos").download(doc.storage_path);
    if (error) { toast.error("Error al descargar"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.nombre_archivo;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDocDelete = async (doc: ClubDocumento) => {
    if (!confirm("¿Eliminar este documento?")) return;
    await supabase.storage.from("club-documentos").remove([doc.storage_path]);
    await supabase.from("club_documentos" as any).delete().eq("id", doc.id);
    queryClient.invalidateQueries({ queryKey: ["club-documentos", clubId] });
    toast.success("Documento eliminado");
  };

  const updateField = (field: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSocial = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      redes_sociales: { ...(prev.redes_sociales || {}), [key]: value },
    }));
  };

  if (isLoading) {
    return (
      <PageShell title="Organización" description="Datos del club deportivo" icon={Building2}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  const redes = (formData.redes_sociales || {}) as Record<string, string>;
  const directivaRoles = directiva.filter((d) =>
    ["Presidente", "Vicepresidente", "Secretario", "Tesorero", "Director"].some((r) =>
      d.rol.toLowerCase().includes(r.toLowerCase())
    )
  );
  const cuerpoTecnico = directiva.filter((d) =>
    !directivaRoles.includes(d)
  );

  return (
    <PageShell
      title="Organización"
      description="Perfil institucional y documentos del club"
      icon={Building2}
      actions={
        isAdmin && (
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditing(false); if (club) setFormData(club); }} className="gap-2">
                <X className="w-4 h-4" /> Cancelar
              </Button>
              <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
              <Edit className="w-4 h-4" /> Editar
            </Button>
          )
        )
      }
    >
      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="perfil">Perfil del Club</TabsTrigger>
          <TabsTrigger value="directiva">Directiva</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        {/* ── TAB: PERFIL ── */}
        <TabsContent value="perfil" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo & Identity */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="pt-6 flex flex-col items-center gap-4">
                  <div className="relative group">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo del club" className="w-32 h-32 rounded-2xl object-contain border border-border bg-background p-2" />
                    ) : (
                      <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Building2 className="w-12 h-12 text-primary/40" />
                      </div>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => logoFileRef.current?.click()}
                          className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          {savingLogo ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Upload className="w-6 h-6 text-white" />}
                        </button>
                        <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-foreground">{formData.nombre || "Sin nombre"}</h2>
                    <p className="text-sm text-muted-foreground">{formData.tipo_organizacion || "Club Deportivo"}</p>
                    {formData.fecha_fundacion && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fundado el {format(new Date(formData.fecha_fundacion + "T12:00:00"), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  {formData.descripcion && !editing && (
                    <p className="text-sm text-muted-foreground text-center">{formData.descripcion}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Info */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Información Legal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {editing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label>Nombre del Club</Label><Input value={formData.nombre || ""} onChange={(e) => updateField("nombre", e.target.value)} /></div>
                      <div><Label>RUT</Label><Input value={formData.rut || ""} onChange={(e) => updateField("rut", e.target.value)} placeholder="12.345.678-9" /></div>
                      <div><Label>Tipo de Organización</Label>
                        <Select value={formData.tipo_organizacion || "Club Deportivo"} onValueChange={(v) => updateField("tipo_organizacion", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Club Deportivo">Club Deportivo</SelectItem>
                            <SelectItem value="Corporación">Corporación</SelectItem>
                            <SelectItem value="Fundación">Fundación</SelectItem>
                            <SelectItem value="Asociación">Asociación</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Deporte</Label><Input value={formData.deporte || ""} onChange={(e) => updateField("deporte", e.target.value)} /></div>
                      <div><Label>Representante Legal</Label><Input value={formData.representante_legal || ""} onChange={(e) => updateField("representante_legal", e.target.value)} /></div>
                      <div><Label>N° Registro / Personalidad Jurídica</Label><Input value={formData.numero_registro || ""} onChange={(e) => updateField("numero_registro", e.target.value)} /></div>
                      <div><Label>Fecha de Fundación</Label><Input type="date" value={formData.fecha_fundacion || ""} onChange={(e) => updateField("fecha_fundacion", e.target.value)} /></div>
                      <div className="sm:col-span-2"><Label>Descripción</Label><Textarea value={formData.descripcion || ""} onChange={(e) => updateField("descripcion", e.target.value)} rows={3} placeholder="Breve descripción del club..." /></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[
                        { label: "RUT", value: formData.rut, icon: Shield },
                        { label: "Tipo de Organización", value: formData.tipo_organizacion },
                        { label: "Deporte", value: formData.deporte },
                        { label: "Representante Legal", value: formData.representante_legal, icon: Users },
                        { label: "N° Registro", value: formData.numero_registro },
                        { label: "Fecha de Fundación", value: formData.fecha_fundacion ? format(new Date(formData.fecha_fundacion + "T12:00:00"), "d MMM yyyy", { locale: es }) : null, icon: Calendar },
                      ].map((f) => (
                        <div key={f.label}>
                          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{f.label}</p>
                          <p className="text-foreground font-medium">{f.value || <span className="text-muted-foreground/50 italic">Sin datos</span>}</p>
                        </div>
                      ))}
                      {formData.descripcion && (
                        <div className="sm:col-span-2">
                          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Descripción</p>
                          <p className="text-foreground text-sm">{formData.descripcion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contact & Location + Social */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Contacto y Ubicación</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label>Dirección</Label><Input value={formData.direccion || ""} onChange={(e) => updateField("direccion", e.target.value)} /></div>
                      <div><Label>Ciudad</Label><Input value={formData.ciudad || ""} onChange={(e) => updateField("ciudad", e.target.value)} /></div>
                      <div><Label>Municipalidad</Label><Input value={formData.municipalidad || ""} onChange={(e) => updateField("municipalidad", e.target.value)} /></div>
                      <div><Label>Región</Label>
                        <Select value={formData.region || ""} onValueChange={(v) => updateField("region", v)}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                          <SelectContent>{REGIONES_CHILE.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>Teléfono</Label><Input value={formData.telefono || ""} onChange={(e) => updateField("telefono", e.target.value)} /></div>
                      <div><Label>Email</Label><Input type="email" value={formData.email || ""} onChange={(e) => updateField("email", e.target.value)} /></div>
                      <div className="sm:col-span-2"><Label>Sitio Web</Label><Input value={formData.sitio_web || ""} onChange={(e) => updateField("sitio_web", e.target.value)} placeholder="https://" /></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { icon: MapPin, label: "Dirección", value: [formData.direccion, formData.ciudad, formData.region].filter(Boolean).join(", ") },
                        { icon: Phone, label: "Teléfono", value: formData.telefono },
                        { icon: Mail, label: "Email", value: formData.email },
                        { icon: Globe, label: "Sitio Web", value: formData.sitio_web },
                        { icon: Building2, label: "Municipalidad", value: formData.municipalidad },
                      ].map((f) => (
                        <div key={f.label} className="flex items-center gap-3">
                          <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">{f.label}</p>
                            <p className="text-sm font-medium text-foreground">{f.value || <span className="text-muted-foreground/50 italic">—</span>}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Redes Sociales</CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-3">
                      {[
                        { key: "instagram", label: "Instagram", icon: Instagram },
                        { key: "facebook", label: "Facebook", icon: Facebook },
                        { key: "twitter", label: "X (Twitter)", icon: Twitter },
                        { key: "youtube", label: "YouTube", icon: Youtube },
                        { key: "tiktok", label: "TikTok", icon: Globe },
                      ].map((s) => (
                        <div key={s.key} className="flex items-center gap-2">
                          <s.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <Input value={redes[s.key] || ""} onChange={(e) => updateSocial(s.key, e.target.value)} placeholder={`URL de ${s.label}`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { key: "instagram", label: "Instagram", icon: Instagram },
                        { key: "facebook", label: "Facebook", icon: Facebook },
                        { key: "twitter", label: "X (Twitter)", icon: Twitter },
                        { key: "youtube", label: "YouTube", icon: Youtube },
                        { key: "tiktok", label: "TikTok", icon: Globe },
                      ].map((s) => (
                        redes[s.key] ? (
                          <a key={s.key} href={redes[s.key]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors group">
                            <s.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                            <span className="truncate">{s.label}</span>
                            <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                          </a>
                        ) : null
                      ))}
                      {Object.values(redes).filter(Boolean).length === 0 && (
                        <p className="text-sm text-muted-foreground/50 italic">Sin redes sociales registradas</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ── TAB: DIRECTIVA ── */}
        <TabsContent value="directiva" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {directivaRoles.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Directiva del Club</CardTitle>
                  <CardDescription>Cargos directivos registrados en el módulo de Staff</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {directivaRoles.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {m.personas.nombre[0]}{m.personas.apellido[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{m.personas.nombre} {m.personas.apellido}</p>
                          <p className="text-xs text-muted-foreground">{m.rol}</p>
                          {m.personas.email && <p className="text-xs text-muted-foreground truncate">{m.personas.email}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {cuerpoTecnico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Otros Roles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cuerpoTecnico.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm">
                          {m.personas.nombre[0]}{m.personas.apellido[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{m.personas.nombre} {m.personas.apellido}</p>
                          <p className="text-xs text-muted-foreground">{m.rol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {directiva.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay miembros de staff registrados.</p>
                  <p className="text-sm text-muted-foreground/70">Agrega personas al módulo de Staff para verlas aquí.</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ── TAB: DOCUMENTOS ── */}
        <TabsContent value="documentos" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Documentos Institucionales</CardTitle>
                  <CardDescription>Constitución, inscripciones, certificados y otros documentos legales</CardDescription>
                </div>
                {isAdmin && (
                  <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Subir documento</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Subir documento institucional</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Nombre del documento</Label><Input value={newDoc.nombre} onChange={(e) => setNewDoc({ ...newDoc, nombre: e.target.value })} placeholder="Ej: Certificado de Personalidad Jurídica" /></div>
                        <div><Label>Tipo / Etiqueta</Label>
                          <Select value={newDoc.etiqueta} onValueChange={(v) => setNewDoc({ ...newDoc, etiqueta: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{ETIQUETAS_DOCUMENTO.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div><Label>Descripción (opcional)</Label><Input value={newDoc.descripcion} onChange={(e) => setNewDoc({ ...newDoc, descripcion: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Fecha Emisión</Label><Input type="date" value={newDoc.fecha_emision} onChange={(e) => setNewDoc({ ...newDoc, fecha_emision: e.target.value })} /></div>
                          <div><Label>Fecha Vencimiento</Label><Input type="date" value={newDoc.fecha_vencimiento} onChange={(e) => setNewDoc({ ...newDoc, fecha_vencimiento: e.target.value })} /></div>
                        </div>
                        <div><Label>Archivo</Label><input ref={docFileRef} type="file" className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" /></div>
                        <Button onClick={handleDocUpload} disabled={uploadingDoc} className="w-full gap-2">
                          {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          Subir
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {documentos.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay documentos subidos aún.</p>
                    <p className="text-sm text-muted-foreground/70">Sube constitución, inscripciones y otros documentos legales del club.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(
                      documentos.reduce((acc: Record<string, ClubDocumento[]>, doc) => {
                        const key = doc.etiqueta || "Otro";
                        (acc[key] ||= []).push(doc);
                        return acc;
                      }, {})
                    )
                      .sort(([a], [b]) => {
                        const ia = ETIQUETAS_DOCUMENTO.indexOf(a);
                        const ib = ETIQUETAS_DOCUMENTO.indexOf(b);
                        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                      })
                      .map(([etiqueta, docs]) => (
                        <div key={etiqueta} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</h4>
                            <span className="text-xs text-muted-foreground/60">({docs.length})</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="space-y-2">
                            {docs.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">{doc.nombre}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="secondary" className="text-xs">{doc.etiqueta}</Badge>
                                    {doc.fecha_vencimiento && (
                                      <span className="text-xs text-muted-foreground">
                                        Vence: {format(new Date(doc.fecha_vencimiento + "T12:00:00"), "dd/MM/yyyy")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDocDownload(doc)}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  {isAdmin && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDocDelete(doc)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
