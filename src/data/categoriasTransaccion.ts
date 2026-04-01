export interface SubCategoria {
  value: string;
  label: string;
}

export interface CategoriaTransaccion {
  value: string;
  label: string;
  tipo: "Ingreso" | "Egreso" | "Ambos";
  /** Permite asignar categoría deportiva */
  permiteCategoriaDeportiva: boolean;
  /** Permite asignar a una jugadora individual */
  permiteJugadora: boolean;
  subcategorias: SubCategoria[];
}

export const categoriasTransaccion: CategoriaTransaccion[] = [
  // ── INGRESOS ──
  {
    value: "Cuotas",
    label: "Cuotas",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: true,
    permiteJugadora: true,
    subcategorias: [
      { value: "Mensual", label: "Cuota Mensual" },
      { value: "Inscripción", label: "Inscripción" },
      { value: "Matrícula", label: "Matrícula" },
      { value: "Extraordinaria", label: "Cuota Extraordinaria" },
    ],
  },
  {
    value: "Subvención",
    label: "Subvenciones",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Fondeporte", label: "Fondeporte" },
      { value: "Municipal", label: "Municipal" },
      { value: "Regional", label: "Gobierno Regional" },
      { value: "IND", label: "IND" },
      { value: "Otra Subvención", label: "Otra Subvención" },
    ],
  },
  {
    value: "Donación",
    label: "Donaciones",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Empresa", label: "Empresa" },
      { value: "Persona Natural", label: "Persona Natural" },
      { value: "Fundación", label: "Fundación" },
    ],
  },
  {
    value: "Sponsors",
    label: "Sponsors / Auspicios",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Auspicio", label: "Auspicio" },
      { value: "Publicidad", label: "Publicidad" },
      { value: "Convenio", label: "Convenio Comercial" },
    ],
  },
  {
    value: "Eventos",
    label: "Eventos",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Torneo Organizado", label: "Torneo Organizado" },
      { value: "Rifas", label: "Rifas" },
      { value: "Beneficio", label: "Evento a Beneficio" },
      { value: "Venta Mercadería", label: "Venta de Mercadería" },
    ],
  },
  {
    value: "Kiosko Venta",
    label: "Kiosko (Ventas)",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: true,
    permiteJugadora: false,
    subcategorias: [
      { value: "Venta Alimentos", label: "Venta de Alimentos" },
      { value: "Venta Bebidas", label: "Venta de Bebidas" },
      { value: "Venta Snacks", label: "Venta de Snacks" },
      { value: "Otro Kiosko Venta", label: "Otro" },
    ],
  },
  {
    value: "Multas",
    label: "Multas Jugadoras",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: true,
    permiteJugadora: true,
    subcategorias: [
      { value: "Multa Atraso", label: "Atraso" },
      { value: "Multa Inasistencia", label: "Inasistencia" },
      { value: "Multa Disciplinaria", label: "Disciplinaria" },
      { value: "Otra Multa", label: "Otra" },
    ],
  },
  {
    value: "Otros Ingresos",
    label: "Otros Ingresos",
    tipo: "Ingreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Otro Ingreso", label: "Otro" },
    ],
  },

  // ── EGRESOS ──
  {
    value: "Club",
    label: "Club",
    tipo: "Egreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Gastos Generales", label: "Gastos Generales" },
      { value: "Representación", label: "Representación" },
      { value: "Actividades Sociales", label: "Actividades Sociales" },
      { value: "Otro Club", label: "Otro" },
    ],
  },
  {
    value: "Kiosko Compra",
    label: "Kiosko (Compras)",
    tipo: "Egreso",
    permiteCategoriaDeportiva: true,
    permiteJugadora: false,
    subcategorias: [
      { value: "Compra Alimentos", label: "Compra de Alimentos" },
      { value: "Compra Bebidas", label: "Compra de Bebidas" },
      { value: "Compra Insumos", label: "Compra de Insumos" },
      { value: "Otro Kiosko Compra", label: "Otro" },
    ],
  },
  {
    value: "Infraestructura",
    label: "Infraestructura",
    tipo: "Egreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Arriendo Cancha", label: "Arriendo de Cancha" },
      { value: "Mantención", label: "Mantención Instalaciones" },
      { value: "Servicios Básicos", label: "Servicios Básicos" },
      { value: "Mejoras", label: "Mejoras / Obras" },
    ],
  },
  {
    value: "Equipamiento",
    label: "Equipamiento Deportivo",
    tipo: "Egreso",
    permiteCategoriaDeportiva: true,
    permiteJugadora: false,
    subcategorias: [
      { value: "Implementación", label: "Implementación (Balones, Conos, etc.)" },
      { value: "Uniformes", label: "Uniformes" },
      { value: "Indumentaria", label: "Indumentaria de Entrenamiento" },
      { value: "Médico", label: "Equipamiento Médico" },
    ],
  },
  {
    value: "Competencia",
    label: "Competencia / Torneos",
    tipo: "Egreso",
    permiteCategoriaDeportiva: true,
    permiteJugadora: false,
    subcategorias: [
      { value: "Inscripción Torneo", label: "Inscripción a Torneo" },
      { value: "Traslados", label: "Traslados" },
      { value: "Hospedaje", label: "Hospedaje" },
      { value: "Alimentación", label: "Alimentación" },
      { value: "Arbitraje", label: "Arbitraje" },
    ],
  },
  {
    value: "Personal",
    label: "Personal / Honorarios",
    tipo: "Egreso",
    permiteCategoriaDeportiva: true,
    permiteJugadora: false,
    subcategorias: [
      { value: "Honorarios DT", label: "Director Técnico" },
      { value: "Preparador Físico", label: "Preparador Físico" },
      { value: "Kinesiólogo", label: "Kinesiólogo" },
      { value: "Coordinador", label: "Coordinador" },
      { value: "Otro Personal", label: "Otro Personal" },
    ],
  },
  {
    value: "Administrativo",
    label: "Administrativo / Legal",
    tipo: "Egreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Seguros", label: "Seguros" },
      { value: "Legal", label: "Gastos Legales" },
      { value: "Contabilidad", label: "Contabilidad" },
      { value: "Notaría", label: "Notaría" },
      { value: "Bancarios", label: "Gastos Bancarios" },
    ],
  },
  {
    value: "Otros Egresos",
    label: "Otros Egresos",
    tipo: "Egreso",
    permiteCategoriaDeportiva: false,
    permiteJugadora: false,
    subcategorias: [
      { value: "Premiación", label: "Premiación" },
      { value: "Marketing", label: "Marketing / Diseño" },
      { value: "Otro Egreso", label: "Otro" },
    ],
  },
];
