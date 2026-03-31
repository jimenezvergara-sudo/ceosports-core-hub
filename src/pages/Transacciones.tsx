import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import PageShell from "@/components/shared/PageShell";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import NuevaTransaccionDialog from "@/components/transacciones/NuevaTransaccionDialog";
import TransaccionDetailSheet from "@/components/transacciones/TransaccionDetailSheet";

interface Transaccion {
  id: string;
  fecha: string;
  tipo: string;
  categoria: string;
  subcategoria: string | null;
  descripcion: string;
  monto: number;
  estado: string;
  metodo_pago: string | null;
  referencia: string | null;
  notas: string | null;
  categoria_deportiva: string | null;
  persona_id: string | null;
  created_at: string;
}

export default function Transacciones() {
  const [txs, setTxs] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null);

  const fetchTxs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transacciones")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(100);
    setTxs((data as unknown as Transaccion[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  const totalIngresos = txs
    .filter((t) => t.tipo === "Ingreso" && t.estado !== "Anulado")
    .reduce((s, t) => s + t.monto, 0);
  const totalEgresos = txs
    .filter((t) => t.tipo === "Egreso" && t.estado !== "Anulado")
    .reduce((s, t) => s + t.monto, 0);
  const balance = totalIngresos - totalEgresos;

  return (
    <PageShell
      title="Transacciones"
      description="Registro de ingresos y egresos del club"
      icon={ArrowLeftRight}
      actions={<NuevaTransaccionDialog onCreated={fetchTxs} />}
    >
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Ingresos", value: totalIngresos, color: "text-success" },
          { label: "Egresos", value: totalEgresos, color: "text-destructive" },
          {
            label: "Balance",
            value: balance,
            color: balance >= 0 ? "text-success" : "text-destructive",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card border border-border rounded-lg p-4"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p className={`text-xl font-mono font-bold ${item.color}`}>
              ${item.value.toLocaleString("es-CL")}
            </p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Descripción
                </th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Ítem
                </th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-right p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Monto
                </th>
                <th className="text-left p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Cargando...
                  </td>
                </tr>
              ) : txs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No hay transacciones registradas. Usa el botón "Nueva Transacción" para comenzar.
                  </td>
                </tr>
              ) : (
                txs.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {tx.fecha}
                    </td>
                    <td className="p-3 text-foreground">{tx.descripcion}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="secondary" className="text-xs w-fit">
                          {tx.categoria}
                        </Badge>
                        {tx.subcategoria && (
                          <span className="text-[11px] text-muted-foreground">
                            {tx.subcategoria}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          tx.tipo === "Ingreso" ? "outline" : "destructive"
                        }
                        className="text-xs"
                      >
                        {tx.tipo}
                      </Badge>
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-medium ${
                        tx.tipo === "Ingreso"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {tx.tipo === "Ingreso" ? "+" : "-"}$
                      {tx.monto.toLocaleString("es-CL")}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          tx.estado === "Pagado"
                            ? "outline"
                            : tx.estado === "Anulado"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {tx.estado}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <TransaccionDetailSheet
        transaccion={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => !open && setSelectedTx(null)}
      />
    </PageShell>
  );
}
