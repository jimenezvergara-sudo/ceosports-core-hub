import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { categoriasTransaccion } from "@/data/categoriasTransaccion";
import { personasMock } from "@/data/personasMock";

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

interface Props {
  transaccion: Transaccion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

export default function TransaccionDetailSheet({ transaccion, open, onOpenChange }: Props) {
  if (!transaccion) return null;

  const catData = categoriasTransaccion.find((c) => c.value === transaccion.categoria);
  const subData = catData?.subcategorias.find((s) => s.value === transaccion.subcategoria);
  const persona = transaccion.persona_id
    ? personasMock.find((p) => p.id === transaccion.persona_id)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Badge variant={transaccion.tipo === "Ingreso" ? "outline" : "destructive"} className="text-xs">
              {transaccion.tipo}
            </Badge>
            <span className="text-base">Detalle de Transacción</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-1">
          {/* Monto destacado */}
          <div className="bg-muted/50 rounded-lg p-4 text-center mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monto</p>
            <p className={`text-2xl font-mono font-bold ${
              transaccion.tipo === "Ingreso" ? "text-success" : "text-destructive"
            }`}>
              {transaccion.tipo === "Ingreso" ? "+" : "-"}${transaccion.monto.toLocaleString("es-CL")}
            </p>
          </div>

          <Separator />

          <DetailRow label="Fecha" value={transaccion.fecha} />
          <DetailRow label="Descripción" value={transaccion.descripcion} />
          <DetailRow label="Ítem" value={catData?.label ?? transaccion.categoria} />
          <DetailRow label="Sub Ítem" value={subData?.label ?? transaccion.subcategoria} />

          <Separator />

          <DetailRow
            label="Estado"
            value={
              <Badge
                variant={
                  transaccion.estado === "Pagado" ? "outline" :
                  transaccion.estado === "Anulado" ? "destructive" : "secondary"
                }
                className="text-xs"
              >
                {transaccion.estado}
              </Badge>
            }
          />
          <DetailRow label="Método de Pago" value={transaccion.metodo_pago} />
          <DetailRow label="Referencia" value={transaccion.referencia} />

          {(transaccion.categoria_deportiva || persona) && (
            <>
              <Separator />
              <DetailRow label="Categoría Deportiva" value={transaccion.categoria_deportiva} />
              {persona && (
                <DetailRow
                  label="Jugadora"
                  value={`${persona.apellido}, ${persona.nombre} — ${persona.rut}`}
                />
              )}
            </>
          )}

          {transaccion.notas && (
            <>
              <Separator />
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm text-foreground bg-muted/30 rounded p-2">
                  {transaccion.notas}
                </p>
              </div>
            </>
          )}

          <Separator />
          <DetailRow
            label="Registrado"
            value={new Date(transaccion.created_at).toLocaleString("es-CL")}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
