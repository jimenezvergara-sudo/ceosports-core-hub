import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Banknote, Upload, CheckCircle2, AlertCircle, HelpCircle, Loader2, FileSpreadsheet } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type TipoMatch = "auto" | "posible" | "ninguno";
interface Movimiento { fecha: string; monto: number; glosa: string; tipo: string }
interface Candidata {
  cuota_id: string; persona_id: string; persona_nombre: string;
  apoderado_nombre: string | null; apoderado_rut: string | null;
  monto_final: number; periodo: string; fecha_vencimiento: string;
}
interface Resultado {
  movimiento: Movimiento;
  tipo_match: TipoMatch;
  cuota_match?: Candidata;
  candidatos?: Candidata[];
}

const fmtCLP = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function ReconciliacionBancariaDialog() {
  const { clubId, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analisis, setAnalisis] = useState<{
    banco: string; resultados: Resultado[]; stats: { total: number; auto: number; posibles: number; ninguno: number };
  } | null>(null);
  const [seleccionados, setSeleccionados] = useState<Record<number, string>>({}); // index → cuota_id
  const [resultadoFinal, setResultadoFinal] = useState<{ conciliadas: number; monto_total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload"); setFile(null); setAnalisis(null);
    setSeleccionados({}); setResultadoFinal(null);
  };

  const handleFile = (f: File | null) => {
    setFile(f);
  };

  const analizar = async () => {
    if (!file || !clubId) return;
    setLoading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: "" });

      const { data, error } = await supabase.functions.invoke("reconciliacion-banco", {
        body: { action: "analizar", club_id: clubId, filas, nombre_archivo: file.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalisis(data);
      // Pre-seleccionar todos los matches automáticos
      const pre: Record<number, string> = {};
      data.resultados.forEach((r: Resultado, idx: number) => {
        if (r.tipo_match === "auto" && r.cuota_match) pre[idx] = r.cuota_match.cuota_id;
      });
      setSeleccionados(pre);
      setStep("review");
    } catch (e: any) {
      toast.error(e.message ?? "Error al analizar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const confirmar = async () => {
    if (!analisis || !clubId) return;
    setLoading(true);
    try {
      const matches_confirmados = Object.entries(seleccionados)
        .filter(([, cuotaId]) => !!cuotaId)
        .map(([idx, cuotaId]) => {
          const r = analisis.resultados[Number(idx)];
          return {
            cuota_id: cuotaId,
            monto: r.movimiento.monto,
            fecha: r.movimiento.fecha,
            glosa: r.movimiento.glosa,
          };
        });

      if (matches_confirmados.length === 0) {
        toast.warning("No hay matches seleccionados para confirmar");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("reconciliacion-banco", {
        body: {
          action: "confirmar",
          club_id: clubId,
          matches_confirmados,
          nombre_archivo: file?.name,
          banco: analisis.banco,
          stats: analisis.stats,
          user_id: user?.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResultadoFinal({ conciliadas: data.conciliadas, monto_total: data.monto_total });
      setStep("done");
      toast.success(`${data.conciliadas} cuotas conciliadas`);
    } catch (e: any) {
      toast.error(e.message ?? "Error al confirmar");
    } finally {
      setLoading(false);
    }
  };

  const auto = analisis?.resultados.filter((r) => r.tipo_match === "auto") ?? [];
  const posibles = analisis?.resultados.filter((r) => r.tipo_match === "posible") ?? [];
  const ninguno = analisis?.resultados.filter((r) => r.tipo_match === "ninguno") ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Banknote className="h-4 w-4" />
          Reconciliar con banco
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" /> Reconciliación bancaria automática
          </DialogTitle>
          <DialogDescription>
            Sube el extracto bancario (Excel/CSV) y el sistema cruzará los depósitos con cuotas pendientes.
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="space-y-4 flex-1 overflow-auto">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle>Formatos compatibles</AlertTitle>
              <AlertDescription className="text-xs">
                Excel (.xlsx, .xls) o CSV de Banco Estado, Banco de Chile, Santander, BCI, Scotiabank y otros.
                Detectamos automáticamente las columnas (fecha, abono, glosa).
              </AlertDescription>
            </Alert>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{file ? file.name : "Haz clic para seleccionar el archivo"}</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv (máx. 10 MB)</p>
              <Input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={analizar} disabled={!file || loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analizando...</> : "Analizar archivo"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 2: REVIEW */}
        {step === "review" && analisis && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Card className="p-3">
                <p className="text-xs text-muted-foreground">Banco</p>
                <p className="font-semibold text-sm">{analisis.banco}</p>
              </Card>
              <Card className="p-3 bg-success/5 border-success/20">
                <p className="text-xs text-muted-foreground">Identificados</p>
                <p className="font-semibold text-success">{analisis.stats.auto}</p>
              </Card>
              <Card className="p-3 bg-warning/5 border-warning/20">
                <p className="text-xs text-muted-foreground">Posibles</p>
                <p className="font-semibold text-warning">{analisis.stats.posibles}</p>
              </Card>
              <Card className="p-3 bg-destructive/5 border-destructive/20">
                <p className="text-xs text-muted-foreground">No identif.</p>
                <p className="font-semibold text-destructive">{analisis.stats.ninguno}</p>
              </Card>
            </div>

            <ScrollArea className="flex-1 pr-3 -mr-3">
              <div className="space-y-4">
                {/* AUTO */}
                {auto.length > 0 && (
                  <section>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" /> Identificados automáticamente ({auto.length})
                    </h3>
                    <div className="space-y-2">
                      {auto.map((r) => {
                        const idx = analisis.resultados.indexOf(r);
                        return (
                          <Card key={idx} className="p-3 border-success/30">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={!!seleccionados[idx]}
                                onCheckedChange={(v) => setSeleccionados((s) => {
                                  const next = { ...s };
                                  if (v) next[idx] = r.cuota_match!.cuota_id;
                                  else delete next[idx];
                                  return next;
                                })}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium truncate">{r.cuota_match!.persona_nombre}</p>
                                  <Badge variant="outline" className="font-mono text-xs">{fmtCLP(r.movimiento.monto)}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{r.movimiento.glosa}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Cuota {r.cuota_match!.periodo} · {r.movimiento.fecha}
                                </p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* POSIBLES */}
                {posibles.length > 0 && (
                  <section>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-warning" /> Posibles coincidencias ({posibles.length})
                    </h3>
                    <div className="space-y-2">
                      {posibles.map((r) => {
                        const idx = analisis.resultados.indexOf(r);
                        return (
                          <Card key={idx} className="p-3 border-warning/30">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{r.movimiento.glosa}</p>
                                <p className="text-xs text-muted-foreground">{r.movimiento.fecha}</p>
                              </div>
                              <Badge variant="outline" className="font-mono text-xs">{fmtCLP(r.movimiento.monto)}</Badge>
                            </div>
                            <Label className="text-xs">Asignar a:</Label>
                            <Select
                              value={seleccionados[idx] ?? ""}
                              onValueChange={(v) => setSeleccionados((s) => {
                                const next = { ...s };
                                if (v) next[idx] = v; else delete next[idx];
                                return next;
                              })}
                            >
                              <SelectTrigger className="h-8 text-xs mt-1">
                                <SelectValue placeholder="-- Sin asignar --" />
                              </SelectTrigger>
                              <SelectContent>
                                {(r.candidatos ?? []).map((c) => (
                                  <SelectItem key={c.cuota_id} value={c.cuota_id} className="text-xs">
                                    {c.persona_nombre} · {c.periodo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* NINGUNO */}
                {ninguno.length > 0 && (
                  <section>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" /> No identificados ({ninguno.length})
                    </h3>
                    <div className="space-y-1">
                      {ninguno.map((r, i) => (
                        <Card key={i} className="p-2 bg-muted/30">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate text-muted-foreground">{r.movimiento.glosa}</span>
                            <span className="font-mono">{fmtCLP(r.movimiento.monto)}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-3">
              <Button variant="ghost" onClick={reset}>Cancelar</Button>
              <Button onClick={confirmar} disabled={loading || Object.keys(seleccionados).length === 0}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</> : `Confirmar ${Object.keys(seleccionados).length} pagos`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: DONE */}
        {step === "done" && resultadoFinal && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
            <div>
              <h3 className="font-semibold text-lg">Reconciliación completada</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {resultadoFinal.conciliadas} cuotas marcadas como pagadas por un total de {fmtCLP(resultadoFinal.monto_total)}
              </p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => { setOpen(false); reset(); }}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
