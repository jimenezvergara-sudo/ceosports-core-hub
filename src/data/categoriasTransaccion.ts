export interface SubCategoria {
  value: string;
  label: string;
}

export interface CategoriaTransaccion {
  value: string;
  label: string;
  subcategorias: SubCategoria[];
}

export const categoriasIngreso: CategoriaTransaccion[] = [
  {
    value: "Cuotas",
    label: "Cuotas",
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
    subcategorias: [
      { value: "Empresa", label: "Empresa" },
      { value: "Persona Natural", label: "Persona Natural" },
      { value: "Fundación", label: "Fundación" },
    ],
  },
  {
    value: "Sponsors",
    label: "Sponsors / Auspicios",
    subcategorias: [
      { value: "Auspicio", label: "Auspicio" },
      { value: "Publicidad", label: "Publicidad" },
      { value: "Convenio", label: "Convenio Comercial" },
    ],
  },
  {
    value: "Eventos",
    label: "Eventos",
    subcategorias: [
      { value: "Torneo Organizado", label: "Torneo Organizado" },
      { value: "Rifas", label: "Rifas" },
      { value: "Beneficio", label: "Evento a Beneficio" },
      { value: "Venta Mercadería", label: "Venta de Mercadería" },
    ],
  },
  {
    value: "Otros Ingresos",
    label: "Otros Ingresos",
    subcategorias: [
      { value: "Arriendo Cancha", label: "Arriendo de Cancha" },
      { value: "Multas Jugadores", label: "Multas Jugadores" },
      { value: "Otro", label: "Otro" },
    ],
  },
];

export const categoriasEgreso: CategoriaTransaccion[] = [
  {
    value: "Infraestructura",
    label: "Infraestructura",
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
    subcategorias: [
      { value: "Premiación", label: "Premiación" },
      { value: "Marketing", label: "Marketing / Diseño" },
      { value: "Otro", label: "Otro" },
    ],
  },
];
