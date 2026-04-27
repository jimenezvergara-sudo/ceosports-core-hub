import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type TipoEntrenamiento = "Técnico" | "Físico" | "Táctico" | "Partido" | "Mixto";
export type Intensidad = "Baja" | "Media" | "Alta";

export interface SesionEntrenamiento {
  id: string;
  categoria_id: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  notas: string | null;
  categoria_nombre?: string;
  tipo_entrenamiento?: TipoEntrenamiento | null;
  objetivo_dia?: string | null;
  intensidad?: Intensidad | null;
  notas_entrenador?: string | null;
  resultado_sesion?: string | null;
  created_by?: string | null;
}

export interface SesionEjercicio {
  id: string;
  sesion_id: string;
  nombre: string;
  duracion_min: number;
  orden: number;
}

export type TipoObservacion = "positiva" | "mejora" | "lesion" | "ausencia" | "destacada";

export interface ObservacionJugadora {
  id: string;
  sesion_id: string;
  persona_id: string;
  tipo: TipoObservacion;
  texto: string;
  created_by: string | null;
  created_at: string;
  persona_nombre?: string;
  persona_apellido?: string;
}

export interface RecordatorioCoach {
  id: string;
  club_id: string;
  persona_id: string | null;
  sesion_id: string | null;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  prioridad: "baja" | "media" | "alta";
  estado: "pendiente" | "cumplido";
  created_by: string | null;
  cumplido_at: string | null;
  created_at: string;
  persona_nombre?: string;
  persona_apellido?: string;
}

export interface AsistenciaRow {
  id: string;
  sesion_id: string;
  persona_id: string;
  estado: string;
  observaciones: string | null;
  persona_nombre?: string;
  persona_apellido?: string;
}

export interface MedicionBiometrica {
  id: string;
  persona_id: string;
  fecha_medicion: string;
  peso: number | null;
  talla: number | null;
  envergadura: number | null;
  alcance: number | null;
  talla_padre: number | null;
  talla_madre: number | null;
  observaciones: string | null;
}

export interface TipoTestDeportivo {
  id: string;
  nombre: string;
  categoria: string;
  unidad_medida: string;
  descripcion: string | null;
  activo: boolean;
}

export interface RegistroTestDeportivo {
  id: string;
  persona_id: string;
  tipo_test_id: string;
  fecha_ejecucion: string;
  valor: number;
  observaciones: string | null;
  tipo_test_nombre?: string;
  tipo_test_unidad?: string;
  tipo_test_categoria?: string;
}

export function useSesiones() {
  const [sesiones, setSesiones] = useState<SesionEntrenamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();

  const fetch = useCallback(async () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("sesiones_entrenamiento" as any)
      .select("id, categoria_id, fecha, hora_inicio, hora_fin, notas, tipo_entrenamiento, objetivo_dia, intensidad, notas_entrenador, resultado_sesion, created_by, categorias:categoria_id(nombre)")
      .eq("club_id", clubId)
      .order("fecha", { ascending: false });
    const mapped = ((data as any[]) ?? []).map((s: any) => ({
      ...s,
      categoria_nombre: s.categorias?.nombre,
    }));
    setSesiones(mapped);
    setLoading(false);
  }, [clubId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { sesiones, loading, refetch: fetch };
}

export function useAsistencia(sesionId: string | null) {
  const [asistencia, setAsistencia] = useState<AsistenciaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!sesionId) { setAsistencia([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("asistencia_entrenamiento" as any)
      .select("id, sesion_id, persona_id, estado, observaciones, personas:persona_id(nombre, apellido)")
      .eq("sesion_id", sesionId);
    const mapped = ((data as any[]) ?? []).map((a: any) => ({
      ...a,
      persona_nombre: a.personas?.nombre,
      persona_apellido: a.personas?.apellido,
    }));
    setAsistencia(mapped);
    setLoading(false);
  }, [sesionId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { asistencia, loading, refetch: fetch };
}

export function useMediciones(personaId: string | null) {
  const [mediciones, setMediciones] = useState<MedicionBiometrica[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!personaId) { setMediciones([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("mediciones_biometricas" as any)
      .select("*")
      .eq("persona_id", personaId)
      .order("fecha_medicion", { ascending: false });
    setMediciones((data as unknown as MedicionBiometrica[]) ?? []);
    setLoading(false);
  }, [personaId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { mediciones, loading, refetch: fetch };
}

export function useTiposTest() {
  const [tipos, setTipos] = useState<TipoTestDeportivo[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();

  const fetch = useCallback(async () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("tipos_test_deportivo" as any)
      .select("*")
      .eq("club_id", clubId)
      .eq("activo", true)
      .order("categoria, nombre");
    setTipos((data as unknown as TipoTestDeportivo[]) ?? []);
    setLoading(false);
  }, [clubId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { tipos, loading, refetch: fetch };
}

export function useRegistrosTest(personaId: string | null) {
  const [registros, setRegistros] = useState<RegistroTestDeportivo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!personaId) { setRegistros([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("registros_test_deportivo" as any)
      .select("id, persona_id, tipo_test_id, fecha_ejecucion, valor, observaciones, tipos_test_deportivo:tipo_test_id(nombre, unidad_medida, categoria)")
      .eq("persona_id", personaId)
      .order("fecha_ejecucion", { ascending: false });
    const mapped = ((data as any[]) ?? []).map((r: any) => ({
      ...r,
      tipo_test_nombre: r.tipos_test_deportivo?.nombre,
      tipo_test_unidad: r.tipos_test_deportivo?.unidad_medida,
      tipo_test_categoria: r.tipos_test_deportivo?.categoria,
    }));
    setRegistros(mapped);
    setLoading(false);
  }, [personaId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { registros, loading, refetch: fetch };
}

// ============= Asistencia stats =============

export interface AsistenciaPersonaStats {
  persona_id: string;
  nombre: string;
  apellido: string;
  total: number;
  presentes: number;
  ausentes: number;
  justificadas: number;
  porcentaje: number;
}

export interface AsistenciaCategoriaStats {
  totalSesiones: number;
  promedioAsistencia: number;
  jugadorasBajas: AsistenciaPersonaStats[]; // <70%
  jugadorasPerfectas: AsistenciaPersonaStats[]; // 100%
  porPersona: AsistenciaPersonaStats[];
}

/**
 * Stats de asistencia por categoría en un rango de fechas.
 * Calcula % por jugadora y agregados.
 */
export function useAsistenciaStatsCategoria(categoriaId: string | null, desde: string, hasta: string) {
  const [stats, setStats] = useState<AsistenciaCategoriaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { clubId } = useAuth();

  const fetch = useCallback(async () => {
    if (!categoriaId || !clubId) { setStats(null); return; }
    setLoading(true);
    // Sesiones de la categoría en el rango
    const { data: sesData } = await supabase
      .from("sesiones_entrenamiento" as any)
      .select("id")
      .eq("club_id", clubId)
      .eq("categoria_id", categoriaId)
      .gte("fecha", desde)
      .lte("fecha", hasta);
    const sesIds = ((sesData as any[]) ?? []).map((s: any) => s.id);
    const totalSesiones = sesIds.length;

    if (sesIds.length === 0) {
      setStats({ totalSesiones: 0, promedioAsistencia: 0, jugadorasBajas: [], jugadorasPerfectas: [], porPersona: [] });
      setLoading(false);
      return;
    }

    // Asistencia de esas sesiones
    const { data: asisData } = await supabase
      .from("asistencia_entrenamiento" as any)
      .select("persona_id, estado, personas:persona_id(nombre, apellido)")
      .in("sesion_id", sesIds);

    const map = new Map<string, AsistenciaPersonaStats>();
    ((asisData as any[]) ?? []).forEach((a: any) => {
      const cur = map.get(a.persona_id) ?? {
        persona_id: a.persona_id,
        nombre: a.personas?.nombre ?? "",
        apellido: a.personas?.apellido ?? "",
        total: 0, presentes: 0, ausentes: 0, justificadas: 0, porcentaje: 0,
      };
      cur.total += 1;
      if (a.estado === "presente") cur.presentes += 1;
      else if (a.estado === "ausente") cur.ausentes += 1;
      else if (a.estado === "justificado" || a.estado === "lesionada") cur.justificadas += 1;
      map.set(a.persona_id, cur);
    });

    const porPersona = Array.from(map.values()).map((p) => ({
      ...p,
      porcentaje: p.total > 0 ? Math.round(((p.presentes + p.justificadas) / p.total) * 100) : 0,
    })).sort((a, b) => a.apellido.localeCompare(b.apellido));

    const promedioAsistencia = porPersona.length > 0
      ? Math.round(porPersona.reduce((s, p) => s + p.porcentaje, 0) / porPersona.length)
      : 0;

    setStats({
      totalSesiones,
      promedioAsistencia,
      jugadorasBajas: porPersona.filter((p) => p.total > 0 && p.porcentaje < 70),
      jugadorasPerfectas: porPersona.filter((p) => p.total > 0 && p.porcentaje === 100),
      porPersona,
    });
    setLoading(false);
  }, [categoriaId, clubId, desde, hasta]);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, loading, refetch: fetch };
}

/**
 * % asistencia de una persona en un rango de fechas.
 */
export function useAsistenciaPersona(personaId: string | null, desde: string, hasta: string) {
  const [data, setData] = useState<{ total: number; presentes: number; porcentaje: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const { clubId } = useAuth();

  const fetch = useCallback(async () => {
    if (!personaId || !clubId) { setData(null); return; }
    setLoading(true);
    const { data: rows } = await supabase
      .from("asistencia_entrenamiento" as any)
      .select("estado, sesiones_entrenamiento:sesion_id!inner(fecha, club_id)")
      .eq("persona_id", personaId)
      .eq("club_id", clubId)
      .gte("sesiones_entrenamiento.fecha", desde)
      .lte("sesiones_entrenamiento.fecha", hasta);
    const arr = (rows as any[]) ?? [];
    const total = arr.length;
    const presentes = arr.filter((a: any) => a.estado === "presente" || a.estado === "justificado" || a.estado === "lesionada").length;
    setData({ total, presentes, porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0 });
    setLoading(false);
  }, [personaId, clubId, desde, hasta]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading };
}

// Timeline: all events for a persona
export interface TimelineEvent {
  id: string;
  tipo: "medicion" | "test" | "asistencia";
  fecha: string;
  titulo: string;
  detalle: string;
}

export function useTimeline(personaId: string | null) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();

  const fetch = useCallback(async () => {
    if (!personaId || !clubId) { setEvents([]); setLoading(false); return; }
    setLoading(true);
    const [medRes, testRes, asisRes] = await Promise.all([
      supabase.from("mediciones_biometricas" as any).select("id, fecha_medicion, talla, peso").eq("persona_id", personaId).order("fecha_medicion", { ascending: false }),
      supabase.from("registros_test_deportivo" as any).select("id, fecha_ejecucion, valor, tipos_test_deportivo:tipo_test_id(nombre, unidad_medida)").eq("persona_id", personaId).order("fecha_ejecucion", { ascending: false }),
      supabase.from("asistencia_entrenamiento" as any).select("id, estado, sesiones_entrenamiento:sesion_id(fecha, hora_inicio, hora_fin)").eq("persona_id", personaId).eq("club_id", clubId).order("created_at", { ascending: false }).limit(50),
    ]);
    const all: TimelineEvent[] = [];
    ((medRes.data as any[]) ?? []).forEach((m: any) => all.push({ id: m.id, tipo: "medicion", fecha: m.fecha_medicion, titulo: "Medición Física", detalle: `Talla: ${m.talla ?? '-'} cm · Peso: ${m.peso ?? '-'} kg` }));
    ((testRes.data as any[]) ?? []).forEach((t: any) => all.push({ id: t.id, tipo: "test", fecha: t.fecha_ejecucion, titulo: t.tipos_test_deportivo?.nombre || "Test", detalle: `${t.valor} ${t.tipos_test_deportivo?.unidad_medida || ''}` }));
    ((asisRes.data as any[]) ?? []).forEach((a: any) => all.push({ id: a.id, tipo: "asistencia", fecha: a.sesiones_entrenamiento?.fecha || '', titulo: "Entrenamiento", detalle: `${a.estado} · ${a.sesiones_entrenamiento?.hora_inicio ?? ''}-${a.sesiones_entrenamiento?.hora_fin ?? ''}` }));
    all.sort((a, b) => b.fecha.localeCompare(a.fecha));
    setEvents(all);
    setLoading(false);
  }, [personaId, clubId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { events, loading, refetch: fetch };
}
