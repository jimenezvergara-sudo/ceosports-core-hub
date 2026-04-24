import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Phone, Search, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DEFAULT_PLANTILLA =
  "Hola {nombre} 👋, te recordamos que tienes {cuotas} cuota(s) pendiente(s) por un total de {monto} en {club}. Si ya pagaste, por favor envíanos el comprobante. ¡Gracias!";

interface MorosoRow {
  persona_id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  categoria: string;
  apoderado_id: string | null;
  apoderado_nombre: string | null;
  apoderado_telefono: string | null;
  cuotas_impagas: number;
  monto_adeudado: number;
  periodos: string[];
}

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

/** Limpia un teléfono CL para wa.me: deja solo dígitos y agrega 56 si falta */
const toWaNumber = (raw: string | null): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("56")) return digits;
  if (digits.length === 9) return `56${digits}`; // móvil chileno
  if (digits.length === 8) return `569${digits}`;
  return digits;
};

export default function MorososAccionable() {
  const { clubActual, clubId, rolSistema } = useAuth();
  const [loading, setLoading] = useState(true);
  const [morosos, setMorosos] = useState<MorosoRow[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [plantilla, setPlantilla] = useState(DEFAULT_PLANTILLA);
  const [plantillaInicial, setPlantillaInicial] = useState(DEFAULT_PLANTILLA);
  const [savingPlantilla, setSavingPlantilla] = useState(false);

  const isAdmin = rolSistema === "admin";

  // Cargar plantilla guardada del club
  useEffect(() => {
    if (!clubId) return;
    (async () => {
      const { data } = await supabase
        .from("clubs")
        .select("plantilla_cobranza_whatsapp")
        .eq("id", clubId)
        .single();
      const tpl = (data as any)?.plantilla_cobranza_whatsapp || DEFAULT_PLANTILLA;
      setPlantilla(tpl);
      setPlantillaInicial(tpl);
    })();
  }, [clubId]);

  const guardarPlantilla = async () => {
    if (!clubId) return;
    setSavingPlantilla(true);
    const { error } = await supabase
      .from("clubs")
      .update({ plantilla_cobranza_whatsapp: plantilla } as any)
      .eq("id", clubId);
    setSavingPlantilla(false);
    if (error) { toast.error("Error al guardar la plantilla"); return; }
    setPlantillaInicial(plantilla);
    toast.success("Plantilla guardada");
  };

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);

      // Cuotas no pagadas
      const { data: cuotas } = await supabase
        .from("cuotas")
        .select("id, persona_id, apoderado_id, categoria_id, monto_final, estado, periodo")
        .in("estado", ["pendiente", "vencida", "parcial"]);

      const rows = (cuotas as any[]) ?? [];
      if (rows.length === 0) {
        setMorosos([]);
        setLoading(false);
        return;
      }

      const personaIds = [...new Set(rows.map((r) => r.persona_id))];
      const apoderadoIds = [...new Set(rows.map((r) => r.apoderado_id).filter(Boolean))];
      const catIds = [...new Set(rows.map((r) => r.categoria_id).filter(Boolean))];

      const [{ data: personas }, { data: apoderados }, { data: cats }] = await Promise.all([
        supabase.from("personas").select("id, nombre, apellido, telefono").in("id", personaIds),
        apoderadoIds.length
          ? supabase.from("personas").select("id, nombre, apellido, telefono").in("id", apoderadoIds)
          : Promise.resolve({ data: [] as any[] }),
        catIds.length
          ? supabase.from("categorias").select("id, nombre").in("id", catIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const pMap = new Map<string, any>((personas as any[] ?? []).map((p) => [p.id, p]));
      const aMap = new Map<string, any>((apoderados as any[] ?? []).map((p) => [p.id, p]));
      const cMap = new Map<string, string>((cats as any[] ?? []).map((c) => [c.id, c.nombre]));

      // Agrupar por persona
      const grouped: Record<string, MorosoRow> = {};
      rows.forEach((r) => {
        const p = pMap.get(r.persona_id);
        if (!p) return;
        if (!grouped[r.persona_id]) {
          const apo = r.apoderado_id ? aMap.get(r.apoderado_id) : null;
          grouped[r.persona_id] = {
            persona_id: r.persona_id,
            nombre: p.nombre,
            apellido: p.apellido,
            telefono: p.telefono,
            categoria: cMap.get(r.categoria_id ?? "") ?? "—",
            apoderado_id: r.apoderado_id,
            apoderado_nombre: apo ? `${apo.nombre} ${apo.apellido}` : null,
            apoderado_telefono: apo?.telefono ?? null,
            cuotas_impagas: 0,
            monto_adeudado: 0,
            periodos: [],
          };
        }
        grouped[r.persona_id].cuotas_impagas++;
        grouped[r.persona_id].monto_adeudado += r.monto_final;
        if (!grouped[r.persona_id].periodos.includes(r.periodo)) {
          grouped[r.persona_id].periodos.push(r.periodo);
        }
      });

      const list = Object.values(grouped).sort((a, b) => b.monto_adeudado - a.monto_adeudado);
      setMorosos(list);
      setLoading(false);
    };
    load();
  }, [clubActual?.id, isAdmin]);

  const filtered = useMemo(() => {
    if (!busqueda) return morosos;
    const q = busqueda.toLowerCase();
    return morosos.filter(
      (m) =>
        `${m.nombre} ${m.apellido}`.toLowerCase().includes(q) ||
        (m.apoderado_nombre ?? "").toLowerCase().includes(q) ||
        m.categoria.toLowerCase().includes(q)
    );
  }, [morosos, busqueda]);

  const totalAdeudado = filtered.reduce((s, m) => s + m.monto_adeudado, 0);

  const buildMessage = (m: MorosoRow) => {
    const target = m.apoderado_nombre ?? `${m.nombre} ${m.apellido}`;
    return plantilla
      .replace(/\{nombre\}/g, target)
      .replace(/\{cuotas\}/g, String(m.cuotas_impagas))
      .replace(/\{monto\}/g, fmtCLP(m.monto_adeudado))
      .replace(/\{categoria\}/g, m.categoria);
  };

  const waLink = (m: MorosoRow): string | null => {
    const phoneRaw = m.apoderado_telefono ?? m.telefono;
    const phone = toWaNumber(phoneRaw);
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(m))}`;
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Esta vista solo está disponible para administradores del club.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Gestión de Morosos</h3>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "persona" : "personas"} con cuotas pendientes ·{" "}
            <span className="text-destructive font-mono">{fmtCLP(totalAdeudado)}</span> por cobrar
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar persona o apoderado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Plantilla editable */}
      <div className="bg-card border border-border rounded-lg p-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
          Plantilla de mensaje WhatsApp
        </label>
        <Textarea
          value={plantilla}
          onChange={(e) => setPlantilla(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Variables: <code>{"{nombre}"}</code> · <code>{"{cuotas}"}</code> ·{" "}
          <code>{"{monto}"}</code> · <code>{"{categoria}"}</code>
        </p>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          🎉 No hay morosos. Todas las cuotas están al día.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m, i) => {
            const link = waLink(m);
            const phoneShown = m.apoderado_telefono ?? m.telefono;
            return (
              <motion.div
                key={m.persona_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
                className="bg-card border border-border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                {/* Identidad */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground text-sm">
                      {m.apellido}, {m.nombre}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">{m.categoria}</Badge>
                  </div>
                  {m.apoderado_nombre && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Apoderado: {m.apoderado_nombre}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {phoneShown ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono">{phoneShown}</span>
                      </span>
                    ) : (
                      <span className="text-destructive/70">Sin teléfono registrado</span>
                    )}
                    <span>·</span>
                    <span>
                      {m.cuotas_impagas} cuota{m.cuotas_impagas > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Monto */}
                <div className="text-left sm:text-right shrink-0">
                  <p className="font-mono font-semibold text-destructive text-sm">
                    {fmtCLP(m.monto_adeudado)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.periodos.slice(0, 3).join(", ")}
                    {m.periodos.length > 3 && ` +${m.periodos.length - 3}`}
                  </p>
                </div>

                {/* Acción WhatsApp */}
                <div className="shrink-0">
                  {link ? (
                    <Button
                      asChild
                      size="sm"
                      className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
                    >
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="gap-1.5">
                      <Send className="w-4 h-4" />
                      Sin teléfono
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
