import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SesionEntrenamiento {
  id: string;
  categoria_id: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  notas: string | null;
  categoria_nombre?: string;
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
      .select("id, categoria_id, fecha, hora_inicio, hora_fin, notas, categorias:categoria_id(nombre)")
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
