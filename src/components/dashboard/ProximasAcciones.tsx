import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ShoppingCart, Calendar, FileWarning, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface AccionItem {
  id: string;
  icon: typeof AlertCircle;
  iconClass: string;
  title: string;
  detail: string;
  to: string;
}

/**
 * Sección "Próximas acciones" del Dashboard.
 * Adaptada por rol:
 *  - admin: ve todo (cuotas vencidas, compras pendientes, asambleas, documentos)
 *  - staff/coach: solo asambleas y documentos
 *  - viewer/fan: no se muestra (el componente devuelve null)
 */
export default function ProximasAcciones() {
  const { clubId, rolSistema } = useAuth();
  const [acciones, setAcciones] = useState<AccionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = rolSistema === "admin";
  const isStaff = rolSistema === "staff" || rolSistema === "coach";
  const isViewer = !isAdmin && !isStaff;

  useEffect(() => {
    if (!clubId || isViewer) { setLoading(false); return; }

    const load = async () => {
      const items: AccionItem[] = [];
      const today = new Date();
      const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().split("T")[0];
      const in30Str = in30.toISOString().split("T")[0];

      // Solo admin: cuotas y compras
      if (isAdmin) {
        const { count: cuotasVencidas } = await supabase
          .from("cuotas")
          .select("id", { count: "exact", head: true })
          .eq("club_id", clubId)
          .in("estado", ["vencida", "pendiente"])
          .lt("fecha_vencimiento", todayStr);

        if ((cuotasVencidas ?? 0) > 0) {
          items.push({
            id: "cuotas-vencidas",
            icon: AlertCircle,
            iconClass: "bg-destructive/15 text-destructive",
            title: `${cuotasVencidas} cuota${cuotasVencidas! > 1 ? "s" : ""} vencida${cuotasVencidas! > 1 ? "s" : ""}`,
            detail: "Gestiona los pagos pendientes con WhatsApp",
            to: "/cuotas?tab=morosos",
          });
        }

        const { count: comprasPendientes } = await supabase
          .from("solicitudes_compra" as any)
          .select("id", { count: "exact", head: true })
          .eq("club_id", clubId)
          .in("estado", ["pendiente", "en_revision", "aprobada"]);

        if ((comprasPendientes ?? 0) > 0) {
          items.push({
            id: "compras-pendientes",
            icon: ShoppingCart,
            iconClass: "bg-warning/15 text-warning-foreground",
            title: `${comprasPendientes} compra${comprasPendientes! > 1 ? "s" : ""} por gestionar`,
            detail: "Revisa solicitudes y aprobaciones",
            to: "/compras",
          });
        }
      }

      // Admin y staff: asambleas y documentos
      const { data: asambleas } = await supabase
        .from("asambleas" as any)
        .select("id, titulo, fecha")
        .eq("club_id", clubId)
        .gte("fecha", todayStr)
        .lte("fecha", in30Str)
        .order("fecha")
        .limit(1);

      if (asambleas && asambleas.length > 0) {
        const a: any = asambleas[0];
        items.push({
          id: "asamblea-prox",
          icon: Calendar,
          iconClass: "bg-primary/15 text-primary",
          title: `Asamblea: ${a.titulo}`,
          detail: `Programada para ${new Date(a.fecha).toLocaleDateString("es-CL", { day: "numeric", month: "long" })}`,
          to: "/asambleas",
        });
      }

      const { count: docsPorVencer } = await supabase
        .from("documentos")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .gte("fecha_vencimiento", todayStr)
        .lte("fecha_vencimiento", in30Str);

      if ((docsPorVencer ?? 0) > 0) {
        items.push({
          id: "docs-vencer",
          icon: FileWarning,
          iconClass: "bg-warning/15 text-warning-foreground",
          title: `${docsPorVencer} documento${docsPorVencer! > 1 ? "s" : ""} por vencer`,
          detail: "Revisa los próximos 30 días",
          to: "/documentos",
        });
      }

      setAcciones(items);
      setLoading(false);
    };

    load();
  }, [clubId, isAdmin, isStaff, isViewer]);

  if (isViewer) return null;
  if (loading) return null;
  if (acciones.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl p-5 shadow-card"
    >
      <h3 className="text-foreground font-semibold mb-3 text-sm">Próximas acciones</h3>
      <div className="space-y-2">
        {acciones.map((a, i) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.id}
              to={a.to}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/40 hover:bg-muted/40 hover:border-border transition-all group"
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.iconClass}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
