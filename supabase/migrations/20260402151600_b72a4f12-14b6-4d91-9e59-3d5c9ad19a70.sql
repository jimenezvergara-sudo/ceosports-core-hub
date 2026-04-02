
-- ══════════════════════════════════════════════
-- ASAMBLEAS
-- ══════════════════════════════════════════════
CREATE TABLE public.asambleas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'ordinaria',
  titulo TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  lugar TEXT,
  descripcion TEXT,
  quorum_requerido INTEGER DEFAULT 0,
  quorum_presente INTEGER DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'programada',
  acta_storage_path TEXT,
  acta_nombre_archivo TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asambleas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view asambleas" ON public.asambleas
  FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert asambleas" ON public.asambleas
  FOR INSERT WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update asambleas" ON public.asambleas
  FOR UPDATE USING (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete asambleas" ON public.asambleas
  FOR DELETE USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE TRIGGER update_asambleas_updated_at
  BEFORE UPDATE ON public.asambleas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════
-- ASAMBLEA ASISTENCIA
-- ══════════════════════════════════════════════
CREATE TABLE public.asamblea_asistencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asamblea_id UUID NOT NULL REFERENCES public.asambleas(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL DEFAULT true,
  hora_llegada TIME,
  representacion TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asamblea_id, persona_id)
);

ALTER TABLE public.asamblea_asistencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view asistencia" ON public.asamblea_asistencia
  FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert asistencia" ON public.asamblea_asistencia
  FOR INSERT WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update asistencia" ON public.asamblea_asistencia
  FOR UPDATE USING (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete asistencia" ON public.asamblea_asistencia
  FOR DELETE USING (get_user_club_role(auth.uid(), club_id) = 'admin');

-- ══════════════════════════════════════════════
-- ASAMBLEA ACUERDOS
-- ══════════════════════════════════════════════
CREATE TABLE public.asamblea_acuerdos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asamblea_id UUID NOT NULL REFERENCES public.asambleas(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL DEFAULT 1,
  descripcion TEXT NOT NULL,
  responsable_id UUID REFERENCES public.personas(id),
  fecha_limite DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  prioridad TEXT NOT NULL DEFAULT 'media',
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asamblea_acuerdos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view acuerdos" ON public.asamblea_acuerdos
  FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert acuerdos" ON public.asamblea_acuerdos
  FOR INSERT WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update acuerdos" ON public.asamblea_acuerdos
  FOR UPDATE USING (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete acuerdos" ON public.asamblea_acuerdos
  FOR DELETE USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE TRIGGER update_acuerdos_updated_at
  BEFORE UPDATE ON public.asamblea_acuerdos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════
-- LIBRO DE SOCIOS
-- ══════════════════════════════════════════════
CREATE TABLE public.libro_socios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  numero_socio INTEGER,
  fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_retiro DATE,
  estado TEXT NOT NULL DEFAULT 'activo',
  tipo_socio TEXT NOT NULL DEFAULT 'activo',
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, persona_id)
);

ALTER TABLE public.libro_socios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view libro_socios" ON public.libro_socios
  FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert libro_socios" ON public.libro_socios
  FOR INSERT WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update libro_socios" ON public.libro_socios
  FOR UPDATE USING (get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete libro_socios" ON public.libro_socios
  FOR DELETE USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE TRIGGER update_libro_socios_updated_at
  BEFORE UPDATE ON public.libro_socios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for acuerdos tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.asamblea_acuerdos;
