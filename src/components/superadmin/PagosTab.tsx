import { useEffect, useState } from "react";
import { Plus, Upload, Download, Trash2 } from "lucide-react";
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

interface Pago {
  id: string; club_id: string; monto: number; moneda: string; fecha_pago: string;
  periodo_desde: string | null; periodo_hasta: string | null; metodo: string;
  referencia: string | null; comprobante_path: string | null; estado: string; notas: string | null;
  club?: { nombre: string }; plan?: { nombre: string } | null;
}
interface Club { id: string; nombre: string; }
interface Plan { id: string; nombre: string; }

const METODOS = ["transferencia", "efectivo", "tarjeta", "webpay", "otro"];
const ESTADOS = ["confirmado", "pendiente", "anulado"];

const empty = { club_id: "", plan_id: "", monto: "", moneda: "CLP", fecha_pago: format(new Date(), "yyyy-MM-dd"), periodo_desde: "", periodo_hasta: "", metodo: "transferencia", referencia: "", estado: "confirmado", notas: "" };

export default function PagosTab() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [filtroClub, setFiltroClub] = useState("todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    const [{ data: p }, { data: c }, { data: pl }] = await Promise.all([
      supabase.from("pagos_plataforma" as any).select("*, club:club_id(nombre), plan:plan_id(nombre)").order("fecha_pago", { ascending: false }),
      supabase.from("clubs").select("id,nombre").order("nombre"),
      supabase.from("planes_plataforma" as any).select("id,nombre").eq("activo", true).order("orden"),
    ]);
    setPagos((p as any) ?? []);
    setClubs((c as any) ?? []);
    setPlanes((pl as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.club_id || !form.monto) { toast.error("Club y monto son obligatorios"); return; }
    let comprobante_path = null;
    if (file) {
      const path = `${form.club_id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("comprobantes-plataforma").upload(path, file);
      if (upErr) { toast.error("Error subiendo comprobante: " + upErr.message); return; }
      comprobante_path = path;
    }
    const { error } = await supabase.from("pagos_plataforma" as any).insert({
      club_id: form.club_id,
      plan_id: form.plan_id || null,
      monto: Number(form.monto),
      moneda: form.moneda,
      fecha_pago: form.fecha_pago,
      periodo_desde: form.periodo_desde || null,
      periodo_hasta: form.periodo_hasta || null,
      metodo: form.metodo,
      referencia: form.referencia || null,
      estado: form.estado,
      notas: form.notas || null,
      comprobante_path,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pago registrado");
    setOpen(false); setForm(empty); setFile(null); load();
  };

  const downloadComprobante = async (path: string) => {
    const { data, error } = await supabase.storage.from("comprobantes-plataforma").createSignedUrl(path, 60);
    if (error || !data) { toast.error("No se pudo abrir el comprobante"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este pago?")) return;
    const { error } = await supabase.from("pagos_plataforma" as any).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Pago eliminado"); load(); }
  };

  const filtered = filtroClub === "todos" ? pagos : pagos.filter((p) => p.club_id === filtroClub);
  const total = filtered.filter((p) => p.estado === "confirmado").reduce((s, p) => s + p.monto, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <Select value={filtroClub} onValueChange={setFiltroClub}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los clubes</SelectItem>
            {clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { setForm(empty); setFile(null); setOpen(true); }}><Plus className="w-4 h-4 mr-2" />Registrar pago</Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total cobrado (confirmado)</p>
        <p className="text-2xl font-mono font-bold text-success">${total.toLocaleString("es-CL")}</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Fecha</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Club</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Plan</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Periodo</th>
              <th className="text-right p-3 text-xs uppercase text-muted-foreground">Monto</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Método</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Estado</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sin pagos registrados</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{format(new Date(p.fecha_pago), "dd/MM/yy")}</td>
                  <td className="p-3">{p.club?.nombre ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{p.plan?.nombre ?? "—"}</td>
                  <td className="p-3 text-xs">{p.periodo_desde && p.periodo_hasta ? `${format(new Date(p.periodo_desde), "dd/MM/yy")} - ${format(new Date(p.periodo_hasta), "dd/MM/yy")}` : "—"}</td>
                  <td className="p-3 text-right font-mono font-medium">{p.moneda} ${p.monto.toLocaleString("es-CL")}</td>
                  <td className="p-3 capitalize text-xs">{p.metodo}</td>
                  <td className="p-3"><Badge variant={p.estado === "confirmado" ? "default" : p.estado === "pendiente" ? "secondary" : "destructive"} className="capitalize">{p.estado}</Badge></td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {p.comprobante_path && <Button size="sm" variant="ghost" onClick={() => downloadComprobante(p.comprobante_path!)}><Download className="w-3 h-3" /></Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar pago recibido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Club *</Label>
              <Select value={form.club_id} onValueChange={(v) => setForm({ ...form, club_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{clubs.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan</Label>
              <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Monto *</Label><Input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></div>
              <div><Label>Moneda</Label><Input value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} /></div>
              <div><Label>Fecha pago</Label><Input type="date" value={form.fecha_pago} onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Periodo desde</Label><Input type="date" value={form.periodo_desde} onChange={(e) => setForm({ ...form, periodo_desde: e.target.value })} /></div>
              <div><Label>Periodo hasta</Label><Input type="date" value={form.periodo_hasta} onChange={(e) => setForm({ ...form, periodo_hasta: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Método</Label>
                <Select value={form.metodo} onValueChange={(v) => setForm({ ...form, metodo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{METODOS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Referencia</Label><Input value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="N° transferencia / boleta" /></div>
            <div><Label>Notas</Label><Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} /></div>
            <div>
              <Label>Comprobante (opcional)</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept="image/*,application/pdf" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
