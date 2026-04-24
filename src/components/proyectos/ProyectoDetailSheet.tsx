import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, Link2, Unlink, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  proyectoId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: (p: any) => void;
  onChanged: () => void;
}

interface RendicionRow {
  fecha: string;
  descripcion: string;
  proveedor: string;
  rut_proveedor: string;
  monto: number;
  comprobante_path: string | null;
  numero_comprobante: string | null;
  tx_id: string;
}

export default function ProyectoDetailSheet({ proyectoId, open, onOpenChange, onEdit, onChanged }: Props) {
  const [proyecto, setProyecto] = useState<any>(null);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [rendicion, setRendicion] = useState<RendicionRow[]>([]);

  const load = async () => {
    if (!proyectoId) return;
    const { data: p } = await supabase.from("proyectos").select("*").eq("id", proyectoId).single();
    setProyecto(p);
    const { data: txs } = await supabase
      .from("transacciones")
      .select("id, fecha, descripcion, tipo, monto, estado, categoria, origen_tipo, origen_id, referencia, notas")
      .eq("proyecto_id", proyectoId)
      .order("fecha", { ascending: false });
    const txList = txs ?? [];
    setTransacciones(txList);

    // Build rendición rows: enrich egresos with proveedor info from ejecuciones_compra
    const egresos = txList.filter((t: any) => t.tipo === "Egreso" && t.estado !== "Anulado");
    const compraIds = egresos
      .filter((t: any) => t.origen_tipo === "compra" && t.origen_id)
      .map((t: any) => t.origen_id);

    let ejecMap = new Map<string, any>();
    let provMap = new Map<string, any>();

    if (compraIds.length > 0) {
      const { data: ejecs } = await supabase
        .from("ejecuciones_compra")
        .select("solicitud_id, proveedor_real, comprobante_path, numero_comprobante")
        .in("solicitud_id", compraIds);
      (ejecs ?? []).forEach((e: any) => ejecMap.set(e.solicitud_id, e));

      // Try to lookup provider RUT by name
      const provNames = [...new Set((ejecs ?? []).map((e: any) => e.proveedor_real).filter(Boolean))];
      if (provNames.length > 0) {
        const { data: provs } = await supabase
          .from("proveedores")
          .select("nombre, rut")
          .in("nombre", provNames);
        (provs ?? []).forEach((p: any) => provMap.set(p.nombre, p.rut));
      }
    }

    const rend: RendicionRow[] = egresos.map((t: any) => {
      const ejec = t.origen_id ? ejecMap.get(t.origen_id) : null;
      const proveedor = ejec?.proveedor_real ?? "—";
      const rut = provMap.get(proveedor) ?? "—";
      return {
        fecha: t.fecha,
        descripcion: t.descripcion,
        proveedor,
        rut_proveedor: rut,
        monto: Number(t.monto || 0),
        comprobante_path: ejec?.comprobante_path ?? null,
        numero_comprobante: ejec?.numero_comprobante ?? t.referencia ?? null,
        tx_id: t.id,
      };
    });
    setRendicion(rend);

    const { data: libres } = await supabase
      .from("transacciones")
      .select("id, fecha, descripcion, tipo, monto, categoria, subcategoria")
      .is("proyecto_id", null)
      .or("categoria.ilike.%compra%,categoria.ilike.%proyecto%,subcategoria.ilike.%proyecto%")
      .order("fecha", { ascending: false })
      .limit(100);
    setDisponibles(libres ?? []);
  };

  useEffect(() => { if (open) load(); }, [open, proyectoId]);

  if (!proyecto) return null;

  const ejecutado = transacciones
    .filter((t) => t.tipo === "Egreso")
    .reduce((s, t) => s + Number(t.monto || 0), 0);
  const pct = proyecto.presupuesto > 0 ? Math.round((ejecutado / proyecto.presupuesto) * 100) : 0;
  const totalRendido = rendicion.reduce((s, r) => s + r.monto, 0);

  const vincular = async (txId: string) => {
    const { error } = await supabase.from("transacciones").update({ proyecto_id: proyectoId }).eq("id", txId);
    if (error) return toast.error(error.message);
    toast.success("Transacción vinculada");
    load(); onChanged();
  };
  const desvincular = async (txId: string) => {
    const { error } = await supabase.from("transacciones").update({ proyecto_id: null }).eq("id", txId);
    if (error) return toast.error(error.message);
    toast.success("Transacción desvinculada");
    load(); onChanged();
  };
  const eliminar = async () => {
    const { error } = await supabase.from("proyectos").delete().eq("id", proyecto.id);
    if (error) return toast.error(error.message);
    toast.success("Proyecto eliminado");
    onChanged(); onOpenChange(false);
  };

  const descargarComprobante = async (path: string) => {
    const { data, error } = await supabase.storage.from("documentos").download(path);
    if (error) {
      // fallback: try public URL
      const { data: pub } = supabase.storage.from("documentos").getPublicUrl(path);
      if (pub?.publicUrl) {
        window.open(pub.publicUrl, "_blank");
        return;
      }
      return toast.error("No se pudo descargar el comprobante");
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() ?? "comprobante";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarExcel = () => {
    if (rendicion.length === 0) {
      toast.error("No hay transacciones para rendir");
      return;
    }
    const headers = [
      "N°", "Fecha", "Descripción", "Proveedor", "RUT Proveedor",
      "N° Comprobante", "Monto CLP", "Tiene Comprobante",
    ];
    const rows = rendicion.map((r, i) => [
      i + 1,
      r.fecha,
      r.descripcion,
      r.proveedor,
      r.rut_proveedor,
      r.numero_comprobante ?? "—",
      r.monto,
      r.comprobante_path ? "Sí" : "No",
    ]);

    const summary = [
      [],
      ["RESUMEN DE RENDICIÓN"],
      ["Proyecto", proyecto.nombre],
      ["Fuente de financiamiento", proyecto.fuente_financiamiento ?? "—"],
      ["Presupuesto total (CLP)", Number(proyecto.presupuesto) || 0],
      ["Total ejecutado (CLP)", totalRendido],
      ["Saldo (CLP)", (Number(proyecto.presupuesto) || 0) - totalRendido],
      ["% Ejecución", `${pct}%`],
      ["Cantidad de gastos", rendicion.length],
      ["Período", `${proyecto.fecha_inicio ?? "—"} a ${proyecto.fecha_fin ?? "—"}`],
      ["Generado", new Date().toLocaleDateString("es-CL")],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, ...summary]);
    // Column widths
    ws["!cols"] = [
      { wch: 4 }, { wch: 12 }, { wch: 40 }, { wch: 28 }, { wch: 14 },
      { wch: 16 }, { wch: 14 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rendición");
    const safeName = proyecto.nombre.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
    XLSX.writeFile(wb, `Rendicion_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel generado");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle>{proyecto.nombre}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">{proyecto.fuente_financiamiento ?? proyecto.tipo}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => onEdit(proyecto)}><Pencil className="w-4 h-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                    <AlertDialogDescription>Las transacciones vinculadas quedarán sin proyecto. Esta acción no se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={eliminar}>Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Estado:</span> <Badge variant="secondary">{proyecto.estado}</Badge></div>
            <div><span className="text-muted-foreground">Inicio:</span> {proyecto.fecha_inicio ?? "—"}</div>
            <div><span className="text-muted-foreground">Término:</span> {proyecto.fecha_fin ?? "—"}</div>
            <div><span className="text-muted-foreground">Transacciones:</span> {transacciones.length}</div>
          </div>
          {proyecto.descripcion && <p className="text-sm text-muted-foreground">{proyecto.descripcion}</p>}

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ejecutado</span>
              <span className="font-mono">${ejecutado.toLocaleString("es-CL")} / ${Number(proyecto.presupuesto).toLocaleString("es-CL")}</span>
            </div>
            <Progress value={Math.min(pct, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground text-right">{pct}% ejecutado</div>
          </div>

          <Tabs defaultValue="vinculadas">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="vinculadas">Vinculadas ({transacciones.length})</TabsTrigger>
              <TabsTrigger value="rendicion">Rendición ({rendicion.length})</TabsTrigger>
              <TabsTrigger value="disponibles">Vincular nuevas</TabsTrigger>
            </TabsList>

            <TabsContent value="vinculadas" className="space-y-2 mt-3">
              {transacciones.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin transacciones vinculadas</p>}
              {transacciones.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{t.fecha} · {t.categoria}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-xs ${t.tipo === "Egreso" ? "text-destructive" : "text-emerald-600"}`}>
                      {t.tipo === "Egreso" ? "-" : "+"}${Number(t.monto).toLocaleString("es-CL")}
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => desvincular(t.id)}><Unlink className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="rendicion" className="space-y-3 mt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Tabla lista para adjuntar a rendición pública (Fondeporte / IND / Municipalidad).
                </p>
                <Button size="sm" onClick={exportarExcel} disabled={rendicion.length === 0} className="gap-2 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Excel
                </Button>
              </div>

              {rendicion.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                  Aún no hay egresos registrados para este proyecto.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left p-2 font-medium text-muted-foreground">Fecha</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">Descripción</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">Proveedor</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">RUT</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Monto</th>
                          <th className="text-center p-2 font-medium text-muted-foreground">Comprobante</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rendicion.map((r, i) => (
                          <tr key={r.tx_id} className={i % 2 ? "bg-muted/20" : ""}>
                            <td className="p-2 font-mono text-muted-foreground whitespace-nowrap">{r.fecha}</td>
                            <td className="p-2">{r.descripcion}</td>
                            <td className="p-2">{r.proveedor}</td>
                            <td className="p-2 font-mono text-muted-foreground">{r.rut_proveedor}</td>
                            <td className="p-2 text-right font-mono">${r.monto.toLocaleString("es-CL")}</td>
                            <td className="p-2 text-center">
                              {r.comprobante_path ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => descargarComprobante(r.comprobante_path!)}
                                  title="Descargar comprobante"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/40 font-medium">
                        <tr>
                          <td colSpan={4} className="p-2 text-right">Total rendido</td>
                          <td className="p-2 text-right font-mono">${totalRendido.toLocaleString("es-CL")}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="disponibles" className="space-y-2 mt-3">
              {disponibles.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay compras o gastos de proyectos sin vincular</p>}
              {disponibles.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{t.descripcion}</p>
                    <p className="text-xs text-muted-foreground">{t.fecha} · {t.categoria}{t.subcategoria ? ` / ${t.subcategoria}` : ""} · ${Number(t.monto).toLocaleString("es-CL")}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => vincular(t.id)} className="gap-1">
                    <Link2 className="w-3 h-3" /> Vincular
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
