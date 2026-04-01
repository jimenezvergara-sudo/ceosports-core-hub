import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePersonas, useCategorias, personaLabel } from "@/hooks/use-relational-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Beneficio {
  id: string;
  persona_id: string;
  categoria_id: string | null;
  tipo_beneficio: string;
  valor: number;
  valor_tipo: string;
  motivo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

const TIPO_LABEL: Record<string, string> = {
  beca: "Beca",
  descuento: "Descuento",
  exencion: "Exención",
};

const TIPO_COLOR: Record<string, string> = {
  beca: "bg-success/15 text-success",
  descuento: "bg-accent text-accent-foreground",
  exencion: "bg-primary/15 text-primary",
};

export default function CuotasBeneficios() {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);
  const { personas } = usePersonas();
  const { categorias } = useCategorias();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    persona_id: "",
    categoria_id: "",
    tipo_beneficio: "descuento",
    valor: 0,
    valor_tipo: "porcentaje",
    motivo: "",
    fecha_inicio: "",
    fecha_fin: "",
    activo: true,
  });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("beneficios_cuota").select("*").order("created_at", { ascending: false });
    setBeneficios((data as unknown as Beneficio[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const personasMap: Record<string, string> = {};
  personas.forEach((p) => { personasMap[p.id] = personaLabel(p); });
  const catMap: Record<string, string> = {};
  categorias.forEach((c) => { catMap[c.id] = c.nombre; });

  const save = async () => {
    if (!form.persona_id || !form.valor) {
      toast.error("Jugador y valor son obligatorios");
      return;
    }
    await supabase.from("beneficios_cuota").insert({
      persona_id: form.persona_id,
      categoria_id: form.categoria_id || null,
      tipo_beneficio: form.tipo_beneficio,
      valor: form.valor,
      valor_tipo: form.valor_tipo,
      motivo: form.motivo || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      activo: form.activo,
    } as any);
    toast.success("Beneficio creado");
    setOpen(false);
    setForm({ persona_id: "", categoria_id: "", tipo_beneficio: "descuento", valor: 0, valor_tipo: "porcentaje", motivo: "", fecha_inicio: "", fecha_fin: "", activo: true });
    fetchData();
  };

  const remove = async (id: string) => {
    await supabase.from("beneficios_cuota").delete().eq("id", id);
    toast.success("Beneficio eliminado");
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Becas, Descuentos y Exenciones</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" />Nuevo</Button>
      </div>

      {/* Desktop table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Jugador</th>
              <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Tipo</th>
              <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Valor</th>
              <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Motivo</th>
              <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">Estado</th>
              <th className="text-center p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
            ) : beneficios.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay beneficios.</td></tr>
            ) : beneficios.map((b) => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{personasMap[b.persona_id] ?? "—"}</td>
                <td className="p-3"><Badge className={`text-xs ${TIPO_COLOR[b.tipo_beneficio] ?? ""}`}>{TIPO_LABEL[b.tipo_beneficio] ?? b.tipo_beneficio}</Badge></td>
                <td className="p-3 text-right font-mono text-foreground">{b.valor_tipo === "porcentaje" ? `${b.valor}%` : `$${b.valor.toLocaleString("es-CL")}`}</td>
                <td className="p-3 text-muted-foreground truncate max-w-[200px]">{b.motivo ?? "—"}</td>
                <td className="p-3 text-center"><Badge variant={b.activo ? "default" : "secondary"} className="text-xs">{b.activo ? "Activo" : "Inactivo"}</Badge></td>
                <td className="p-3 text-center"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : beneficios.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-lg">No hay beneficios.</div>
        ) : beneficios.map((b) => (
          <div key={b.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{personasMap[b.persona_id] ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{b.motivo ?? "Sin motivo"}</p>
              </div>
              <Badge className={`text-[10px] ${TIPO_COLOR[b.tipo_beneficio] ?? ""}`}>{TIPO_LABEL[b.tipo_beneficio] ?? b.tipo_beneficio}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground text-sm">{b.valor_tipo === "porcentaje" ? `${b.valor}%` : `$${b.valor.toLocaleString("es-CL")}`}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo Beneficio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Jugador</Label>
              <Select value={form.persona_id} onValueChange={(v) => setForm({ ...form, persona_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                <SelectContent>
                  {personas.filter((p) => p.tipo_persona === "jugador").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{personaLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoría (opcional)</Label>
              <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo_beneficio} onValueChange={(v) => setForm({ ...form, tipo_beneficio: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beca">Beca</SelectItem>
                    <SelectItem value="descuento">Descuento</SelectItem>
                    <SelectItem value="exencion">Exención</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo valor</Label>
                <Select value={form.valor_tipo} onValueChange={(v) => setForm({ ...form, valor_tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="porcentaje">Porcentaje</SelectItem>
                    <SelectItem value="monto">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Valor ({form.valor_tipo === "porcentaje" ? "%" : "$"})</Label>
              <Input type="number" value={form.valor || ""} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Beca deportiva destacada" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha inicio</Label><Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} /></div>
              <div><Label>Fecha fin</Label><Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.activo} onCheckedChange={(v) => setForm({ ...form, activo: v })} />
              <Label>Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
