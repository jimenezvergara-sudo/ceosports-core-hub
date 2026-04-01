import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Club {
  id: string;
  nombre: string;
  deporte: string;
  ciudad: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  clubActual: Club | null;
  clubId: string | null;
  clubs: Club[];
  rolSistema: string | null;
  setClubActual: (club: Club) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubActual, setClubActualState] = useState<Club | null>(null);
  const [rolSistema, setRolSistema] = useState<string | null>(null);

  const setClubActual = (club: Club) => {
    setClubActualState(club);
    localStorage.setItem("club_id", club.id);
    // Fetch role for this club
    if (user) {
      supabase
        .from("club_usuarios" as any)
        .select("rol_sistema")
        .eq("club_id", club.id)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setRolSistema((data as any)?.rol_sistema ?? null);
        });
    }
  };

  const fetchClubs = async (userId: string) => {
    const { data } = await supabase
      .from("club_usuarios" as any)
      .select("club_id, rol_sistema, clubs:club_id(id, nombre, deporte, ciudad)")
      .eq("user_id", userId)
      .eq("activo", true);

    const memberships = (data as any[]) ?? [];
    const clubList: Club[] = memberships.map((m: any) => m.clubs).filter(Boolean);
    setClubs(clubList);

    // Restore last selected club
    const savedClubId = localStorage.getItem("club_id");
    const savedClub = clubList.find((c) => c.id === savedClubId);
    if (savedClub) {
      setClubActualState(savedClub);
      const membership = memberships.find((m: any) => m.club_id === savedClub.id);
      setRolSistema(membership?.rol_sistema ?? null);
    } else if (clubList.length === 1) {
      setClubActualState(clubList[0]);
      setRolSistema(memberships[0]?.rol_sistema ?? null);
      localStorage.setItem("club_id", clubList[0].id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchClubs(session.user.id), 0);
      } else {
        setClubs([]);
        setClubActualState(null);
        setRolSistema(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchClubs(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("club_id");
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, clubActual, clubId: clubActual?.id ?? null,
      clubs, rolSistema, setClubActual, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
