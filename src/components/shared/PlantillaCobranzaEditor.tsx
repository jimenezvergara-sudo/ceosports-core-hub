import { useEffect, useRef, useState } from "react";
import { Eye, Save, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const DEFAULT_PLANTILLA =
  "Hola {nombre} 👋, te recordamos que tienes {cuotas} cuota(s) pendiente(s) por un total de {monto} en {club}. Si ya pagaste, por favor envíanos el comprobante. ¡Gracias!";

const VARIABLES = [
  { key: "{nombre}", desc: "Nombre del apoderado o socio" },
  { key: "{periodo}", desc: "Periodos adeudados" },
  { key: "{monto}", desc: "Monto total adeudado" },
  { key: "{club}", desc: "Nombre del club" },
  { key: "{cuotas}", desc: "Cantidad de cuotas impagas" },
  { key: "{categoria}", desc: "Categoría del deportista" },
];

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

interface Props {
  /** Si es true, muestra solo el textarea + botón guardar (modo compacto para Morosos) */
  compact?: boolean;
  /** Callback cuando se guarda exitosamente la plantilla */
  onSaved?: (plantilla: string) => void;
}

export default function PlantillaCobranzaEditor({ compact = false, onSaved }: Props) {
  const { clubId, clubActual } = useAuth();
  const [plantilla, setPlantilla] = useState(DEFAULT_PLANTILLA);
  const [inicial, setInicial] = useState(DEFAULT_PLANTILLA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!clubId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("clubs")
        .select("plantilla_cobranza_whatsapp")
        .eq("id", clubId)
        .single();
      const tpl = (data as any)?.plantilla_cobranza_whatsapp || DEFAULT_PLANTILLA;
      setPlantilla(tpl);
      setInicial(tpl);
      setLoading(false);
    })();
  }, [clubId]);

  const insertVariable = (v: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setPlantilla((p) => p + v);
      return;
    }
    const start = ta.selectionStart ?? plantilla.length;
    const end = ta.selectionEnd ?? plantilla.length;
    const nuevo = plantilla.slice(0, start) + v + plantilla.slice(end);
    setPlantilla(nuevo);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + v.length, start + v.length);
    });
  };

  const guardar = async () => {
    if (!clubId) return;
    setSaving(true);
    const { error } = await supabase
      .from("clubs")
      .update({ plantilla_cobranza_whatsapp: plantilla } as any)
      .eq("id", clubId);
    setSaving(false);
    if (error) {
      toast.error("Error al guardar la plantilla");
      return;
    }
    setInicial(plantilla);
    toast.success("Plantilla guardada");
  };

  const buildPreview = () =>
    plantilla
      .replace(/\{nombre\}/g, "María González")
      .replace(/\{cuotas\}/g, "2")
      .replace(/\{monto\}/g, fmtCLP(45000))
      .replace(/\{categoria\}/g, "U13 Femenino")
      .replace(/\{periodo\}/g, "2025-03, 2025-04")
      .replace(/\{club\}/g, clubActual?.nombre ?? "Club Deportivo");

  const dirty = plantilla !== inicial;

  if (compact) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Plantilla de mensaje WhatsApp
          </label>
          <Button
            size="sm"
            onClick={guardar}
            disabled={!dirty || saving || loading}
            className="gap-1.5 h-7 text-xs"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Guardar plantilla
          </Button>
        </div>
        <Textarea
          ref={textareaRef}
          value={plantilla}
          onChange={(e) => setPlantilla(e.target.value)}
          rows={2}
          className="text-sm"
          disabled={loading}
        />
        <p className="text-[11px] text-muted-foreground">
          Variables: <code>{"{nombre}"}</code> · <code>{"{cuotas}"}</code> ·{" "}
          <code>{"{monto}"}</code> · <code>{"{categoria}"}</code> · <code>{"{periodo}"}</code> ·{" "}
          <code>{"{club}"}</code>
        </p>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-success" />
            Plantilla de cobranza por WhatsApp
          </CardTitle>
          <CardDescription>
            Personaliza el mensaje que se envía a los apoderados con cuotas pendientes desde el módulo
            Cuotas → Morosos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Variables clicables */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Variables disponibles (haz clic para insertar)
            </p>
            <div className="flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  title={v.desc}
                  className="group"
                >
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-xs"
                  >
                    {v.key}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Mensaje
            </label>
            <Textarea
              ref={textareaRef}
              value={plantilla}
              onChange={(e) => setPlantilla(e.target.value)}
              rows={5}
              className="text-sm font-mono"
              disabled={loading}
              placeholder="Escribe aquí tu mensaje usando las variables..."
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={loading}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Vista previa
            </Button>
            <Button onClick={guardar} disabled={!dirty || saving || loading} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vista previa */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-success" />
              Vista previa del mensaje
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Ejemplo con datos ficticios (María González, 2 cuotas, $45.000):
            </p>
            <div className="bg-success/10 border border-success/20 rounded-2xl rounded-tl-sm p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {buildPreview()}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Así verá el mensaje el destinatario en WhatsApp
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
