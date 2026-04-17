import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface DashboardKPIs {
  caja: number;
  cajaDelta: number | null;
  sociosActivos: number;
  categoriasCount: number;
  morosos: number;
  morosidadPct: number;
  docsPorVencer: number;
}

export interface MorosidadPorCategoria {
  categoria: string;
  total: number;
  morosos: number;
}

export interface DocumentoVencimiento {
  id: string;
  nombre: string;
  tipo: string;
  vence: string;
  estado: "critico" | "urgente" | "proximo" | "ok";
}

export interface TransaccionReciente {
  id: string;
  desc: string;
  monto: number;
  tipo: "ingreso" | "egreso";
  fecha: string;
}

const fmtFecha = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
};

export function useDashboard() {
  const { clubId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs>({
    caja: 0,
    cajaDelta: null,
    sociosActivos: 0,
    categoriasCount: 0,
    morosos: 0,
    morosidadPct: 0,
    docsPorVencer: 0,
  });
  const [morosidad, setMorosidad] = useState<MorosidadPorCategoria[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoVencimiento[]>([]);
  const [transacciones, setTransacciones] = useState<TransaccionReciente[]>([]);

  useEffect(() => {
    if (!clubId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const hoy = new Date();
      const en30 = new Date();
      en30.setDate(en30.getDate() + 30);
      const en30Iso = en30.toISOString().slice(0, 10);
      const hoyIso = hoy.toISOString().slice(0, 10);

      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
      const inicioMesPrev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10);
      const finMesPrev = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10);

      const [
        txsRes,
        personasRes,
        cuotasMorosasRes,
        docsRes,
        categoriasRes,
        personaCatRes,
        txsRecRes,
      ] = await Promise.all([
        supabase.from("transacciones" as any).select("tipo,monto,fecha,descripcion").eq("club_id", clubId),
        supabase.from("personas").select("id,estado").eq("club_id", clubId).eq("estado", "activo"),
        supabase
          .from("cuotas")
          .select("id,persona_id,categoria_id,estado,fecha_vencimiento")
          .eq("club_id", clubId)
          .lt("fecha_vencimiento", hoyIso)
          .in("estado", ["pendiente", "parcial", "vencida"]),
        supabase
          .from("documentos")
          .select("id,etiqueta,nombre_archivo,fecha_vencimiento,persona_id")
          .eq("club_id", clubId)
          .not("fecha_vencimiento", "is", null)
          .lte("fecha_vencimiento", en30Iso)
          .gte("fecha_vencimiento", hoyIso)
          .order("fecha_vencimiento", { ascending: true }),
        supabase.from("categorias").select("id,nombre").eq("club_id", clubId),
        supabase.from("persona_categoria").select("persona_id,categoria_id").eq("club_id", clubId),
        supabase
          .from("transacciones" as any)
          .select("id,tipo,monto,fecha,descripcion")
          .eq("club_id", clubId)
          .order("fecha", { ascending: false })
          .limit(5),
      ]);

      // CAJA
      const txs = (txsRes.data as any[]) ?? [];
      let caja = 0;
      let cajaMesAct = 0;
      let cajaMesPrev = 0;
      txs.forEach((t) => {
        const monto = Number(t.monto) || 0;
        const signo = String(t.tipo).toLowerCase() === "ingreso" ? 1 : -1;
        caja += signo * monto;
        if (t.fecha >= inicioMes) cajaMesAct += signo * monto;
        else if (t.fecha >= inicioMesPrev && t.fecha <= finMesPrev) cajaMesPrev += signo * monto;
      });
      const cajaDelta = cajaMesPrev !== 0 ? ((cajaMesAct - cajaMesPrev) / Math.abs(cajaMesPrev)) * 100 : null;

      // SOCIOS
      const sociosActivos = personasRes.data?.length ?? 0;
      const categoriasCount = categoriasRes.data?.length ?? 0;

      // MOROSIDAD
      const morososData = (cuotasMorosasRes.data as any[]) ?? [];
      const morososIds = new Set(morososData.map((c) => c.persona_id));
      const morosos = morososIds.size;
      const morosidadPct = sociosActivos > 0 ? (morosos / sociosActivos) * 100 : 0;

      // DOCS
      const docsData = (docsRes.data as any[]) ?? [];
      const docsPorVencer = docsData.length;

      setKpis({
        caja,
        cajaDelta,
        sociosActivos,
        categoriasCount,
        morosos,
        morosidadPct,
        docsPorVencer,
      });

      // MOROSIDAD POR CATEGORIA
      const cats = (categoriasRes.data as any[]) ?? [];
      const personaCat = (personaCatRes.data as any[]) ?? [];
      const totalPorCat = new Map<string, Set<string>>();
      const morososPorCat = new Map<string, Set<string>>();
      personaCat.forEach((pc) => {
        if (!totalPorCat.has(pc.categoria_id)) totalPorCat.set(pc.categoria_id, new Set());
        totalPorCat.get(pc.categoria_id)!.add(pc.persona_id);
      });
      morososData.forEach((c) => {
        if (!c.categoria_id) return;
        if (!morososPorCat.has(c.categoria_id)) morososPorCat.set(c.categoria_id, new Set());
        morososPorCat.get(c.categoria_id)!.add(c.persona_id);
      });
      const morosidadList: MorosidadPorCategoria[] = cats
        .map((c) => ({
          categoria: c.nombre,
          total: totalPorCat.get(c.id)?.size ?? 0,
          morosos: morososPorCat.get(c.id)?.size ?? 0,
        }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total);
      setMorosidad(morosidadList);

      // DOCS LIST (top 5)
      const docsList: DocumentoVencimiento[] = docsData.slice(0, 5).map((d) => {
        const dias = Math.ceil((new Date(d.fecha_vencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        let estado: DocumentoVencimiento["estado"] = "ok";
        if (dias <= 7) estado = "critico";
        else if (dias <= 15) estado = "urgente";
        else estado = "proximo";
        return {
          id: d.id,
          nombre: d.nombre_archivo,
          tipo: d.etiqueta,
          vence: d.fecha_vencimiento,
          estado,
        };
      });
      setDocumentos(docsList);

      // TXS RECIENTES
      const txsRec = ((txsRecRes.data as any[]) ?? []).map((t) => ({
        id: t.id,
        desc: t.descripcion ?? "Sin descripción",
        monto: String(t.tipo).toLowerCase() === "ingreso" ? Number(t.monto) : -Number(t.monto),
        tipo: String(t.tipo).toLowerCase() === "ingreso" ? ("ingreso" as const) : ("egreso" as const),
        fecha: fmtFecha(t.fecha),
      }));
      setTransacciones(txsRec);

      setLoading(false);
    };

    load();
  }, [clubId]);

  return { loading, kpis, morosidad, documentos, transacciones };
}
