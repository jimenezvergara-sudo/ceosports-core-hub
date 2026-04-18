import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, LayoutGrid, List, Trophy } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ESTADOS_LEAD = ["Prospecto", "Contactado", "Demo agendada", "Propuesta enviada", "Negociación", "Ganado", "Perdido"];

const ESTADO_COLOR: Record<string, string> = {
  "Prospecto": "bg-muted text-muted-foreground",
  "Contactado": "bg-primary/10 text-primary",
  "Demo agendada": "bg-accent/30 text-accent-foreground",
  "Propuesta enviada": "bg-warning/10 text-warning-foreground",
  "Negociación": "bg-warning/20 text-warning-foreground",
  "Ganado": "bg-success/10 text-success",
  "Perdido": "bg-destructive/10 text-destructive",
};

interface Lead {
  id: string;
  nombre_entidad: string; deporte: string | null; ciudad: string | null;
  contacto_nombre: string | null; contacto_email: string | null; contacto_telefono: string | null;
  estado: string; fecha_ultimo_contacto: string | null; notas: string | null;
  plan_interes_id: string | null; club_convertido_id: string | null;
  plan?: { nombre: string } | null;
}
interface Plan { id: string; nombre: string; }

const empty = { nombre_entidad: "", deporte: "", ciudad: "", contacto_nombre: "", contacto_email: "", contacto_telefono: "", estado: "Prospecto", fecha_ultimo_contacto: "", notas: "", plan_interes_id: "" };

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [vista, setVista] = useState<"tabla" | "kanban">("tabla");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [convertOpen, setConvertOpen] = useState<Lead | null>(null);

  const load = async () => {
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from("leads_comerciales" as any).select("*, plan:plan_interes_id(nombre)").order("created_at", { ascending: false }),
      supabase.from("planes_plataforma" as any).select("id,nombre").eq("activo", true).order("orden"),
    ]);
    setLeads((l as any) ?? []);
    setPlanes((p as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (l: Lead) => {
    setEditing(l);
    setForm({
      nombre_entidad: l.nombre_entidad, deporte: l.deporte ?? "", ciudad: l.ciudad ?? "",
      contacto_nombre: l.contacto_nombre ?? "", contacto_email: l.contacto_email ?? "", contacto_telefono: l.contacto_telefono ?? "",
      estado: l.estado, fecha_ultimo_contacto: l.fecha_ultimo_contacto ?? "", notas: l.notas ?? "",
      plan_interes_id: l.plan_interes_id ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nombre_entidad.trim()) { toast.error("Nombre de entidad requerido"); return; }
    const payload = {
      nombre_entidad: form.nombre_entidad.trim(),
      deporte: form.deporte || null,
      ciudad: form.ciudad || null,
      contacto_nombre: form.contacto_nombre || null,
      contacto_email: form.contacto_email || null,
      contacto_telefono: form.contacto_telefono || null,
      estado: form.estado,
      fecha_ultimo_contacto: form.fecha_ultimo_contacto || null,
      notas: form.notas || null,
      plan_interes_id: form.plan_interes_id || null,
    };
    const { error } = editing
      ? await supabase.from("leads_comerciales" as any).update(payload).eq("id", editing.id)
      : await supabase.from("leads_comerciales" as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Lead actualizado" : "Lead creado");
    setOpen(false); load();
  };

  const cambiarEstado = async (lead: Lead, nuevoEstado: string) => {
    if (nuevoEstado === "Ganado" && !lead.club_convertido_id) {
      setConvertOpen(lead);
      return;
    }
    const { error } = await supabase.from("leads_comerciales" as any).update({ estado: nuevoEstado }).eq("id", lead.id);
    if (error) toast.error(error.message); else { toast.success("Estado actualizado"); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este lead?")) return;
    const { error } = await supabase.from("leads_comerciales" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Lead eliminado"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-1 border border-border rounded-md p-1">
          <Button size="sm" variant={vista === "tabla" ? "default" : "ghost"} onClick={() => setVista("tabla")}><List className="w-4 h-4 mr-1" />Tabla</Button>
          <Button size="sm" variant={vista === "kanban" ? "default" : "ghost"} onClick={() => setVista("kanban")}><LayoutGrid className="w-4 h-4 mr-1" />Kanban</Button>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nuevo lead</Button>
      </div>

      {vista === "tabla" ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Entidad</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Contacto</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Plan interés</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Estado</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Último contacto</th>
                <th className="p-3"></th>
              </tr></thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin leads</td></tr>
                ) : leads.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{l.nombre_entidad}</div>
                      <div className="text-xs text-muted-foreground">{[l.deporte, l.ciudad].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td className="p-3 text-xs">
                      {l.contacto_nombre && <div>{l.contacto_nombre}</div>}
                      <div className="text-muted-foreground">{l.contacto_email ?? l.contacto_telefono ?? "—"}</div>
                    </td>
                    <td className="p-3 text-xs">{l.plan?.nombre ?? "—"}</td>
                    <td className="p-3">
                      <Select value={l.estado} onValueChange={(v) => cambiarEstado(l, v)}>
                        <SelectTrigger className="h-7 w-auto border-0 p-1"><Badge className={`capitalize ${ESTADO_COLOR[l.estado]}`}>{l.estado}</Badge></SelectTrigger>
                        <SelectContent>{ESTADOS_LEAD.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 font-mono text-xs">{l.fecha_ultimo_contacto ? format(new Date(l.fecha_ultimo_contacto), "dd/MM/yy") : "—"}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 overflow-x-auto">
          {ESTADOS_LEAD.map((estado) => {
            const items = leads.filter((l) => l.estado === estado);
            return (
              <div key={estado} className="bg-muted/30 rounded-lg p-2 min-w-[180px]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h4 className="text-xs font-semibold uppercase">{estado}</h4>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((l) => (
                    <div key={l.id} className="bg-card border border-border rounded p-2 cursor-pointer hover:border-primary" onClick={() => openEdit(l)}>
                      <div className="font-medium text-sm">{l.nombre_entidad}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.contacto_nombre ?? l.contacto_email ?? "—"}</div>
                      {l.plan?.nombre && <Badge variant="outline" className="mt-1 text-[10px]">{l.plan.nombre}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar lead" : "Nuevo lead"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre de la entidad *</Label><Input value={form.nombre_entidad} onChange={(e) => setForm({ ...form, nombre_entidad: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Deporte</Label><Input value={form.deporte} onChange={(e) => setForm({ ...form, deporte: e.target.value })} /></div>
              <div><Label>Ciudad</Label><Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></div>
            </div>
            <div><Label>Contacto</Label><Input value={form.contacto_nombre} onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={form.contacto_email} onChange={(e) => setForm({ ...form, contacto_email: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.contacto_telefono} onChange={(e) => setForm({ ...form, contacto_telefono: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS_LEAD.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Plan de interés</Label>
                <Select value={form.plan_interes_id} onValueChange={(v) => setForm({ ...form, plan_interes_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Fecha último contacto</Label><Input type="date" value={form.fecha_ultimo_contacto} onChange={(e) => setForm({ ...form, fecha_ultimo_contacto: e.target.value })} /></div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConvertirLeadDialog lead={convertOpen} onClose={() => setConvertOpen(null)} onConverted={load} planes={planes} />
    </div>
  );
}

// --- Convertir lead a contrato ---
function ConvertirLeadDialog({ lead, onClose, onConverted, planes }: { lead: Lead | null; onClose: () => void; onConverted: () => void; planes: Plan[] }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (lead) {
      setForm({
        plan_id: lead.plan_interes_id ?? "",
        ciclo_facturacion: "mensual",
        fecha_inicio: format(new Date(), "yyyy-MM-dd"),
        fecha_vencimiento: "",
        responsable_pago: lead.contacto_nombre ?? "",
        rut_facturacion: "",
        email_contacto: lead.contacto_email ?? "",
      });
    }
  }, [lead]);

  const convert = async () => {
    if (!lead) return;
    if (!form.plan_id) { toast.error("Selecciona un plan"); return; }
    // 1. Create club
    const { data: clubData, error: e1 } = await supabase.from("clubs").insert({
      nombre: lead.nombre_entidad,
      ciudad: lead.ciudad,
      deporte: lead.deporte || "Otro",
      email: lead.contacto_email,
      telefono: lead.contacto_telefono,
      contacto_cobranza_nombre: form.responsable_pago,
      contacto_cobranza_email: form.email_contacto,
    }).select("id").single();
    if (e1 || !clubData) { toast.error(e1?.message ?? "Error creando club"); return; }

    // 2. Create subscription
    const { error: e2 } = await supabase.from("suscripciones_club" as any).insert({
      club_id: clubData.id,
      plan_id: form.plan_id,
      ciclo_facturacion: form.ciclo_facturacion,
      fecha_inicio: form.fecha_inicio,
      fecha_vencimiento: form.fecha_vencimiento || null,
      estado: "activo",
      responsable_pago: form.responsable_pago || null,
      rut_facturacion: form.rut_facturacion || null,
      email_contacto: form.email_contacto || null,
    });
    if (e2) { toast.error(e2.message); return; }

    // 3. Update lead
    await supabase.from("leads_comerciales" as any).update({ estado: "Ganado", club_convertido_id: clubData.id }).eq("id", lead.id);
    toast.success("Lead convertido en contrato");
    onClose(); onConverted();
  };

  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-success" />Convertir en contrato</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Se creará un nuevo club y suscripción para <strong>{lead?.nombre_entidad}</strong>.</p>
          <div><Label>Plan *</Label>
            <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>{planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ciclo</Label>
              <Select value={form.ciclo_facturacion} onValueChange={(v) => setForm({ ...form, ciclo_facturacion: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fecha inicio</Label><Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
          </div>
          <div><Label>Vencimiento</Label><Input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
          <div><Label>Responsable de pago</Label><Input value={form.responsable_pago} onChange={(e) => setForm({ ...form, responsable_pago: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>RUT facturación</Label><Input value={form.rut_facturacion} onChange={(e) => setForm({ ...form, rut_facturacion: e.target.value })} /></div>
            <div><Label>Email contacto</Label><Input type="email" value={form.email_contacto} onChange={(e) => setForm({ ...form, email_contacto: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={convert}>Convertir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
