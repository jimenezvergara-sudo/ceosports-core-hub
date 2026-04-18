import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Contrato {
  id: string; club_id: string; plan_id: string | null;
  fecha_inicio: string; fecha_vencimiento: string | null;
  estado: string; ciclo_facturacion: string;
  responsable_pago: string | null; rut_facturacion: string | null; email_contacto: string | null;
  trial_hasta: string | null;
  club?: { nombre: string }; plan?: { nombre: string } | null;
}
interface Plan { id: string; nombre: string; }

const ESTADOS = ["activo", "trial", "vencido", "suspendido", "cancelado"];
const ESTADO_COLOR: Record<string, string> = {
  activo: "bg-success/10 text-success",
  trial: "bg-warning/10 text-warning-foreground",
  vencido: "bg-destructive/10 text-destructive",
  suspendido: "bg-destructive/10 text-destructive",
  cancelado: "bg-muted text-muted-foreground",
};

export default function ContratosTab() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Contrato | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("suscripciones_club" as any).select("*, club:club_id(nombre), plan:plan_id(nombre)").order("fecha_inicio", { ascending: false }),
      supabase.from("planes_plataforma" as any).select("id,nombre").eq("activo", true).order("orden"),
    ]);
    setContratos((c as any) ?? []);
    setPlanes((p as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const openEdit = (c: Contrato) => {
    setEditing(c);
    setForm({
      plan_id: c.plan_id ?? "", ciclo_facturacion: c.ciclo_facturacion,
      fecha_inicio: c.fecha_inicio, fecha_vencimiento: c.fecha_vencimiento ?? "",
      trial_hasta: c.trial_hasta ?? "", estado: c.estado,
      responsable_pago: c.responsable_pago ?? "",
      rut_facturacion: c.rut_facturacion ?? "",
      email_contacto: c.email_contacto ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.from("suscripciones_club" as any).update({
      plan_id: form.plan_id || null,
      ciclo_facturacion: form.ciclo_facturacion,
      fecha_inicio: form.fecha_inicio,
      fecha_vencimiento: form.fecha_vencimiento || null,
      trial_hasta: form.trial_hasta || null,
      estado: form.estado,
      responsable_pago: form.responsable_pago || null,
      rut_facturacion: form.rut_facturacion || null,
      email_contacto: form.email_contacto || null,
    }).eq("id", editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Contrato actualizado");
    setEditing(null); load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Club</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Plan</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Inicio</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Vence</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Estado</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Responsable pago</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">RUT / Email</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {contratos.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sin contratos</td></tr>
              ) : contratos.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.club?.nombre ?? "—"}</td>
                  <td className="p-3">{c.plan?.nombre ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{format(new Date(c.fecha_inicio), "dd/MM/yy")}</td>
                  <td className="p-3 font-mono text-xs">{c.fecha_vencimiento ? format(new Date(c.fecha_vencimiento), "dd/MM/yy") : "—"}</td>
                  <td className="p-3"><Badge className={`capitalize ${ESTADO_COLOR[c.estado] ?? "bg-muted"}`}>{c.estado}</Badge></td>
                  <td className="p-3 text-xs">{c.responsable_pago ?? "—"}</td>
                  <td className="p-3 text-xs">
                    <div>{c.rut_facturacion ?? "—"}</div>
                    <div className="text-muted-foreground">{c.email_contacto ?? "—"}</div>
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-3 h-3" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar contrato — {editing?.club?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Plan</Label>
                <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ciclo</Label>
                <Select value={form.ciclo_facturacion} onValueChange={(v) => setForm({ ...form, ciclo_facturacion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Trial hasta</Label><Input type="date" value={form.trial_hasta} onChange={(e) => setForm({ ...form, trial_hasta: e.target.value })} /></div>
              <div><Label>Inicio</Label><Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
              <div><Label>Vencimiento</Label><Input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
            </div>
            <div><Label>Responsable de pago</Label><Input value={form.responsable_pago} onChange={(e) => setForm({ ...form, responsable_pago: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>RUT facturación</Label><Input value={form.rut_facturacion} onChange={(e) => setForm({ ...form, rut_facturacion: e.target.value })} /></div>
              <div><Label>Email contacto</Label><Input type="email" value={form.email_contacto} onChange={(e) => setForm({ ...form, email_contacto: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
