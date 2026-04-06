import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, Ruler, ClipboardCheck, Download, ChevronDown, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCategorias, usePersonasByCategoria, PersonaRow } from "@/hooks/use-relational-data";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { TimelineEvent } from "@/hooks/use-deportistas";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

const ICON_MAP = { medicion: Ruler, test: ClipboardCheck, asistencia: Activity };
const COLOR_MAP = { medicion: "border-blue-400 bg-blue-50", test: "border-green-400 bg-green-50", asistencia: "border-purple-400 bg-purple-50" };
const LABEL_MAP: Record<string, string> = { medicion: "Medición", test: "Test", asistencia: "Asistencia" };

export default function TimelineTab() {
  const { clubId } = useAuth();
  const { categorias } = useCategorias();
  const [catId, setCatId] = useState("");
  const { personas: deportistas } = usePersonasByCategoria(catId || null);
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
  const [timelines, setTimelines] = useState<Record<string, TimelineEvent[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchTimelines = useCallback(async () => {
    if (!deportistas.length || !clubId) { setTimelines({}); return; }
    setLoading(true);
    const ids = deportistas.map(d => d.id);

    const [medRes, testRes, asisRes] = await Promise.all([
      supabase.from("mediciones_biometricas" as any).select("id, persona_id, fecha_medicion, talla, peso").in("persona_id", ids).order("fecha_medicion", { ascending: false }),
      supabase.from("registros_test_deportivo" as any).select("id, persona_id, fecha_ejecucion, valor, tipos_test_deportivo:tipo_test_id(nombre, unidad_medida)").in("persona_id", ids).order("fecha_ejecucion", { ascending: false }),
      supabase.from("asistencia_entrenamiento" as any).select("id, persona_id, estado, sesiones_entrenamiento:sesion_id(fecha, hora_inicio, hora_fin)").in("persona_id", ids).eq("club_id", clubId).order("created_at", { ascending: false }).limit(200),
    ]);

    const grouped: Record<string, TimelineEvent[]> = {};
    const ensure = (pid: string) => { if (!grouped[pid]) grouped[pid] = []; };

    ((medRes.data as any[]) ?? []).forEach((m: any) => {
      ensure(m.persona_id);
      grouped[m.persona_id].push({ id: m.id, tipo: "medicion", fecha: m.fecha_medicion, titulo: "Medición Física", detalle: `Talla: ${m.talla ?? '-'} cm · Peso: ${m.peso ?? '-'} kg` });
    });
    ((testRes.data as any[]) ?? []).forEach((t: any) => {
      ensure(t.persona_id);
      grouped[t.persona_id].push({ id: t.id, tipo: "test", fecha: t.fecha_ejecucion, titulo: t.tipos_test_deportivo?.nombre || "Test", detalle: `${t.valor} ${t.tipos_test_deportivo?.unidad_medida || ''}` });
    });
    ((asisRes.data as any[]) ?? []).forEach((a: any) => {
      ensure(a.persona_id);
      grouped[a.persona_id].push({ id: a.id, tipo: "asistencia", fecha: a.sesiones_entrenamiento?.fecha || '', titulo: "Entrenamiento", detalle: `${a.estado} · ${a.sesiones_entrenamiento?.hora_inicio?.slice(0,5) ?? ''}-${a.sesiones_entrenamiento?.hora_fin?.slice(0,5) ?? ''}` });
    });

    Object.values(grouped).forEach(arr => arr.sort((a, b) => b.fecha.localeCompare(a.fecha)));
    setTimelines(grouped);
    setLoading(false);
  }, [deportistas, clubId]);

  useEffect(() => { fetchTimelines(); }, [fetchTimelines]);

  const exportExcel = () => {
    const rows: any[] = [];
    deportistas.forEach(p => {
      const events = timelines[p.id] || [];
      events.forEach(e => {
        rows.push({ Deportista: `${p.apellido}, ${p.nombre}`, Fecha: e.fecha, Tipo: LABEL_MAP[e.tipo], Título: e.titulo, Detalle: e.detalle });
      });
    });
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    const cat = categorias.find(c => c.id === catId);
    XLSX.writeFile(wb, `historial_${cat?.nombre || "categoria"}.xlsx`);
  };

  const togglePersona = (id: string) => setExpandedPersona(prev => prev === id ? null : id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={catId} onValueChange={(v) => { setCatId(v); setExpandedPersona(null); }}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
          <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.rama})</SelectItem>)}</SelectContent>
        </Select>
        {catId && deportistas.length > 0 && (
          <Button variant="outline" onClick={exportExcel}><Download className="w-4 h-4 mr-1" /> Exportar Excel</Button>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando historial...</p>}

      {!catId && (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm border rounded-lg">
          Selecciona una categoría para ver la línea de vida
        </div>
      )}

      {catId && !loading && (
        <div className="space-y-2">
          {deportistas.map(p => {
            const events = timelines[p.id] || [];
            const isExpanded = expandedPersona === p.id;
            return (
              <div key={p.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => togglePersona(p.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-medium text-sm">{p.apellido}, {p.nombre}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">{events.filter(e => e.tipo === "medicion").length} med.</Badge>
                    <Badge variant="outline" className="text-xs">{events.filter(e => e.tipo === "test").length} tests</Badge>
                    <Badge variant="outline" className="text-xs">{events.filter(e => e.tipo === "asistencia").length} asist.</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    {events.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">Sin registros históricos</p>
                    ) : (
                      <div className="relative ml-4">
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                        <div className="space-y-2">
                          {events.slice(0, 30).map((e, i) => {
                            const Icon = ICON_MAP[e.tipo];
                            return (
                              <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                className="flex items-start gap-3">
                                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${COLOR_MAP[e.tipo]}`}>
                                  <Icon className="w-3 h-3" />
                                </div>
                                <div className="flex-1 py-0.5">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-xs">{e.titulo}</p>
                                    <Badge variant="outline" className="text-[10px]">{LABEL_MAP[e.tipo]}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{e.detalle}</p>
                                  <p className="text-[10px] text-muted-foreground">{e.fecha ? format(new Date(e.fecha + "T12:00:00"), "dd MMM yyyy", { locale: es }) : ""}</p>
                                </div>
                              </motion.div>
                            );
                          })}
                          {events.length > 30 && <p className="text-xs text-muted-foreground ml-9">...y {events.length - 30} registros más</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {deportistas.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin deportistas en esta categoría</p>}
        </div>
      )}
    </div>
  );
}
