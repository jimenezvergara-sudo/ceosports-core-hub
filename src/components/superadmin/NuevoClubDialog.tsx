import { useEffect, useState } from "react";
import { Copy, CheckCircle2, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan { id: string; nombre: string; }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}

const empty = { nombre: "", email: "", full_name: "", plan_id: "", fecha_vencimiento: "", deporte: "Básquetbol", ciudad: "" };

export default function NuevoClubDialog({ open, onOpenChange, onCreated }: Props) {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; temp_password: string | null; user_created: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(empty); setResult(null);
    supabase.from("planes_plataforma" as any).select("id,nombre").eq("activo", true).order("orden")
      .then(({ data }) => setPlanes((data as any) ?? []));
  }, [open]);

  const submit = async () => {
    if (!form.nombre.trim() || !form.email.trim()) {
      toast.error("Nombre y email son obligatorios"); return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-create-club", { body: form });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Error al crear club"); return;
    }
    toast.success("Club creado correctamente");
    setResult({ email: data.email, temp_password: data.temp_password, user_created: data.user_created });
    onCreated();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {!result ? (
          <>
            <DialogHeader><DialogTitle>Nuevo Club</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nombre del club *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Deporte</Label><Input value={form.deporte} onChange={(e) => setForm({ ...form, deporte: e.target.value })} /></div>
                <div><Label>Ciudad</Label><Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} /></div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">Administrador del club</p>
                <div className="space-y-3">
                  <div><Label>Nombre completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                  <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <Label>Plan</Label>
                  <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Sin plan (trial)" /></SelectTrigger>
                    <SelectContent>
                      {planes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Vencimiento</Label><Input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
              <Button onClick={submit} disabled={loading}>{loading ? "Creando..." : "Crear club"}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" />Club creado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {result.user_created && result.temp_password ? (
                <>
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm">
                    <p className="font-semibold flex items-center gap-2 mb-1"><KeyRound className="w-4 h-4" />Contraseña temporal</p>
                    <p className="text-muted-foreground text-xs">Copia y envía estas credenciales al cliente. No volverán a mostrarse.</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Email</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={result.email} className="font-mono text-sm" />
                        <Button size="icon" variant="outline" onClick={() => copy(result.email)}><Copy className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Contraseña temporal</Label>
                      <div className="flex gap-2">
                        <Input readOnly value={result.temp_password} className="font-mono text-sm" />
                        <Button size="icon" variant="outline" onClick={() => copy(result.temp_password!)}><Copy className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => copy(`Email: ${result.email}\nContraseña: ${result.temp_password}`)}>
                      <Copy className="w-4 h-4 mr-2" />Copiar ambos
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">El usuario <span className="font-mono">{result.email}</span> ya existía y fue asociado como administrador del nuevo club.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
