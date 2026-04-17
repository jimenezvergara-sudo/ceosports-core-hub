import { useEffect, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import NuevoProyectoDialog from "@/components/proyectos/NuevoProyectoDialog";
import ProyectoDetailSheet from "@/components/proyectos/ProyectoDetailSheet";

interface ProyectoRow {
  id: string;
  nombre: string;
  fuente_financiamiento: string | null;
  tipo: string;
  presupuesto: number;
  estado: string;
  ejecutado: number;
  txs: number;
}

export default function Proyectos() {
  const { clubId } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("proyectos").select("*").order("created_at", { ascending: false });
    if (clubId) q = q.eq("club_id", clubId);
    const { data: ps } = await q;
    const ids = (ps ?? []).map((p) => p.id);
    let txByProyecto: Record<string, { ejecutado: number; count: number }> = {};
    if (ids.length) {
      const { data: txs } = await supabase
        .from("transacciones")
        .select("proyecto_id, monto, tipo")
        .in("proyecto_id", ids);
      (txs ?? []).forEach((t: any) => {
        const k = t.proyecto_id;
        if (!k) return;
        txByProyecto[k] ??= { ejecutado: 0, count: 0 };
        txByProyecto[k].count++;
        if (t.tipo === "Egreso") txByProyecto[k].ejecutado += Number(t.monto || 0);
      });
    }
    setProyectos((ps ?? []).map((p: any) => ({
      id: p.id, nombre: p.nombre,
      fuente_financiamiento: p.fuente_financiamiento, tipo: p.tipo,
      presupuesto: p.presupuesto, estado: p.estado,
      ejecutado: txByProyecto[p.id]?.ejecutado ?? 0,
      txs: txByProyecto[p.id]?.count ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [clubId]);

  return (
    <PageShell
      title="Proyectos"
      description="Subvenciones y rendición de fondos públicos"
      icon={FolderKanban}
      actions={
        <Button className="gap-2" onClick={() => { setEditing(null); setOpenNew(true); }}>
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </Button>
      }
    >
      <div className="grid gap-4">
        {loading && <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>}
        {!loading && proyectos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aún no hay proyectos. Crea el primero.</p>
          </div>
        )}
        {proyectos.map((p, i) => {
          const pct = p.presupuesto > 0 ? Math.round((p.ejecutado / p.presupuesto) * 100) : 0;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
              onClick={() => setDetailId(p.id)}
              className="glass rounded-xl p-6 shadow-card hover:shadow-glow transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-foreground font-semibold">{p.nombre}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{p.fuente_financiamiento ?? p.tipo} · {p.txs} transacciones vinculadas</p>
                </div>
                <Badge variant={p.estado === "Rendido" ? "outline" : "secondary"} className="text-xs shrink-0">{p.estado}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1"><Progress value={Math.min(pct, 100)} className="h-2" /></div>
                <span className="text-xs font-mono text-muted-foreground">{pct}%</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-muted-foreground">
                <span>Presupuesto: <span className="text-foreground font-medium">${Number(p.presupuesto).toLocaleString("es-CL")}</span></span>
                <span>Ejecutado: <span className="text-foreground font-medium">${p.ejecutado.toLocaleString("es-CL")}</span></span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <NuevoProyectoDialog open={openNew} onOpenChange={setOpenNew} proyecto={editing} onSaved={load} />
      <ProyectoDetailSheet
        proyectoId={detailId}
        open={!!detailId}
        onOpenChange={(v) => !v && setDetailId(null)}
        onEdit={(p) => { setDetailId(null); setEditing(p); setOpenNew(true); }}
        onChanged={load}
      />
    </PageShell>
  );
}
