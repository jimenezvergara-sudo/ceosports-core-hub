import { useEffect, useState } from "react";
import { differenceInDays, format } from "date-fns";
import { AlertTriangle, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Sub {
  id: string; club_id: string; estado: string; fecha_vencimiento: string | null;
  responsable_pago: string | null; email_contacto: string | null;
  club?: { nombre: string; telefono: string | null; email: string | null };
}
interface Gestion {
  id: string; club_id: string; fecha_gestion: string; tipo_gestion: string; resultado: string | null; nota: string | null; created_at: string;
}

const TIPOS = ["llamada", "email", "whatsapp", "presencial", "otro"];

export default function CobranzaTab() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [open, setOpen] = useState<Sub | null>(null);
  const [form, setForm] = useState<any>({ tipo_gestion: "llamada", resultado: "", nota: "", fecha_gestion: format(new Date(), "yyyy-MM-dd") });

  const load = async () => {
    const [{ data: s }, { data: g }] = await Promise.all([
      supabase.from("suscripciones_club" as any).select("*, club:club_id(nombre, telefono, email)"),
      supabase.from("gestiones_cobranza" as any).select("*").order("created_at", { ascending: false }),
    ]);
    setSubs((s as any) ?? []);
    setGestiones((g as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const today = new Date();
  const enRiesgo = subs
    .filter((s) => {
      if (!s.fecha_vencimiento) return false;
      const dias = differenceInDays(new Date(s.fecha_vencimiento), today);
      return s.estado === "vencido" || dias <= 7;
    })
    .map((s) => ({ ...s, dias: s.fecha_vencimiento ? differenceInDays(new Date(s.fecha_vencimiento), today) : 0 }))
    .sort((a, b) => a.dias - b.dias);

  const ultimaGestion = (clubId: string) => gestiones.find((g) => g.club_id === clubId);

  const guardar = async () => {
    if (!open) return;
    const { error } = await supabase.from("gestiones_cobranza" as any).insert({
      club_id: open.club_id,
      suscripcion_id: open.id,
      fecha_gestion: form.fecha_gestion,
      tipo_gestion: form.tipo_gestion,
      resultado: form.resultado || null,
      nota: form.nota || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Gestión registrada");
    setOpen(null); setForm({ tipo_gestion: "llamada", resultado: "", nota: "", fecha_gestion: format(new Date(), "yyyy-MM-dd") });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <p className="text-sm">{enRiesgo.length} clubes con pagos vencidos o por vencer en 7 días.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Club</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Vence</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Estado</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Responsable</th>
              <th className="text-left p-3 text-xs uppercase text-muted-foreground">Última gestión</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {enRiesgo.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin clubes en riesgo</td></tr>
              ) : enRiesgo.map((s) => {
                const ult = ultimaGestion(s.club_id);
                return (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.club?.nombre ?? "—"}</td>
                    <td className="p-3 font-mono text-xs">
                      {s.fecha_vencimiento ? format(new Date(s.fecha_vencimiento), "dd/MM/yy") : "—"}
                      <div className={s.dias < 0 ? "text-destructive" : "text-warning"}>
                        {s.dias < 0 ? `${Math.abs(s.dias)} días vencido` : `${s.dias} días restantes`}
                      </div>
                    </td>
                    <td className="p-3"><Badge variant={s.estado === "vencido" ? "destructive" : "secondary"} className="capitalize">{s.estado}</Badge></td>
                    <td className="p-3 text-xs">
                      <div>{s.responsable_pago ?? "—"}</div>
                      <div className="text-muted-foreground">{s.email_contacto ?? s.club?.email ?? s.club?.telefono ?? ""}</div>
                    </td>
                    <td className="p-3 text-xs">
                      {ult ? (
                        <>
                          <div>{format(new Date(ult.fecha_gestion), "dd/MM/yy")} · {ult.tipo_gestion}</div>
                          {ult.nota && <div className="text-muted-foreground line-clamp-1">{ult.nota}</div>}
                        </>
                      ) : <span className="text-muted-foreground">Sin contacto</span>}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" onClick={() => setOpen(s)}><Phone className="w-3 h-3 mr-1" />Marcar contacto</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />Registrar gestión — {open?.club?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha</Label><Input type="date" value={form.fecha_gestion} onChange={(e) => setForm({ ...form, fecha_gestion: e.target.value })} /></div>
              <div><Label>Tipo</Label>
                <Select value={form.tipo_gestion} onValueChange={(v) => setForm({ ...form, tipo_gestion: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Resultado</Label><Input value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} placeholder="Ej: prometió pagar el viernes" /></div>
            <div><Label>Nota</Label><Textarea value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Cancelar</Button>
            <Button onClick={guardar}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
