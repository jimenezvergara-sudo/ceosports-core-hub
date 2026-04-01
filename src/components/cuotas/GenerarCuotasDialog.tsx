import { useState } from "react";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategorias } from "@/hooks/use-relational-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  onGenerated: () => void;
}

export default function GenerarCuotasDialog({ onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const { categorias } = useCategorias();
  const [categoriaId, setCategoriaId] = useState("");
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!categoriaId || !periodo) {
      toast.error("Selecciona categoría y periodo");
      return;
    }

    setGenerating(true);
    try {
      // 1. Get active config for this category
      const { data: configs } = await supabase
        .from("cuota_configuraciones")
        .select("*")
        .eq("categoria_id", categoriaId)
        .eq("activa", true)
        .limit(1);

      const config = (configs as any[])?.[0];
      if (!config) {
        toast.error("No hay configuración activa para esta categoría");
        setGenerating(false);
        return;
      }

      // 2. Get active jugadores in this category via persona_categoria
      const { data: pcRows } = await supabase
        .from("persona_categoria")
        .select("persona_id")
        .eq("categoria_id", categoriaId);

      const personaIds = (pcRows as any[])?.map((r) => r.persona_id) ?? [];
      if (!personaIds.length) {
        toast.error("No hay jugadores activos en esta categoría");
        setGenerating(false);
        return;
      }

      // Filter to active jugadores
      const { data: jugadores } = await supabase
        .from("personas")
        .select("id")
        .in("id", personaIds)
        .eq("tipo_persona", "jugador")
        .eq("estado", "activo");

      const activeIds = (jugadores as any[])?.map((j) => j.id) ?? [];
      if (!activeIds.length) {
        toast.error("No hay jugadores activos en esta categoría");
        setGenerating(false);
        return;
      }

      // 3. Check existing cuotas to avoid duplicates
      const { data: existing } = await supabase
        .from("cuotas")
        .select("persona_id")
        .eq("categoria_id", categoriaId)
        .eq("periodo", periodo);

      const existingIds = new Set((existing as any[])?.map((e) => e.persona_id) ?? []);
      const newIds = activeIds.filter((id) => !existingIds.has(id));

      if (!newIds.length) {
        toast.info("Ya existen cuotas para todos los jugadores de este periodo");
        setGenerating(false);
        return;
      }

      // 4. Get apoderado for each jugador (first found)
      const { data: relaciones } = await supabase
        .from("persona_relaciones")
        .select("persona_id, relacionado_id")
        .in("persona_id", newIds);

      const apoMap: Record<string, string> = {};
      (relaciones as any[])?.forEach((r) => {
        if (!apoMap[r.persona_id]) apoMap[r.persona_id] = r.relacionado_id;
      });

      // 5. Get beneficios for these personas
      const { data: beneficios } = await supabase
        .from("beneficios_cuota")
        .select("*")
        .in("persona_id", newIds)
        .eq("activo", true);

      const beneficioMap: Record<string, { tipo: string; valor: number; valor_tipo: string }> = {};
      (beneficios as any[])?.forEach((b) => {
        // Use the most favorable benefit
        if (!beneficioMap[b.persona_id] || b.valor > beneficioMap[b.persona_id].valor) {
          beneficioMap[b.persona_id] = { tipo: b.tipo_beneficio, valor: b.valor, valor_tipo: b.valor_tipo };
        }
      });

      // 6. Build cuota records
      const [year, month] = periodo.split("-").map(Number);
      const vencimiento = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(config.dia_vencimiento, 28)).padStart(2, "0")}`;

      const cuotasToInsert = newIds.map((pid) => {
        let descuento = 0;
        const ben = beneficioMap[pid];
        if (ben) {
          if (ben.tipo === "exencion") {
            descuento = config.monto_base;
          } else if (ben.valor_tipo === "porcentaje") {
            descuento = Math.round(config.monto_base * ben.valor / 100);
          } else {
            descuento = ben.valor;
          }
        }
        const montoFinal = Math.max(0, config.monto_base - descuento);

        return {
          persona_id: pid,
          apoderado_id: apoMap[pid] || null,
          categoria_id: categoriaId,
          configuracion_id: config.id,
          periodo,
          fecha_emision: new Date().toISOString().slice(0, 10),
          fecha_vencimiento: vencimiento,
          monto_original: config.monto_base,
          descuento,
          recargo: 0,
          monto_final: montoFinal,
          estado: "pendiente",
        };
      });

      await supabase.from("cuotas").insert(cuotasToInsert as any);
      toast.success(`Se generaron ${cuotasToInsert.length} cuotas para ${periodo}`);
      setOpen(false);
      onGenerated();
    } catch (err) {
      toast.error("Error al generar cuotas");
    }
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Zap className="w-4 h-4 mr-1" />Generar Cuotas</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Cuotas Masivas</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Genera cuotas automáticamente para todos los jugadores activos de una categoría.</p>
        <div className="space-y-4">
          <div>
            <Label>Categoría</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
              <SelectContent>
                {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Periodo (YYYY-MM)</Label>
            <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={generate} disabled={generating}>{generating ? "Generando..." : "Generar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
