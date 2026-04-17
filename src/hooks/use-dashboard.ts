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

export interface ProyectoResumen {
  id: string;
  nombre: string;
  presupuesto: number;
  ejecutado: number;
  pct: number;
}

export interface CompraReciente {
  id: string;
  titulo: string;
  proveedor: string;
  monto: number;
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
  const [proyectosKpi, setProyectosKpi] = useState({ activos: 0, presupuesto: 0 });
  const [proyectosTop, setProyectosTop] = useState<ProyectoResumen[]>([]);
  const [comprasPendientes, setComprasPendientes] = useState(0);
  const [comprasRecientes, setComprasRecientes] = useState<CompraReciente[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const hoy = new Date();
      const en30 = new Date();
      en30.setDate(en30.getDate() + 30);
      const en30Iso = en30.toISOString().slice(0, 10);
      const hoyIso = hoy.toISOString().slice(0, 10);

      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
      const inicioMesPrev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().slice(0, 10);
      const finMesPrev = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().slice(0, 10);
      const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

      // Build queries; legacy data may have null club_id, so only filter if clubId present
      let qTxAct: any = supabase
        .from("transacciones")
        .select("tipo,monto,estado")
        .gte("fecha", inicioMes)
        .lte("fecha", finMes);
      let qTxPrev: any = supabase
        .from("transacciones")
        .select("tipo,monto,estado")
        .gte("fecha", inicioMesPrev)
        .lte("fecha", finMesPrev);
      let qPersonas: any = supabase.from("personas").select("id,estado").eq("estado", "activo");
      let qCuotas: any = supabase
        .from("cuotas")
        .select("id,persona_id,categoria_id,estado,fecha_vencimiento")
        .eq("periodo", periodoActual);
      let qDocs: any = supabase
        .from("club_documentos")
        .select("id,nombre,nombre_archivo,etiqueta,fecha_vencimiento")
        .not("fecha_vencimiento", "is", null)
        .lte("fecha_vencimiento", en30Iso)
        .gte("fecha_vencimiento", hoyIso)
        .order("fecha_vencimiento", { ascending: true });
      let qCats: any = supabase.from("categorias").select("id,nombre");
      let qTxsRec: any = supabase
        .from("transacciones")
        .select("id,tipo,monto,fecha,descripcion,estado")
        .neq("estado", "Anulado")
        .order("fecha", { ascending: false })
        .limit(5);
      let qProyectos: any = supabase
        .from("proyectos")
        .select("id,nombre,presupuesto,estado");
      let qTxProyectos: any = supabase
        .from("transacciones")
        .select("proyecto_id,tipo,monto,estado")
        .not("proyecto_id", "is", null)
        .neq("estado", "Anulado");
      let qComprasPend: any = supabase
        .from("solicitudes_compra")
        .select("id", { count: "exact", head: true })
        .in("estado", ["enviada", "en revisión"]);
      let qComprasRec: any = supabase
        .from("ejecuciones_compra")
        .select("id,monto_real,proveedor_real,fecha_compra,solicitud_id,solicitudes_compra:solicitud_id(titulo)")
        .order("fecha_compra", { ascending: false })
        .limit(5);

      if (clubId) {
        qTxAct = qTxAct.eq("club_id", clubId);
        qTxPrev = qTxPrev.eq("club_id", clubId);
        qPersonas = qPersonas.eq("club_id", clubId);
        qCuotas = qCuotas.eq("club_id", clubId);
        qDocs = qDocs.eq("club_id", clubId);
        qCats = qCats.eq("club_id", clubId);
        qTxsRec = qTxsRec.eq("club_id", clubId);
        qProyectos = qProyectos.eq("club_id", clubId);
        qTxProyectos = qTxProyectos.eq("club_id", clubId);
        qComprasPend = qComprasPend.eq("club_id", clubId);
        qComprasRec = qComprasRec.eq("club_id", clubId);
      }

      const [
        txsMesAct, txsMesPrev, personasRes, cuotasPeriodoRes, clubDocsRes,
        categoriasRes, txsRecRes, proyectosRes, txProyectosRes, comprasPendRes, comprasRecRes,
      ] = await Promise.all([
        qTxAct, qTxPrev, qPersonas, qCuotas, qDocs, qCats, qTxsRec,
        qProyectos, qTxProyectos, qComprasPend, qComprasRec,
      ]);

      // CAJA = Balance del mes actual (Ingresos - Egresos, excluyendo Anulado) — igual a módulo Transacciones
      const calcBalance = (rows: any[]) => {
        let ing = 0, eg = 0;
        rows.forEach((t) => {
          if (t.estado === "Anulado") return;
          const monto = Number(t.monto) || 0;
          if (String(t.tipo).toLowerCase() === "ingreso") ing += monto;
          else eg += monto;
        });
        return ing - eg;
      };
      const caja = calcBalance((txsMesAct.data as any[]) ?? []);
      const cajaPrev = calcBalance((txsMesPrev.data as any[]) ?? []);
      const cajaDelta = cajaPrev !== 0 ? ((caja - cajaPrev) / Math.abs(cajaPrev)) * 100 : null;

      // SOCIOS / CATEGORIAS
      const sociosActivos = personasRes.data?.length ?? 0;
      const cats = (categoriasRes.data as any[]) ?? [];
      const categoriasCount = cats.length;

      // MOROSIDAD — basada en cuotas del periodo (igual que CuotasMorosidad)
      const cuotasPeriodo = (cuotasPeriodoRes.data as any[]) ?? [];
      const morososIds = new Set(
        cuotasPeriodo.filter((c) => c.estado !== "pagada").map((c) => c.persona_id)
      );
      const morosos = morososIds.size;
      const morosidadPct = sociosActivos > 0 ? (morosos / sociosActivos) * 100 : 0;

      // DOCS por vencer
      const docsData = (clubDocsRes.data as any[]) ?? [];
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

      // MOROSIDAD POR CATEGORIA — agrupa cuotas del periodo por categoria_id
      const catMap: Record<string, string> = {};
      cats.forEach((c) => { catMap[c.id] = c.nombre; });
      const byCat: Record<string, { total: number; morosos: number }> = {};
      cuotasPeriodo.forEach((c) => {
        const nombre = catMap[c.categoria_id ?? ""] ?? "Sin categoría";
        if (!byCat[nombre]) byCat[nombre] = { total: 0, morosos: 0 };
        byCat[nombre].total++;
        if (c.estado !== "pagada") byCat[nombre].morosos++;
      });
      const morosidadList: MorosidadPorCategoria[] = Object.entries(byCat)
        .map(([categoria, v]) => ({ categoria, total: v.total, morosos: v.morosos }))
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
          nombre: d.nombre || d.nombre_archivo,
          tipo: d.etiqueta,
          vence: d.fecha_vencimiento,
          estado,
        };
      });
      setDocumentos(docsList);

      // TXS RECIENTES (sin anuladas)
      const txsRec = ((txsRecRes.data as any[]) ?? []).map((t) => ({
        id: t.id,
        desc: t.descripcion ?? "Sin descripción",
        monto: String(t.tipo).toLowerCase() === "ingreso" ? Number(t.monto) : -Number(t.monto),
        tipo: String(t.tipo).toLowerCase() === "ingreso" ? ("ingreso" as const) : ("egreso" as const),
        fecha: fmtFecha(t.fecha),
      }));
      setTransacciones(txsRec);

      // PROYECTOS — KPI y top 5 por % ejecución
      const proyectos = (proyectosRes.data as any[]) ?? [];
      const txProy = (txProyectosRes.data as any[]) ?? [];
      const ejecPorProy: Record<string, number> = {};
      txProy.forEach((t) => {
        const monto = Number(t.monto) || 0;
        const signo = String(t.tipo).toLowerCase() === "ingreso" ? -1 : 1; // egresos suman ejecución
        ejecPorProy[t.proyecto_id] = (ejecPorProy[t.proyecto_id] ?? 0) + signo * monto;
      });
      const activos = proyectos.filter((p) => p.estado === "activo");
      setProyectosKpi({
        activos: activos.length,
        presupuesto: activos.reduce((s, p) => s + (Number(p.presupuesto) || 0), 0),
      });
      const top: ProyectoResumen[] = proyectos
        .map((p) => {
          const ejecutado = Math.max(0, ejecPorProy[p.id] ?? 0);
          const presupuesto = Number(p.presupuesto) || 0;
          const pct = presupuesto > 0 ? (ejecutado / presupuesto) * 100 : 0;
          return { id: p.id, nombre: p.nombre, presupuesto, ejecutado, pct };
        })
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);
      setProyectosTop(top);

      // COMPRAS
      setComprasPendientes(comprasPendRes.count ?? 0);
      const compras: CompraReciente[] = ((comprasRecRes.data as any[]) ?? []).map((e) => ({
        id: e.id,
        titulo: e.solicitudes_compra?.titulo ?? "Compra",
        proveedor: e.proveedor_real,
        monto: Number(e.monto_real) || 0,
        fecha: fmtFecha(e.fecha_compra),
      }));
      setComprasRecientes(compras);

      setLoading(false);
    };

    load();
  }, [clubId]);

  return {
    loading, kpis, morosidad, documentos, transacciones,
    proyectosKpi, proyectosTop, comprasPendientes, comprasRecientes,
  };
}
