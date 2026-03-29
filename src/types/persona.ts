export interface Familiar {
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: string;
  profesion: string;
}

export interface DocumentoPersona {
  id: string;
  etiqueta: "Cédula Identidad" | "Certificado Médico" | "Ficha Federativa" | "Otros";
  nombreArchivo: string;
  tipo: string; // mime
  fechaCarga: string;
  fechaVencimiento?: string; // solo para Certificado Médico
}

export interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  fechaNacimiento: string; // ISO
  edad: number;
  categoria: string;
  rama: "Fem" | "Masc" | "Mixto";
  tipo: "Jugador" | "Jugadora" | "Socio" | "Socia";
  estado: "Activo" | "Moroso" | "Inactivo";
  talla: string;
  peso: string;
  colegio: string;
  previsionSalud: string;
  alergias: string;
  padre: Familiar;
  madre: Familiar;
  apoderado: Familiar;
  documentos: DocumentoPersona[];
}

export const ETIQUETAS_DOCUMENTO = [
  "Cédula Identidad",
  "Certificado Médico",
  "Ficha Federativa",
  "Otros",
] as const;

export const DOCUMENTOS_OBLIGATORIOS: Array<DocumentoPersona["etiqueta"]> = [
  "Cédula Identidad",
  "Certificado Médico",
  "Ficha Federativa",
];

export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

export function calcularCategoria(fechaNacimiento: string): string {
  const edad = calcularEdad(fechaNacimiento);
  if (edad < 9) return "Escuelita";
  if (edad < 11) return "U9";
  if (edad < 13) return "U11";
  if (edad < 15) return "U13";
  if (edad < 17) return "U15";
  if (edad < 19) return "U18";
  return "Adulto";
}

export function requiereTutor(categoria: string): boolean {
  return ["Escuelita", "U9", "U11"].includes(categoria);
}

export function documentoVencido(doc: DocumentoPersona): boolean {
  if (!doc.fechaVencimiento) return false;
  return new Date(doc.fechaVencimiento) < new Date();
}

export function documentosPorVencer(doc: DocumentoPersona, dias: number = 30): boolean {
  if (!doc.fechaVencimiento) return false;
  const venc = new Date(doc.fechaVencimiento);
  const limite = new Date();
  limite.setDate(limite.getDate() + dias);
  return venc <= limite && venc >= new Date();
}
