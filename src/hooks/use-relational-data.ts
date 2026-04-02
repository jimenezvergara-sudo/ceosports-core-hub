import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface PersonaRow {
  id: string;
  nombre: string;
  apellido: string;
  rut: string | null;
  tipo_persona: string;
  estado: string;
}

export interface CategoriaRow {
  id: string;
  nombre: string;
  rama: string;
}

export interface ProyectoRow {
  id: string;
  nombre: string;
  tipo: string;
  presupuesto: number;
  estado: string;
}

interface UsePersonasOptions {
  includeLegacyWithoutClub?: boolean;
}

export function usePersonas(options: UsePersonasOptions = {}) {
  const [personas, setPersonas] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();
  const { includeLegacyWithoutClub = false } = options;

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    let query = supabase
      .from("personas")
      .select("id, nombre, apellido, rut, tipo_persona, estado");
    query = includeLegacyWithoutClub
      ? query.or(`club_id.eq.${clubId},club_id.is.null`)
      : query.eq("club_id", clubId);
    query = query.order("apellido");
    query.then(({ data }) => {
      setPersonas((data as unknown as PersonaRow[]) ?? []);
      setLoading(false);
    });
  }, [clubId, includeLegacyWithoutClub]);

  return { personas, loading };
}

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    supabase
      .from("categorias")
      .select("id, nombre, rama")
      .eq("club_id", clubId)
      .order("nombre")
      .then(({ data }) => {
        setCategorias((data as unknown as CategoriaRow[]) ?? []);
        setLoading(false);
      });
  }, [clubId]);

  return { categorias, loading };
}

export function useProyectos() {
  const [proyectos, setProyectos] = useState<ProyectoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    supabase
      .from("proyectos")
      .select("id, nombre, tipo, presupuesto, estado")
      .eq("club_id", clubId)
      .order("nombre")
      .then(({ data }) => {
        setProyectos((data as unknown as ProyectoRow[]) ?? []);
        setLoading(false);
      });
  }, [clubId]);

  return { proyectos, loading };
}

export interface StaffRoleRow {
  id: string;
  persona_id: string;
  rol: string;
  categoria_id: string | null;
  activo: boolean;
  persona_nombre?: string;
  persona_apellido?: string;
  persona_rut?: string | null;
  categoria_nombre?: string | null;
}

export function useStaffRoles() {
  const [roles, setRoles] = useState<StaffRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubId } = useAuth();

  const fetch = async () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("staff_roles" as any)
      .select("id, persona_id, rol, categoria_id, activo, personas!staff_roles_persona_id_fkey(nombre, apellido, rut), categorias!staff_roles_categoria_id_fkey(nombre)")
      .eq("club_id", clubId)
      .order("rol");

    const mapped = ((data as any[]) ?? []).map((r: any) => ({
      id: r.id,
      persona_id: r.persona_id,
      rol: r.rol,
      categoria_id: r.categoria_id,
      activo: r.activo,
      persona_nombre: r.personas?.nombre,
      persona_apellido: r.personas?.apellido,
      persona_rut: r.personas?.rut,
      categoria_nombre: r.categorias?.nombre,
    }));
    setRoles(mapped);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [clubId]);

  return { roles, loading, refetch: fetch };
}

export function personaLabel(p: PersonaRow): string {
  return `${p.apellido}, ${p.nombre}${p.rut ? ` — ${p.rut}` : ""}`;
}
