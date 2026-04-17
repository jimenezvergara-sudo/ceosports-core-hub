import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useIsSuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) { setIsSuperAdmin(false); setLoading(false); return; }
    supabase
      .from("platform_roles" as any)
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle()
      .then(({ data }) => {
        if (active) { setIsSuperAdmin(!!data); setLoading(false); }
      });
    return () => { active = false; };
  }, [user]);

  return { isSuperAdmin, loading };
}
