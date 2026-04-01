import { useState } from "react";
import { Zap, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategorias } from "@/hooks/use-relational-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Props {
  onGenerated: () => void;
}

interface GenerationSummary {
  created: number;
  totalAmount: number;
  skippedNoConfig: string[];
  skippedDuplicate: number;
  beneficiosApplied: number;
}

export default function GenerarCuotasDialog({ onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const { categorias } = useCategorias();
  const [categoriaId, setCategoriaId] = useState("todas");
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<GenerationSummary | null>(null);

  const resetAndClose = () => {
    setSummary(null);
    setOpen(false);
  };

  const generate = async () => {
    if (!periodo) {
      toast.error("Selecciona un periodo");
      return;
    }

    setGenerating(true);
    setSummary(null);

    try {
      // Determine which categories to process
      const targetCats = categoriaId === "todas"
        ? categorias
        : categorias.filter((c) => c.id === categoriaId);

      if (!targetCats.length) {
        toast.error("No hay categorías seleccionadas");
        setGenerating(false);
        return;
      }

      // 1. Get all active configs
      const { data: allConfigs } = await supabase
        .from("cuota_configuraciones")
        .select("*")
        .eq("activa", true);

      const configs = (allConfigs as any[]) ?? [];
      const configByCat: Record<string, any> = {};
      configs.forEach((c) => {
        if (c.categoria_id) configByCat[c.categoria_id] = c;
      });

      const skippedNoConfig: string[] = [];
      const catsWithConfig: { cat: typeof targetCats[0]; config: any }[] = [];

      for (const cat of targetCats) {
        if (configByCat[cat.id]) {
          catsWithConfig.push({ cat, config: configByCat[cat.id] });
        } else {
          skippedNoConfig.push(cat.nombre);
        }
      }

      if (!catsWithConfig.length) {
        setSummary({ created: 0, totalAmount: 0, skippedNoConfig, skippedDuplicate: 0, beneficiosApplied: 0 });
        setGenerating(false);
        return;
      }

      // 2. Get active jugadores with categories via persona_categoria
      const catIds = catsWithConfig.map((c) => c.cat.id);
      const { data: pcRows } = await supabase
        .from("persona_categoria")
        .select("persona_id, categoria_id")
        .in("categoria_id", catIds);

      const personaCatPairs = (pcRows as any[]) ?? [];
      const allPersonaIds = [...new Set(personaCatPairs.map((r) => r.persona_id))];

      if (!allPersonaIds.length) {
        setSummary({ created: 0, totalAmount: 0, skippedNoConfig, skippedDuplicate: 0, beneficiosApplied: 0 });
        toast.info("No hay jugadores asignados a las categorías seleccionadas");
        setGenerating(false);
        return;
      }

      // Filter to active jugadores
      const { data: jugadores } = await supabase
        .from("personas")
        .select("id")
        .in("id", allPersonaIds)
        .eq("tipo_persona", "jugador")
        .eq("estado", "activo");

      const activeIdSet = new Set((jugadores as any[])?.map((j) => j.id) ?? []);

      // Build persona→categories mapping (only active)
      const personaCatMap: { persona_id: string; categoria_id: string }[] = personaCatPairs
        .filter((p) => activeIdSet.has(p.persona_id));

      if (!personaCatMap.length) {
        setSummary({ created: 0, totalAmount: 0, skippedNoConfig, skippedDuplicate: 0, beneficiosApplied: 0 });
        toast.info("No hay jugadores activos en las categorías seleccionadas");
        setGenerating(false);
        return;
      }

      // 3. Check existing cuotas to avoid duplicates
      const { data: existing } = await supabase
        .from("cuotas")
        .select("persona_id, categoria_id")
        .eq("periodo", periodo)
        .in("categoria_id", catIds);

      const existingKeys = new Set(
        (existing as any[])?.map((e) => `${e.persona_id}_${e.categoria_id}`) ?? []
      );

      const newPairs = personaCatMap.filter(
        (p) => !existingKeys.has(`${p.persona_id}_${p.categoria_id}`)
      );
      const skippedDuplicate = personaCatMap.length - newPairs.length;

      if (!newPairs.length) {
        setSummary({ created: 0, totalAmount: 0, skippedNoConfig, skippedDuplicate, beneficiosApplied: 0 });
        toast.info("Ya existen cuotas para todos los jugadores de este periodo");
        setGenerating(false);
        return;
      }

      // 4. Get apoderado for each jugador
      const uniquePersonaIds = [...new Set(newPairs.map((p) => p.persona_id))];
      const { data: relaciones } = await supabase
        .from("persona_relaciones")
        .select("persona_id, relacionado_id")
        .in("persona_id", uniquePersonaIds);

      const apoMap: Record<string, string> = {};
      (relaciones as any[])?.forEach((r) => {
        if (!apoMap[r.persona_id]) apoMap[r.persona_id] = r.relacionado_id;
      });

      // 5. Get beneficios
      const { data: beneficios } = await supabase
        .from("beneficios_cuota")
        .select("*")
        .in("persona_id", uniquePersonaIds)
        .eq("activo", true);

      const beneficioMap: Record<string, { tipo: string; valor: number; valor_tipo: string }> = {};
      (beneficios as any[])?.forEach((b) => {
        if (!beneficioMap[b.persona_id] || b.valor > beneficioMap[b.persona_id].valor) {
          beneficioMap[b.persona_id] = { tipo: b.tipo_beneficio, valor: b.valor, valor_tipo: b.valor_tipo };
        }
      });

      // 6. Build cuota records
      const [year, month] = periodo.split("-").map(Number);
      let beneficiosApplied = 0;

      const cuotasToInsert = newPairs.map((pair) => {
        const config = configByCat[pair.categoria_id];
        const vencimiento = `${year}-${String(month).padStart(2, "0")}-${String(Math.min(config.dia_vencimiento, 28)).padStart(2, "0")}`;

        let descuento = 0;
        const ben = beneficioMap[pair.persona_id];
        if (ben) {
          beneficiosApplied++;
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
          persona_id: pair.persona_id,
          apoderado_id: apoMap[pair.persona_id] || null,
          categoria_id: pair.categoria_id,
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

      const totalAmount = cuotasToInsert.reduce((s, c) => s + c.monto_final, 0);

      setSummary({
        created: cuotasToInsert.length,
        totalAmount,
        skippedNoConfig,
        skippedDuplicate,
        beneficiosApplied,
      });

      toast.success(`Se generaron ${cuotasToInsert.length} cuotas para ${periodo}`);
      onGenerated();
    } catch (err) {
      toast.error("Error al generar cuotas");
    }
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-10 px-4 text-sm">
          <Zap className="w-4 h-4 mr-1.5" />Generar Cuotas del Mes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Generar Cuotas Masivas
          </DialogTitle>
        </DialogHeader>

        {!summary ? (
          <>
            <p className="text-sm text-muted-foreground">
              Genera cuotas automáticamente para todos los jugadores activos con categoría y configuración activa.
            </p>
            <div className="space-y-4">
              <div>
                <Label>Categoría</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Periodo</Label>
                <Input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={resetAndClose} className="w-full sm:w-auto">Cancelar</Button>
              <Button onClick={generate} disabled={generating} className="w-full sm:w-auto">
                {generating ? "Generando..." : "Generar"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4">
            {/* Result summary */}
            {summary.created > 0 ? (
              <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">¡Cuotas generadas exitosamente!</p>
                  <p className="text-sm text-muted-foreground mt-1">Se procesaron las cuotas para el periodo {periodo}.</p>
                </div>
              </div>
            ) : (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">No se generaron cuotas</p>
                  <p className="text-sm text-muted-foreground mt-1">Revisa los detalles a continuación.</p>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{summary.created}</p>
                <p className="text-xs text-muted-foreground mt-1">Cuotas creadas</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">${summary.totalAmount.toLocaleString("es-CL")}</p>
                <p className="text-xs text-muted-foreground mt-1">Monto total emitido</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-foreground">{summary.beneficiosApplied}</p>
                <p className="text-xs text-muted-foreground mt-1">Beneficios aplicados</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3 text-center">
                <p className="text-2xl font-mono font-bold text-muted-foreground">{summary.skippedDuplicate}</p>
                <p className="text-xs text-muted-foreground mt-1">Duplicados omitidos</p>
              </div>
            </div>

            {/* Skipped categories */}
            {summary.skippedNoConfig.length > 0 && (
              <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <p className="text-sm font-medium text-foreground">Categorías sin configuración activa</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.skippedNoConfig.map((name) => (
                    <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Crea una configuración de cuota activa para estas categorías en la pestaña Config.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button onClick={resetAndClose} className="w-full sm:w-auto">Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
