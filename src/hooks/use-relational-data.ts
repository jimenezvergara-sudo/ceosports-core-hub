import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function usePersonas() {
  const [personas, setPersonas] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("personas")
      .select("id, nombre, apellido, rut, tipo_persona, estado")
      .order("apellido")
      .then(({ data }) => {
        setPersonas((data as unknown as PersonaRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  return { personas, loading };
}

export function useCategorias() {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("categorias")
      .select("id, nombre, rama")
      .order("nombre")
      .then(({ data }) => {
        setCategorias((data as unknown as CategoriaRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  return { categorias, loading };
}

export function useProyectos() {
  const [proyectos, setProyectos] = useState<ProyectoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("proyectos")
      .select("id, nombre, tipo, presupuesto, estado")
      .order("nombre")
      .then(({ data }) => {
        setProyectos((data as unknown as ProyectoRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  return { proyectos, loading };
}

export function personaLabel(p: PersonaRow): string {
  return `${p.apellido}, ${p.nombre}${p.rut ? ` — ${p.rut}` : ""}`;
}
