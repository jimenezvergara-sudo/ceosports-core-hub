import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CronCuotasState {
  loading: boolean;
  ultimaEjecucion: string | null;
  ultimoResultado: string | null;
  ultimasCuotas: number | null;
  generadoEsteMes: boolean;
  proximaEjecucion: Date;
  refresh: () => Promise<void>;
}

function nextFirstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export function useCronCuotas(): CronCuotasState {
  const [loading, setLoading] = useState(true);
  const [ultimaEjecucion, setUltimaEjecucion] = useState<string | null>(null);
  const [ultimoResultado, setUltimoResultado] = useState<string | null>(null);
  const [ultimasCuotas, setUltimasCuotas] = useState<number | null>(null);
  const [generadoEsteMes, setGeneradoEsteMes] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("cron_logs")
      .select("ejecutado_en, resultado, cuotas_generadas")
      .eq("job_name", "cron-cuotas")
      .order("ejecutado_en", { ascending: false })
      .limit(30);

    const rows = (data ?? []) as any[];
    if (rows.length) {
      setUltimaEjecucion(rows[0].ejecutado_en);
      setUltimoResultado(rows[0].resultado);
      setUltimasCuotas(rows[0].cuotas_generadas ?? 0);
    } else {
      setUltimaEjecucion(null);
      setUltimoResultado(null);
      setUltimasCuotas(null);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const generated = rows.some(
      (r) => (r.cuotas_generadas ?? 0) > 0 && new Date(r.ejecutado_en) >= monthStart,
    );
    setGeneradoEsteMes(generated);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return {
    loading,
    ultimaEjecucion,
    ultimoResultado,
    ultimasCuotas,
    generadoEsteMes,
    proximaEjecucion: nextFirstOfMonth(),
    refresh: load,
  };
}
