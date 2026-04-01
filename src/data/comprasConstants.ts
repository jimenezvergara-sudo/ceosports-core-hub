export const ESTADOS_COMPRA = [
  "borrador",
  "enviada",
  "en revisión",
  "aprobada",
  "rechazada",
  "comprada",
  "rendida",
  "observada",
  "cerrada",
] as const;

export type EstadoCompra = (typeof ESTADOS_COMPRA)[number];

export const ESTADO_COLOR: Record<EstadoCompra, string> = {
  borrador: "bg-muted text-muted-foreground",
  enviada: "bg-primary/10 text-primary",
  "en revisión": "bg-warning/10 text-warning-foreground border-warning/30",
  aprobada: "bg-success/10 text-success",
  rechazada: "bg-destructive/10 text-destructive",
  comprada: "bg-accent text-accent-foreground",
  rendida: "bg-primary/15 text-primary",
  observada: "bg-warning/10 text-warning-foreground border-warning/30",
  cerrada: "bg-muted text-muted-foreground",
};

export const PRIORIDADES = ["baja", "media", "alta", "urgente"] as const;

export const PRIORIDAD_COLOR: Record<string, string> = {
  baja: "bg-muted text-muted-foreground",
  media: "bg-primary/10 text-primary",
  alta: "bg-warning/10 text-warning-foreground",
  urgente: "bg-destructive/10 text-destructive",
};

export const TIPOS_GASTO = [
  "Equipamiento deportivo",
  "Indumentaria",
  "Alimentación",
  "Transporte",
  "Infraestructura",
  "Material de oficina",
  "Médico / salud",
  "Eventos y torneos",
  "Otros",
] as const;

export const MEDIOS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Tarjeta de débito",
  "Tarjeta de crédito",
  "Cheque",
] as const;
