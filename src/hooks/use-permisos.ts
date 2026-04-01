import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface PermisoModulo {
  modulo: string;
  puede_ver: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

export function usePermisos() {
  const { clubId, rolSistema } = useAuth();
  const [permisos, setPermisos] = useState<PermisoModulo[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin has full access
  const isAdmin = rolSistema === "admin";

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    if (isAdmin) { setLoading(false); return; }

    supabase
      .from("permisos_modulo" as any)
      .select("modulo, puede_ver, puede_editar, puede_eliminar")
      .eq("club_id", clubId)
      .then(({ data }) => {
        setPermisos((data as any[]) ?? []);
        setLoading(false);
      });
  }, [clubId, isAdmin]);

  const tienePermiso = (modulo: string, accion: "ver" | "editar" | "eliminar" = "ver"): boolean => {
    if (isAdmin) return true;
    const p = permisos.find((pm) => pm.modulo === modulo);
    if (!p) return accion === "ver"; // default: can view but not edit
    if (accion === "ver") return p.puede_ver;
    if (accion === "editar") return p.puede_editar;
    return p.puede_eliminar;
  };

  return { permisos, loading, tienePermiso, isAdmin };
}
