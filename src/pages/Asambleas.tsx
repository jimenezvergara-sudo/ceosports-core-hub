import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, Upload, Download, Trash2, Users, FileText, ClipboardList, UserCheck, Pencil, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePersonas, personaLabel } from "@/hooks/use-relational-data"; 

/* ─── types ─── */
interface Asamblea {
  id: string; club_id?: string | null; tipo: string; titulo: string; fecha: string; hora_inicio: string | null;
  hora_fin: string | null; lugar: string | null; descripcion: string | null;
  quorum_requerido: number; quorum_presente: number; estado: string;
  acta_storage_path: string | null; acta_nombre_archivo: string | null; observaciones: string | null;
  tabla_contenido: string | null; tabla_storage_path: string | null; tabla_nombre_archivo: string | null;
}
interface Acuerdo {
  id: string; asamblea_id: string; numero: number; descripcion: string;
  responsable_id: string | null; fecha_limite: string | null; estado: string;
  prioridad: string; observaciones: string | null; notas_avance: string | null;
  persona_nombre?: string; persona_apellido?: string;
}
interface Asistente {
  id: string; asamblea_id: string; persona_id: string; presente: boolean;
  hora_llegada: string | null; representacion: string | null; observaciones: string | null;
  persona_nombre?: string; persona_apellido?: string; persona_rut?: string | null;
}
interface Socio {
  id: string; persona_id: string; numero_socio: number | null; fecha_ingreso: string;
  fecha_retiro: string | null; estado: string; tipo_socio: string; observaciones: string | null;
  persona_nombre?: string; persona_apellido?: string; persona_rut?: string | null;
}

const ACUERDO_ESTADOS = [
  { value: "pendiente", label: "Pendiente", color: "bg-muted text-muted-foreground border-border" },
  { value: "en_proceso", label: "En proceso", color: "bg-blue-600/20 text-blue-500 border-blue-600/30" },
  { value: "atrasada", label: "Atrasada", color: "bg-amber-600/20 text-amber-500 border-amber-600/30" },
  { value: "terminada", label: "Terminada", color: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" },
  { value: "desechada", label: "Desechada", color: "bg-red-600/20 text-red-400 border-red-600/30" },
];

/* ─── helper ─── */
const estadoBadge = (e: string) => {
  const found = ACUERDO_ESTADOS.find((s) => s.value === e);
  return <Badge className={`${found?.color ?? "bg-muted text-muted-foreground border-border"} text-[10px]`}>{found?.label ?? e}</Badge>;
};

export default function Asambleas() {
  const { clubId } = useAuth();
  const { personas } = usePersonas({ includeLegacyWithoutClub: true });
  const [asambleas, setAsambleas] = useState<Asamblea[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Asamblea | null>(null);
  const [acuerdos, setAcuerdos] = useState<Acuerdo[]>([]);
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);

  // Dialogs
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAcuerdo, setOpenAcuerdo] = useState(false);
  const [openSocio, setOpenSocio] = useState(false);
  const [expandedAcuerdo, setExpandedAcuerdo] = useState<string | null>(null);
  const [editingAvance, setEditingAvance] = useState<string | null>(null);
  const [avanceText, setAvanceText] = useState("");

  // Forms
  const [formAsam, setFormAsam] = useState({ titulo: "", tipo: "ordinaria", fecha: "", hora_inicio: "", hora_fin: "", lugar: "", descripcion: "", quorum_requerido: "0", tabla_contenido: "" });
  const [formAcuerdo, setFormAcuerdo] = useState({ descripcion: "", responsable_id: "", fecha_limite: "", prioridad: "media" });
  const [formSocio, setFormSocio] = useState({ persona_id: "", tipo_socio: "activo", fecha_ingreso: new Date().toISOString().slice(0, 10), observaciones: "" });

  /* ─── fetch ─── */
  const fetchAsambleas = async () => {
    if (!clubId) return;
    const { data } = await supabase.from("asambleas").select("*").eq("club_id", clubId).order("fecha", { ascending: false });
    setAsambleas((data as any[]) ?? []);
    setLoading(false);
  };

  const fetchSocios = async () => {
    if (!clubId) return;
    const { data } = await supabase
      .from("libro_socios")
      .select("*, personas!libro_socios_persona_id_fkey(nombre, apellido, rut)")
      .eq("club_id", clubId)
      .order("numero_socio");
    setSocios(((data as any[]) ?? []).map((s: any) => ({
      ...s,
      persona_nombre: s.personas?.nombre,
      persona_apellido: s.personas?.apellido,
      persona_rut: s.personas?.rut,
    })));
  };

  const fetchDetail = async (a: Asamblea) => {
    setSelected(a);
    const [{ data: ac }, { data: as_ }] = await Promise.all([
      supabase.from("asamblea_acuerdos").select("*, personas!asamblea_acuerdos_responsable_id_fkey(nombre, apellido)").eq("asamblea_id", a.id).order("numero"),
      supabase.from("asamblea_asistencia").select("*, personas!asamblea_asistencia_persona_id_fkey(nombre, apellido, rut)").eq("asamblea_id", a.id),
    ]);
    setAcuerdos(((ac as any[]) ?? []).map((x: any) => ({ ...x, persona_nombre: x.personas?.nombre, persona_apellido: x.personas?.apellido })));
    setAsistentes(((as_ as any[]) ?? []).map((x: any) => ({ ...x, persona_nombre: x.personas?.nombre, persona_apellido: x.personas?.apellido, persona_rut: x.personas?.rut })));
  };

  useEffect(() => { fetchAsambleas(); fetchSocios(); }, [clubId]);

  /* ─── actions ─── */
  const saveAsamblea = async () => {
    if (!formAsam.titulo || !formAsam.fecha) { toast.error("Título y fecha son obligatorios"); return; }
    const { error } = await supabase.from("asambleas").insert({
      club_id: clubId, titulo: formAsam.titulo, tipo: formAsam.tipo, fecha: formAsam.fecha,
      hora_inicio: formAsam.hora_inicio || null, hora_fin: formAsam.hora_fin || null,
      lugar: formAsam.lugar || null, descripcion: formAsam.descripcion || null,
      quorum_requerido: parseInt(formAsam.quorum_requerido) || 0,
      tabla_contenido: formAsam.tabla_contenido || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Asamblea registrada");
    setOpenNew(false);
    setFormAsam({ titulo: "", tipo: "ordinaria", fecha: "", hora_inicio: "", hora_fin: "", lugar: "", descripcion: "", quorum_requerido: "0", tabla_contenido: "" });
    fetchAsambleas();
  };

  const openEditDialog = () => {
    if (!selected) return;
    setFormAsam({
      titulo: selected.titulo, tipo: selected.tipo, fecha: selected.fecha,
      hora_inicio: selected.hora_inicio?.slice(0, 5) || "", hora_fin: selected.hora_fin?.slice(0, 5) || "",
      lugar: selected.lugar || "", descripcion: selected.descripcion || "",
      quorum_requerido: String(selected.quorum_requerido || 0),
      tabla_contenido: selected.tabla_contenido || "",
    });
    setOpenEdit(true);
  };

  const updateAsamblea = async () => {
    if (!selected || !formAsam.titulo || !formAsam.fecha) { toast.error("Título y fecha son obligatorios"); return; }
    const payload = {
      titulo: formAsam.titulo, tipo: formAsam.tipo, fecha: formAsam.fecha,
      hora_inicio: formAsam.hora_inicio || null, hora_fin: formAsam.hora_fin || null,
      lugar: formAsam.lugar || null, descripcion: formAsam.descripcion || null,
      quorum_requerido: parseInt(formAsam.quorum_requerido) || 0,
      tabla_contenido: formAsam.tabla_contenido || null,
    };
    const { error } = await supabase.from("asambleas").update(payload as any).eq("id", selected.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Asamblea actualizada");
    setOpenEdit(false);
    const updated = { ...selected, ...payload };
    setSelected(updated);
    fetchAsambleas();
  };

  const uploadTabla = async (file: File) => {
    if (!selected || !clubId) return;
    const path = `${clubId}/tablas/${selected.id}/${file.name}`;
    const { error: upErr } = await supabase.storage.from("club-documentos").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    await supabase.from("asambleas").update({ tabla_storage_path: path, tabla_nombre_archivo: file.name } as any).eq("id", selected.id);
    toast.success("Tabla/agenda cargada");
    setSelected({ ...selected, tabla_storage_path: path, tabla_nombre_archivo: file.name });
    fetchAsambleas();
  };

  const downloadTabla = async () => {
    if (!selected?.tabla_storage_path) return;
    const { data } = await supabase.storage.from("club-documentos").download(selected.tabla_storage_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url; a.download = selected.tabla_nombre_archivo || "tabla.pdf"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const saveAvance = async (acuerdoId: string) => {
    await supabase.from("asamblea_acuerdos").update({ notas_avance: avanceText } as any).eq("id", acuerdoId);
    toast.success("Avance guardado");
    setEditingAvance(null);
    if (selected) fetchDetail(selected);
  };

  const saveAcuerdo = async () => {
    if (!selected || !formAcuerdo.descripcion) { toast.error("Descripción es obligatoria"); return; }
    const nextNum = acuerdos.length + 1;
    const { error } = await supabase.from("asamblea_acuerdos").insert({
      asamblea_id: selected.id, club_id: clubId, numero: nextNum,
      descripcion: formAcuerdo.descripcion, responsable_id: formAcuerdo.responsable_id || null,
      fecha_limite: formAcuerdo.fecha_limite || null, prioridad: formAcuerdo.prioridad,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Acuerdo registrado");
    setOpenAcuerdo(false);
    setFormAcuerdo({ descripcion: "", responsable_id: "", fecha_limite: "", prioridad: "media" });
    fetchDetail(selected);
  };

  const toggleAsistente = async (personaId: string) => {
    if (!selected) return;
    const existing = asistentes.find((a) => a.persona_id === personaId);
    if (existing) {
      await supabase.from("asamblea_asistencia").update({ presente: !existing.presente } as any).eq("id", existing.id);
    } else {
      await supabase.from("asamblea_asistencia").insert({ asamblea_id: selected.id, persona_id: personaId, club_id: clubId, presente: true } as any);
    }
    fetchDetail(selected);
  };

  const updateAcuerdoEstado = async (id: string, estado: string) => {
    await supabase.from("asamblea_acuerdos").update({ estado } as any).eq("id", id);
    if (selected) fetchDetail(selected);
  };

  const uploadActa = async (file: File) => {
    if (!selected || !clubId) return;
    const path = `${clubId}/actas/${selected.id}/${file.name}`;
    const { error: upErr } = await supabase.storage.from("club-documentos").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    await supabase.from("asambleas").update({ acta_storage_path: path, acta_nombre_archivo: file.name } as any).eq("id", selected.id);
    toast.success("Acta cargada");
    fetchAsambleas();
    setSelected({ ...selected, acta_storage_path: path, acta_nombre_archivo: file.name });
  };

  const downloadActa = async () => {
    if (!selected?.acta_storage_path) return;
    const { data } = await supabase.storage.from("club-documentos").download(selected.acta_storage_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url; a.download = selected.acta_nombre_archivo || "acta.pdf"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const saveSocio = async () => {
    if (!formSocio.persona_id) { toast.error("Selecciona una persona"); return; }
    const nextNum = socios.length > 0 ? Math.max(...socios.map((s) => s.numero_socio ?? 0)) + 1 : 1;
    const { error } = await supabase.from("libro_socios").insert({
      club_id: clubId, persona_id: formSocio.persona_id, numero_socio: nextNum,
      fecha_ingreso: formSocio.fecha_ingreso, tipo_socio: formSocio.tipo_socio,
      observaciones: formSocio.observaciones || null,
    } as any);
    if (error) {
      if (error.code === "23505") toast.error("Esta persona ya está registrada como socio");
      else toast.error(error.message);
      return;
    }
    toast.success("Socio registrado");
    setOpenSocio(false);
    setFormSocio({ persona_id: "", tipo_socio: "activo", fecha_ingreso: new Date().toISOString().slice(0, 10), observaciones: "" });
    fetchSocios();
  };

  const deleteSocio = async (id: string) => {
    await supabase.from("libro_socios").delete().eq("id", id);
    toast.success("Socio eliminado");
    fetchSocios();
  };

  const deleteAsamblea = async (id: string) => {
    await supabase.from("asambleas").delete().eq("id", id);
    toast.success("Asamblea eliminada");
    if (selected?.id === id) setSelected(null);
    fetchAsambleas();
  };

  /* ─── render ─── */
  return (
    <PageShell title="Asambleas y Libro de Socios" description="Gestión de reuniones, acuerdos y membresía" icon={BookOpen}>
      <Tabs defaultValue="asambleas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="asambleas" className="gap-1.5 text-xs"><ClipboardList className="w-3.5 h-3.5" /> Asambleas</TabsTrigger>
          <TabsTrigger value="libro" className="gap-1.5 text-xs"><UserCheck className="w-3.5 h-3.5" /> Libro de Socios</TabsTrigger>
        </TabsList>

        {/* ═══ ASAMBLEAS ═══ */}
        <TabsContent value="asambleas" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => setOpenNew(true)}><Plus className="w-4 h-4" /> Nueva Asamblea</Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-12">Cargando...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* list */}
              <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {asambleas.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-4">No hay asambleas registradas</p>
                ) : asambleas.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => fetchDetail(a)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${selected?.id === a.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{a.tipo === "ordinaria" ? "Ordinaria" : "Extraordinaria"}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(a.fecha).toLocaleDateString("es-CL")}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{a.titulo}</p>
                    {a.lugar && <p className="text-[11px] text-muted-foreground mt-0.5">📍 {a.lugar}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={a.estado === "realizada" ? "default" : "secondary"} className="text-[10px]">
                        {a.estado === "realizada" ? "Realizada" : a.estado === "cancelada" ? "Cancelada" : "Programada"}
                      </Badge>
                      {a.acta_storage_path && <FileText className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* detail */}
              <div className="lg:col-span-2">
                {!selected ? (
                  <div className="flex items-center justify-center h-64 bg-card border border-border rounded-lg">
                    <p className="text-muted-foreground text-sm">Selecciona una asamblea para ver los detalles</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg p-5 space-y-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{selected.titulo}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(selected.fecha).toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          {selected.hora_inicio && ` • ${selected.hora_inicio.slice(0, 5)}`}
                          {selected.hora_fin && ` - ${selected.hora_fin.slice(0, 5)}`}
                          {selected.lugar && ` • ${selected.lugar}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Select value={selected.estado} onValueChange={async (v) => {
                          await supabase.from("asambleas").update({ estado: v } as any).eq("id", selected.id);
                          setSelected({ ...selected, estado: v });
                          fetchAsambleas();
                        }}>
                          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="programada">Programada</SelectItem>
                            <SelectItem value="realizada">Realizada</SelectItem>
                            <SelectItem value="cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAsamblea(selected.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {selected.descripcion && <p className="text-sm text-muted-foreground">{selected.descripcion}</p>}

                    {/* Acta */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      {selected.acta_storage_path ? (
                        <>
                          <span className="text-xs text-foreground flex-1 truncate">{selected.acta_nombre_archivo}</span>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={downloadActa}><Download className="w-3 h-3" /> Descargar</Button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-muted-foreground flex-1">Sin acta adjunta</span>
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 pointer-events-none"><Upload className="w-3 h-3" /> Cargar Acta</Button>
                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && uploadActa(e.target.files[0])} />
                          </label>
                        </>
                      )}
                    </div>

                    {/* Quorum */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Quórum requerido</p>
                        <p className="text-xl font-bold text-foreground">{selected.quorum_requerido}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Presentes</p>
                        <p className="text-xl font-bold text-primary">{asistentes.filter((a) => a.presente).length}</p>
                      </div>
                    </div>

                    {/* Asistencia */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Users className="w-4 h-4" /> Asistencia</h4>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {socios.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Registra socios primero en el Libro de Socios</p>
                        ) : socios.map((s) => {
                          const att = asistentes.find((a) => a.persona_id === s.persona_id);
                          return (
                            <div key={s.persona_id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                              <span className="text-xs text-foreground">{s.persona_nombre} {s.persona_apellido}</span>
                              <Switch checked={att?.presente ?? false} onCheckedChange={() => toggleAsistente(s.persona_id)} className="scale-75" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Acuerdos */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><ClipboardList className="w-4 h-4" /> Acuerdos</h4>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setOpenAcuerdo(true)}><Plus className="w-3 h-3" /> Agregar</Button>
                      </div>
                      {acuerdos.length === 0 ? (
                        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">Sin acuerdos registrados</p>
                      ) : (
                        <div className="space-y-2">
                          {acuerdos.map((ac) => (
                            <div key={ac.id} className="border border-border rounded-lg p-3 space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">#{ac.numero}</span>
                                  <p className="text-sm text-foreground">{ac.descripcion}</p>
                                </div>
                                {estadoBadge(ac.estado)}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                {ac.persona_nombre && <span>👤 {ac.persona_nombre} {ac.persona_apellido}</span>}
                                {ac.fecha_limite && <span>📅 {new Date(ac.fecha_limite).toLocaleDateString("es-CL")}</span>}
                                <Badge variant="outline" className="text-[9px]">{ac.prioridad}</Badge>
                              </div>
                              <div className="flex gap-1 mt-1">
                                {["pendiente", "en_progreso", "cumplido", "vencido"].map((e) => (
                                  <button
                                    key={e}
                                    onClick={() => updateAcuerdoEstado(ac.id, e)}
                                    className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${ac.estado === e ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                                  >
                                    {e === "pendiente" ? "Pendiente" : e === "en_progreso" ? "En progreso" : e === "cumplido" ? "Cumplido" : "Vencido"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ LIBRO DE SOCIOS ═══ */}
        <TabsContent value="libro" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Registro oficial de socios del club. Total: <span className="font-semibold text-foreground">{socios.filter((s) => s.estado === "activo").length} activos</span></p>
            </div>
            <Button className="gap-2" onClick={() => setOpenSocio(true)}><Plus className="w-4 h-4" /> Registrar Socio</Button>
          </div>

          {socios.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <UserCheck className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No hay socios registrados</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">N°</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">RUT</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Tipo</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Ingreso</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {socios.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs font-bold text-primary">{s.numero_socio}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{s.persona_apellido}, {s.persona_nombre}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{s.persona_rut || "—"}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-[10px]">{s.tipo_socio}</Badge></td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(s.fecha_ingreso).toLocaleDateString("es-CL")}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={`text-[10px] ${s.estado === "activo" ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" : "bg-red-600/20 text-red-400 border-red-600/30"}`}>
                          {s.estado === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSocio(s.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOG NUEVA ASAMBLEA ═══ */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nueva Asamblea</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Título *</Label>
                <Input value={formAsam.titulo} onChange={(e) => setFormAsam({ ...formAsam, titulo: e.target.value })} placeholder="Asamblea General Ordinaria" />
              </div>
              <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                <Select value={formAsam.tipo} onValueChange={(v) => setFormAsam({ ...formAsam, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaria">Ordinaria</SelectItem>
                    <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">Fecha *</Label>
                <Input type="date" value={formAsam.fecha} onChange={(e) => setFormAsam({ ...formAsam, fecha: e.target.value })} />
              </div>
              <div className="space-y-1"><Label className="text-xs">Hora inicio</Label>
                <Input type="time" value={formAsam.hora_inicio} onChange={(e) => setFormAsam({ ...formAsam, hora_inicio: e.target.value })} />
              </div>
              <div className="space-y-1"><Label className="text-xs">Hora fin</Label>
                <Input type="time" value={formAsam.hora_fin} onChange={(e) => setFormAsam({ ...formAsam, hora_fin: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Lugar</Label>
                <Input value={formAsam.lugar} onChange={(e) => setFormAsam({ ...formAsam, lugar: e.target.value })} placeholder="Sede del club" />
              </div>
              <div className="space-y-1"><Label className="text-xs">Quórum requerido</Label>
                <Input type="number" value={formAsam.quorum_requerido} onChange={(e) => setFormAsam({ ...formAsam, quorum_requerido: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Descripción</Label>
              <Textarea value={formAsam.descripcion} onChange={(e) => setFormAsam({ ...formAsam, descripcion: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={saveAsamblea}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG NUEVO ACUERDO ═══ */}
      <Dialog open={openAcuerdo} onOpenChange={setOpenAcuerdo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Acuerdo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Descripción *</Label>
              <Textarea value={formAcuerdo.descripcion} onChange={(e) => setFormAcuerdo({ ...formAcuerdo, descripcion: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1"><Label className="text-xs">Responsable</Label>
              <Select value={formAcuerdo.responsable_id} onValueChange={(v) => setFormAcuerdo({ ...formAcuerdo, responsable_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {personas.map((p) => <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Fecha límite</Label>
                <Input type="date" value={formAcuerdo.fecha_limite} onChange={(e) => setFormAcuerdo({ ...formAcuerdo, fecha_limite: e.target.value })} />
              </div>
              <div className="space-y-1"><Label className="text-xs">Prioridad</Label>
                <Select value={formAcuerdo.prioridad} onValueChange={(v) => setFormAcuerdo({ ...formAcuerdo, prioridad: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAcuerdo(false)}>Cancelar</Button>
            <Button onClick={saveAcuerdo}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG NUEVO SOCIO ═══ */}
      <Dialog open={openSocio} onOpenChange={setOpenSocio}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Registrar Socio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Persona *</Label>
              <Select value={formSocio.persona_id} onValueChange={(v) => setFormSocio({ ...formSocio, persona_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                <SelectContent>
                  {personas.map((p) => <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Tipo de Socio</Label>
                <Select value={formSocio.tipo_socio} onValueChange={(v) => setFormSocio({ ...formSocio, tipo_socio: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="honorario">Honorario</SelectItem>
                    <SelectItem value="fundador">Fundador</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Fecha ingreso</Label>
                <Input type="date" value={formSocio.fecha_ingreso} onChange={(e) => setFormSocio({ ...formSocio, fecha_ingreso: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Observaciones</Label>
              <Textarea value={formSocio.observaciones} onChange={(e) => setFormSocio({ ...formSocio, observaciones: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSocio(false)}>Cancelar</Button>
            <Button onClick={saveSocio}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
