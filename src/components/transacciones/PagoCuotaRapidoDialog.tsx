import { useState, useEffect, useMemo } from "react";
import { Banknote, Search, ChevronRight, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Categoria {
  id: string;
  nombre: string;
}

interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  rut: string | null;
}

interface Cuota {
  id: string;
  periodo: string;
  monto_final: number;
  estado: string;
  fecha_vencimiento: string;
}

type Step = "buscar" | "cuotas" | "confirmar";

interface Props {
  onPaid: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function PagoCuotaRapidoDialog({ onPaid, open: openProp, onOpenChange, hideTrigger = false }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [step, setStep] = useState<Step>("buscar");

  // Step 1: search
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [catId, setCatId] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  // Step 2: cuotas
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);

  // Step 3: confirm
  const [metodoPago, setMetodoPago] = useState("Transferencia");
  const [referencia, setReferencia] = useState("");
  const [paying, setPaying] = useState(false);

  // Load categorías on open
  useEffect(() => {
    if (!open) return;
    supabase.from("categorias").select("id, nombre").order("nombre")
      .then(({ data }) => setCategorias(data || []));
  }, [open]);

  // Load personas when category changes
  useEffect(() => {
    if (!catId) { setPersonas([]); return; }
    const load = async () => {
      const { data } = await supabase
        .from("persona_categoria")
        .select("persona_id, personas!persona_categoria_persona_id_fkey(id, nombre, apellido, rut)")
        .eq("categoria_id", catId);
      if (data) {
        const p = data.map((d: any) => d.personas).filter(Boolean)
          .sort((a: any, b: any) => a.apellido.localeCompare(b.apellido));
        setPersonas(p);
      }
    };
    load();
  }, [catId]);

  // Filter personas by search
  const filteredPersonas = useMemo(() => {
    if (!busqueda) return personas;
    const q = busqueda.toLowerCase();
    return personas.filter(p =>
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
      (p.rut || "").toLowerCase().includes(q)
    );
  }, [personas, busqueda]);

  // Load cuotas for selected persona
  const loadCuotas = async (persona: Persona) => {
    setSelectedPersona(persona);
    setLoadingCuotas(true);
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("cuotas")
      .select("id, periodo, monto_final, estado, fecha_vencimiento")
      .eq("persona_id", persona.id)
      .gte("fecha_vencimiento", `${year}-01-01`)
      .lte("fecha_vencimiento", `${year}-12-31`)
      .order("fecha_vencimiento");
    setCuotas((data as Cuota[]) || []);
    setLoadingCuotas(false);
    setStep("cuotas");
  };

  const handleSelectCuota = (cuota: Cuota) => {
    if (cuota.estado === "pagada") return;
    setSelectedCuota(cuota);
    setStep("confirmar");
  };

  const handlePagar = async () => {
    if (!selectedCuota || !selectedPersona) return;
    setPaying(true);

    const { error } = await supabase.from("pagos_cuotas").insert({
      cuota_id: selectedCuota.id,
      monto_pagado: selectedCuota.monto_final,
      metodo_pago: metodoPago,
      referencia: referencia || null,
      fecha_pago: new Date().toISOString().split("T")[0],
    });

    setPaying(false);
    if (error) {
      toast.error("Error al registrar pago: " + error.message);
      return;
    }

    toast.success(`Pago registrado: ${selectedPersona.nombre} ${selectedPersona.apellido} — ${selectedCuota.periodo}`);
    resetAll();
    setOpen(false);
    onPaid();
  };

  const resetAll = () => {
    setStep("buscar");
    setCatId("");
    setBusqueda("");
    setSelectedPersona(null);
    setCuotas([]);
    setSelectedCuota(null);
    setMetodoPago("Transferencia");
    setReferencia("");
  };

  const catNombre = categorias.find(c => c.id === catId)?.nombre || "";

  const estadoBadge = (estado: string) => {
    if (estado === "pagada") return "outline" as const;
    if (estado === "vencida") return "destructive" as const;
    return "secondary" as const;
  };

  const estadoLabel = (estado: string) => {
    if (estado === "pagada") return "Pagada";
    if (estado === "vencida") return "Vencida";
    if (estado === "parcial") return "Parcial";
    return "Pendiente";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetAll(); }}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Banknote className="w-4 h-4" />
            Pago Cuota
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            {step === "buscar" && "Pago Rápido de Cuota"}
            {step === "cuotas" && (
              <span className="flex items-center gap-1">
                <button onClick={() => setStep("buscar")} className="hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                Cuotas de {selectedPersona?.nombre} {selectedPersona?.apellido}
              </span>
            )}
            {step === "confirmar" && (
              <span className="flex items-center gap-1">
                <button onClick={() => setStep("cuotas")} className="hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                Confirmar Pago
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: Search player */}
        {step === "buscar" && (
          <div className="space-y-4 py-2">
            <div className="grid gap-1.5">
              <Label>Categoría</Label>
              <Select value={catId} onValueChange={(v) => { setCatId(v); setBusqueda(""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {personas.length > 0 && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o RUT..."
                    className="pl-9"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="border border-border rounded-lg max-h-[300px] overflow-y-auto divide-y divide-border">
                  {filteredPersonas.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">Sin resultados</p>
                  ) : (
                    filteredPersonas.map(p => (
                      <button
                        key={p.id}
                        onClick={() => loadCuotas(p)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.apellido}, {p.nombre}</p>
                          <p className="text-xs text-muted-foreground">{p.rut || "Sin RUT"}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {catId && personas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay jugadoras en esta categoría</p>
            )}
          </div>
        )}

        {/* STEP 2: Select cuota */}
        {step === "cuotas" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{catNombre}</Badge>
              <span>•</span>
              <span>Año {new Date().getFullYear()}</span>
            </div>

            {loadingCuotas ? (
              <p className="text-center text-muted-foreground py-8">Cargando cuotas...</p>
            ) : cuotas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay cuotas generadas para este año.</p>
            ) : (
              <div className="border border-border rounded-lg divide-y divide-border">
                {cuotas.map(c => {
                  const isPaid = c.estado === "pagada";
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCuota(c)}
                      disabled={isPaid}
                      className={`w-full flex items-center justify-between p-3 transition-colors text-left ${
                        isPaid ? "opacity-50 cursor-not-allowed bg-muted/20" : "hover:bg-muted/50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isPaid ? (
                          <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-success" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-border" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.periodo}</p>
                          <p className="text-xs text-muted-foreground">Vence: {c.fecha_vencimiento}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          ${c.monto_final.toLocaleString("es-CL")}
                        </span>
                        <Badge variant={estadoBadge(c.estado)} className="text-xs">
                          {estadoLabel(c.estado)}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Confirm payment */}
        {step === "confirmar" && selectedCuota && selectedPersona && (
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Jugadora</span>
                <span className="font-medium text-foreground">{selectedPersona.apellido}, {selectedPersona.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Período</span>
                <span className="font-medium text-foreground">{selectedCuota.periodo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-mono font-bold text-lg text-foreground">${selectedCuota.monto_final.toLocaleString("es-CL")}</span>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Método de Pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Nº Referencia (opcional)</Label>
              <Input
                placeholder="Ej: Transferencia #12345"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
              />
            </div>

            <Button className="w-full gap-2" onClick={handlePagar} disabled={paying}>
              {paying ? "Registrando..." : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar Pago — ${selectedCuota.monto_final.toLocaleString("es-CL")}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
