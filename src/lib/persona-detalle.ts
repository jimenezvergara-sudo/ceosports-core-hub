import { supabase } from "@/integrations/supabase/client";
import type { Persona, Familiar } from "@/types/persona";

const familiarVacio: Familiar = { nombre: "", apellido: "", rut: "", telefono: "", email: "", direccion: "", profesion: "" };

export interface PersonaDetalleRow {
  persona_id: string;
  club_id: string | null;
  talla: string | null;
  talla_uniforme: string | null;
  peso: string | null;
  colegio: string | null;
  prevision_salud: string | null;
  alergias: string | null;
  direccion: string | null;
  padre_nombre: string | null; padre_apellido: string | null; padre_rut: string | null;
  padre_telefono: string | null; padre_email: string | null; padre_direccion: string | null; padre_profesion: string | null;
  madre_nombre: string | null; madre_apellido: string | null; madre_rut: string | null;
  madre_telefono: string | null; madre_email: string | null; madre_direccion: string | null; madre_profesion: string | null;
  apoderado_nombre: string | null; apoderado_apellido: string | null; apoderado_rut: string | null;
  apoderado_telefono: string | null; apoderado_email: string | null; apoderado_direccion: string | null; apoderado_profesion: string | null;
}

const fam = (prefix: "padre" | "madre" | "apoderado", row: any): Familiar => ({
  nombre: row[`${prefix}_nombre`] ?? "",
  apellido: row[`${prefix}_apellido`] ?? "",
  rut: row[`${prefix}_rut`] ?? "",
  telefono: row[`${prefix}_telefono`] ?? "",
  email: row[`${prefix}_email`] ?? "",
  direccion: row[`${prefix}_direccion`] ?? "",
  profesion: row[`${prefix}_profesion`] ?? "",
});

const famToCols = (prefix: "padre" | "madre" | "apoderado", f: Familiar) => ({
  [`${prefix}_nombre`]: f.nombre || null,
  [`${prefix}_apellido`]: f.apellido || null,
  [`${prefix}_rut`]: f.rut || null,
  [`${prefix}_telefono`]: f.telefono || null,
  [`${prefix}_email`]: f.email || null,
  [`${prefix}_direccion`]: f.direccion || null,
  [`${prefix}_profesion`]: f.profesion || null,
});

export async function loadPersonaDetalle(personaId: string): Promise<Partial<Persona>> {
  const { data } = await supabase
    .from("persona_detalle" as any)
    .select("*")
    .eq("persona_id", personaId)
    .maybeSingle();
  if (!data) {
    return { talla: "", tallaUniforme: "", peso: "", colegio: "", previsionSalud: "", alergias: "",
      padre: { ...familiarVacio }, madre: { ...familiarVacio }, apoderado: { ...familiarVacio } };
  }
  const row: any = data;
  return {
    talla: row.talla ?? "",
    tallaUniforme: row.talla_uniforme ?? "",
    peso: row.peso ?? "",
    colegio: row.colegio ?? "",
    previsionSalud: row.prevision_salud ?? "",
    alergias: row.alergias ?? "",
    padre: fam("padre", row),
    madre: fam("madre", row),
    apoderado: fam("apoderado", row),
  };
}

export async function upsertPersonaDetalle(
  personaId: string,
  clubId: string | null,
  data: {
    talla?: string; tallaUniforme?: string; peso?: string; colegio?: string;
    previsionSalud?: string; alergias?: string; direccion?: string;
    padre?: Familiar; madre?: Familiar; apoderado?: Familiar;
  }
) {
  const payload: any = {
    persona_id: personaId,
    club_id: clubId,
    talla: data.talla || null,
    talla_uniforme: data.tallaUniforme || null,
    peso: data.peso || null,
    colegio: data.colegio || null,
    prevision_salud: data.previsionSalud || null,
    alergias: data.alergias || null,
    direccion: data.direccion || null,
    ...(data.padre ? famToCols("padre", data.padre) : {}),
    ...(data.madre ? famToCols("madre", data.madre) : {}),
    ...(data.apoderado ? famToCols("apoderado", data.apoderado) : {}),
  };
  return supabase.from("persona_detalle" as any).upsert(payload, { onConflict: "persona_id" });
}
