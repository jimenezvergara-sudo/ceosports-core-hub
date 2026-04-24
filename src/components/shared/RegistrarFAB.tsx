import { useState } from "react";
import { Plus, Receipt, Banknote, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import NuevaTransaccionDialog from "@/components/transacciones/NuevaTransaccionDialog";
import PagoCuotaRapidoDialog from "@/components/transacciones/PagoCuotaRapidoDialog";

/**
 * Botón flotante global "+ Registrar".
 * Solo visible para rol ADMIN. Acceso rápido a:
 *  - Registrar gasto (Egreso)
 *  - Registrar pago de socio (cuota)
 */
export default function RegistrarFAB() {
  const { rolSistema, clubActual } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [gastoOpen, setGastoOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState(false);

  // Visible solo cuando hay club activo y el usuario es admin
  if (!clubActual || rolSistema !== "admin") return null;

  const openGasto = () => {
    setMenuOpen(false);
    setGastoOpen(true);
  };

  const openPago = () => {
    setMenuOpen(false);
    setPagoOpen(true);
  };

  const noop = () => {
    // refrescos opcionales: las páginas individuales ya re-fetchean cuando el usuario navega.
  };

  return (
    <>
      {/* Backdrop suave cuando el menú está abierto */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[2px] animate-fade-in"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
        {/* Opciones del menú (suben desde el botón) */}
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-200 origin-bottom-left",
            menuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none"
          )}
        >
          <button
            onClick={openGasto}
            className="flex items-center gap-3 pl-3 pr-4 py-2.5 bg-card border border-border rounded-full shadow-lg hover:shadow-xl hover:bg-muted/40 transition-all group"
          >
            <span className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              Registrar gasto
            </span>
          </button>
          <button
            onClick={openPago}
            className="flex items-center gap-3 pl-3 pr-4 py-2.5 bg-card border border-border rounded-full shadow-lg hover:shadow-xl hover:bg-muted/40 transition-all group"
          >
            <span className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              Registrar pago de socio
            </span>
          </button>
        </div>

        {/* Botón principal */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Cerrar menú de registro" : "Abrir menú de registro"}
          className={cn(
            "w-14 h-14 rounded-full bg-success text-success-foreground shadow-lg hover:shadow-xl",
            "flex items-center justify-center transition-all hover:scale-105 active:scale-95",
            menuOpen && "rotate-45"
          )}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* Diálogos controlados */}
      <NuevaTransaccionDialog
        onCreated={noop}
        open={gastoOpen}
        onOpenChange={setGastoOpen}
        hideTrigger
        defaultTipo="Egreso"
      />
      <PagoCuotaRapidoDialog
        onPaid={noop}
        open={pagoOpen}
        onOpenChange={setPagoOpen}
        hideTrigger
      />
    </>
  );
}
