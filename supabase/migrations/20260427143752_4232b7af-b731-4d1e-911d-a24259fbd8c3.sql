
-- 1. Ampliar sesiones_entrenamiento con campos de bitácora
ALTER TABLE public.sesiones_entrenamiento
  ADD COLUMN IF NOT EXISTS tipo_entrenamiento text DEFAULT 'Mixto',
  ADD COLUMN IF NOT EXISTS objetivo_dia text,
  ADD COLUMN IF NOT EXISTS intensidad text DEFAULT 'Media',
  ADD COLUMN IF NOT EXISTS notas_entrenador text,
  ADD COLUMN IF NOT EXISTS resultado_sesion text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 2. Tabla de ejercicios por sesión
CREATE TABLE IF NOT EXISTS public.sesion_ejercicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES public.sesiones_entrenamiento(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  duracion_min integer NOT NULL DEFAULT 0,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sesion_ejercicios_sesion ON public.sesion_ejercicios(sesion_id);
ALTER TABLE public.sesion_ejercicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sesion_ejercicios" ON public.sesion_ejercicios
  FOR SELECT TO authenticated USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Coach/staff can insert sesion_ejercicios" ON public.sesion_ejercicios
  FOR INSERT TO authenticated WITH CHECK (get_user_club_role(auth.uid(), club_id) = ANY(ARRAY['admin','staff','coach']));
CREATE POLICY "Coach/staff can update sesion_ejercicios" ON public.sesion_ejercicios
  FOR UPDATE TO authenticated USING (get_user_club_role(auth.uid(), club_id) = ANY(ARRAY['admin','staff','coach']));
CREATE POLICY "Coach/staff can delete sesion_ejercicios" ON public.sesion_ejercicios
  FOR DELETE TO authenticated USING (get_user_club_role(auth.uid(), club_id) = ANY(ARRAY['admin','staff','coach']));

-- 3. Tabla de observaciones individuales por jugadora
CREATE TABLE IF NOT EXISTS public.observaciones_jugadora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id uuid NOT NULL REFERENCES public.sesiones_entrenamiento(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'positiva', -- positiva | mejora | lesion | ausencia | destacada
  texto text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obs_jugadora_sesion ON public.observaciones_jugadora(sesion_id);
CREATE INDEX IF NOT EXISTS idx_obs_jugadora_persona ON public.observaciones_jugadora(persona_id);
ALTER TABLE public.observaciones_jugadora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view observaciones_jugadora" ON public.observaciones_jugadora
  FOR SELECT TO authenticated USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Coach/staff can insert observaciones_jugadora" ON public.observaciones_jugadora
  FOR INSERT TO authenticated WITH CHECK (get_user_club_role(auth.uid(), club_id) = ANY(ARRAY['admin','staff','coach']));
CREATE POLICY "Author or admin can update observaciones_jugadora" ON public.observaciones_jugadora
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Author or admin can delete observaciones_jugadora" ON public.observaciones_jugadora
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE TRIGGER update_observaciones_jugadora_updated_at
  BEFORE UPDATE ON public.observaciones_jugadora
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Tabla de recordatorios del coach
CREATE TABLE IF NOT EXISTS public.recordatorios_coach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  persona_id uuid,
  sesion_id uuid REFERENCES public.sesiones_entrenamiento(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text,
  fecha_limite date,
  prioridad text NOT NULL DEFAULT 'media', -- baja | media | alta
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | cumplido
  created_by uuid,
  cumplido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recordatorios_club_estado ON public.recordatorios_coach(club_id, estado);
CREATE INDEX IF NOT EXISTS idx_recordatorios_fecha ON public.recordatorios_coach(fecha_limite);
ALTER TABLE public.recordatorios_coach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view recordatorios" ON public.recordatorios_coach
  FOR SELECT TO authenticated USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Coach/staff can insert recordatorios" ON public.recordatorios_coach
  FOR INSERT TO authenticated WITH CHECK (get_user_club_role(auth.uid(), club_id) = ANY(ARRAY['admin','staff','coach']));
CREATE POLICY "Author or admin can update recordatorios" ON public.recordatorios_coach
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Author or admin can delete recordatorios" ON public.recordatorios_coach
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE TRIGGER update_recordatorios_coach_updated_at
  BEFORE UPDATE ON public.recordatorios_coach
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Agregar política para que coach también pueda crear/editar sesiones de entrenamiento
CREATE POLICY "Coach can insert sesiones_ent" ON public.sesiones_entrenamiento
  FOR INSERT TO authenticated WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'coach');
CREATE POLICY "Coach can update sesiones_ent" ON public.sesiones_entrenamiento
  FOR UPDATE TO authenticated USING (get_user_club_role(auth.uid(), club_id) = 'coach' AND (created_by = auth.uid() OR created_by IS NULL));
CREATE POLICY "Coach can delete own sesiones_ent" ON public.sesiones_entrenamiento
  FOR DELETE TO authenticated USING (get_user_club_role(auth.uid(), club_id) = 'coach' AND created_by = auth.uid());

-- 6. Permitir que coach gestione asistencia
CREATE POLICY "Coach can insert asistencia_ent" ON public.asistencia_entrenamiento
  FOR INSERT TO authenticated WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'coach');
CREATE POLICY "Coach can update asistencia_ent" ON public.asistencia_entrenamiento
  FOR UPDATE TO authenticated USING (get_user_club_role(auth.uid(), club_id) = 'coach');
CREATE POLICY "Coach can delete asistencia_ent" ON public.asistencia_entrenamiento
  FOR DELETE TO authenticated USING (get_user_club_role(auth.uid(), club_id) = 'coach');
