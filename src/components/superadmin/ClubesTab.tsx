import { useEffect, useState } from "react";
import { Search, Building2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClubRow {
  id: string; nombre: string; ciudad: string | null; deporte: string;
  email: string | null; telefono: string | null;
  contacto_cobranza_nombre: string | null;
  contacto_cobranza_email: string | null;
  contacto_cobranza_telefono: string | null;
  created_at: string;
  suscripcion?: { id: string; estado: string; ciclo_facturacion: string; fecha_vencimiento: string | null; plan_id: string | null; trial_hasta: string | null; notas: string | null; plan?: { nombre: string } };
}
interface Plan { id: string; nombre: string; }

const ESTADOS = ["trial", "activo", "suspendido", "cancelado", "vencido"];
const ESTADO_COLOR: Record<string, string> = {
  trial: "bg-warning/10 text-warning-foreground",
  activo: "bg-success/10 text-success",
  suspendido: "bg-destructive/10 text-destructive",
  cancelado: "bg-muted text-muted-foreground",
  vencido: "bg-destructive/10 text-destructive",
};

export default function ClubesTab() {
  const [clubes, setClubes] = useState<ClubRow[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [editing, setEditing] = useState<ClubRow | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    const [{ data: clubsData }, { data: subs }, { data: plansData }] = await Promise.all([
      supabase.from("clubs").select("*").order("created_at", { ascending: false }),
      supabase.from("suscripciones_club" as any).select("*, plan:plan_id(nombre)"),
      supabase.from("planes_plataforma" as any).select("id,nombre").eq("activo", true).order("orden"),
    ]);
    const subsByClub: Record<string, any> = {};
    (subs as any[] ?? []).forEach((s) => { subsByClub[s.club_id] = s; });
    setClubes((clubsData as any[] ?? []).map((c) => ({ ...c, suscripcion: subsByClub[c.id] })));
    setPlanes((plansData as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const open = (c: ClubRow) => {
    setEditing(c);
    setForm({
      contacto_cobranza_nombre: c.contacto_cobranza_nombre ?? "",
      contacto_cobranza_email: c.contacto_cobranza_email ?? "",
      contacto_cobranza_telefono: c.contacto_cobranza_telefono ?? "",
      plan_id: c.suscripcion?.plan_id ?? "",
      estado: c.suscripcion?.estado ?? "trial",
      ciclo_facturacion: c.suscripcion?.ciclo_facturacion ?? "mensual",
      fecha_vencimiento: c.suscripcion?.fecha_vencimiento ?? "",
      trial_hasta: c.suscripcion?.trial_hasta ?? "",
      notas: c.suscripcion?.notas ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    // Update club contact
    const { error: e1 } = await supabase.from("clubs").update({
      contacto_cobranza_nombre: form.contacto_cobranza_nombre || null,
      contacto_cobranza_email: form.contacto_cobranza_email || null,
      contacto_cobranza_telefono: form.contacto_cobranza_telefono || null,
    }).eq("id", editing.id);
    if (e1) { toast.error(e1.message); return; }

    // Upsert subscription
    const subPayload = {
      club_id: editing.id,
      plan_id: form.plan_id || null,
      estado: form.estado,
      ciclo_facturacion: form.ciclo_facturacion,
      fecha_vencimiento: form.fecha_vencimiento || null,
      trial_hasta: form.trial_hasta || null,
      notas: form.notas || null,
    };
    const { error: e2 } = editing.suscripcion
      ? await supabase.from("suscripciones_club" as any).update(subPayload).eq("id", editing.suscripcion.id)
      : await supabase.from("suscripciones_club" as any).insert(subPayload);
    if (e2) { toast.error(e2.message); return; }

    toast.success("Club actualizado");
    setEditing(null); load();
  };

  const filtered = clubes.filter((c) => {
    if (filtroEstado !== "todos" && (c.suscripcion?.estado ?? "trial") !== filtroEstado) return false;
    if (busqueda && !`${c.nombre} ${c.ciudad ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar club..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Club</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Plan</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Estado</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Vence</th>
                <th className="text-left p-3 text-xs uppercase text-muted-foreground">Contacto cobranza</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
              ) : filtered.map((c) => {
                const estado = c.suscripcion?.estado ?? "sin suscripción";
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{c.nombre}</div>
                      <div className="text-xs text-muted-foreground">{c.ciudad ?? "—"} · {c.deporte}</div>
                    </td>
                    <td className="p-3">{c.suscripcion?.plan?.nombre ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-3"><Badge className={`capitalize ${ESTADO_COLOR[estado] ?? "bg-muted"}`}>{estado}</Badge></td>
                    <td className="p-3 font-mono text-xs">{c.suscripcion?.fecha_vencimiento ? format(new Date(c.suscripcion.fecha_vencimiento), "dd/MM/yyyy") : "—"}</td>
                    <td className="p-3 text-xs">
                      {c.contacto_cobranza_nombre ? (
                        <>
                          <div>{c.contacto_cobranza_nombre}</div>
                          <div className="text-muted-foreground">{c.contacto_cobranza_email ?? c.contacto_cobranza_telefono ?? ""}</div>
                        </>
                      ) : <span className="text-muted-foreground">Sin contacto</span>}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => open(c)}><Pencil className="w-3 h-3" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />{editing?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Suscripción</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Plan</Label>
                  <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sin plan" /></SelectTrigger>
                    <SelectContent>
                      {planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ciclo</Label>
                  <Select value={form.ciclo_facturacion} onValueChange={(v) => setForm({ ...form, ciclo_facturacion: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha vencimiento</Label><Input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
                <div className="col-span-2"><Label>Trial hasta</Label><Input type="date" value={form.trial_hasta} onChange={(e) => setForm({ ...form, trial_hasta: e.target.value })} /></div>
                <div className="col-span-2"><Label>Notas</Label><Input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Contacto de cobranza</h4>
              <div className="space-y-3">
                <div><Label>Nombre</Label><Input value={form.contacto_cobranza_nombre} onChange={(e) => setForm({ ...form, contacto_cobranza_nombre: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.contacto_cobranza_email} onChange={(e) => setForm({ ...form, contacto_cobranza_email: e.target.value })} /></div>
                  <div><Label>Teléfono</Label><Input value={form.contacto_cobranza_telefono} onChange={(e) => setForm({ ...form, contacto_cobranza_telefono: e.target.value })} /></div>
                </div>
              </div>
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
