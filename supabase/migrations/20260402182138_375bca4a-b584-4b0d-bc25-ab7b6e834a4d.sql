
-- Sesiones de entrenamiento
CREATE TABLE public.sesiones_entrenamiento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sesiones_entrenamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view sesiones" ON public.sesiones_entrenamiento FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can insert sesiones" ON public.sesiones_entrenamiento FOR INSERT WITH CHECK (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can update sesiones" ON public.sesiones_entrenamiento FOR UPDATE USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can delete sesiones" ON public.sesiones_entrenamiento FOR DELETE USING (user_belongs_to_club(auth.uid(), club_id));

CREATE TRIGGER update_sesiones_entrenamiento_updated_at BEFORE UPDATE ON public.sesiones_entrenamiento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Asistencia por sesión
CREATE TABLE public.asistencia_entrenamiento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sesion_id UUID NOT NULL REFERENCES public.sesiones_entrenamiento(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'presente' CHECK (estado IN ('presente', 'ausente', 'justificado', 'lesionada')),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sesion_id, persona_id)
);

ALTER TABLE public.asistencia_entrenamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view asistencia_ent" ON public.asistencia_entrenamiento FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can insert asistencia_ent" ON public.asistencia_entrenamiento FOR INSERT WITH CHECK (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can update asistencia_ent" ON public.asistencia_entrenamiento FOR UPDATE USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can delete asistencia_ent" ON public.asistencia_entrenamiento FOR DELETE USING (user_belongs_to_club(auth.uid(), club_id));

-- Mediciones biométricas (historial)
CREATE TABLE public.mediciones_biometricas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  fecha_medicion DATE NOT NULL DEFAULT CURRENT_DATE,
  peso NUMERIC(5,2),
  talla NUMERIC(5,2),
  envergadura NUMERIC(5,2),
  alcance NUMERIC(5,2),
  talla_padre NUMERIC(5,2),
  talla_madre NUMERIC(5,2),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mediciones_biometricas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view mediciones" ON public.mediciones_biometricas FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can insert mediciones" ON public.mediciones_biometricas FOR INSERT WITH CHECK (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can update mediciones" ON public.mediciones_biometricas FOR UPDATE USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can delete mediciones" ON public.mediciones_biometricas FOR DELETE USING (user_belongs_to_club(auth.uid(), club_id));

-- Catálogo de tipos de test deportivo (personalizables)
CREATE TABLE public.tipos_test_deportivo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'fisico' CHECK (categoria IN ('tiro', 'fisico', 'custom')),
  unidad_medida TEXT NOT NULL DEFAULT '',
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_test_deportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tipos_test" ON public.tipos_test_deportivo FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can insert tipos_test" ON public.tipos_test_deportivo FOR INSERT WITH CHECK (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can update tipos_test" ON public.tipos_test_deportivo FOR UPDATE USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can delete tipos_test" ON public.tipos_test_deportivo FOR DELETE USING (user_belongs_to_club(auth.uid(), club_id));

-- Registros de resultados de tests
CREATE TABLE public.registros_test_deportivo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  tipo_test_id UUID NOT NULL REFERENCES public.tipos_test_deportivo(id) ON DELETE CASCADE,
  fecha_ejecucion DATE NOT NULL DEFAULT CURRENT_DATE,
  valor NUMERIC(10,2) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registros_test_deportivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view registros_test" ON public.registros_test_deportivo FOR SELECT USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can insert registros_test" ON public.registros_test_deportivo FOR INSERT WITH CHECK (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can update registros_test" ON public.registros_test_deportivo FOR UPDATE USING (user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can delete registros_test" ON public.registros_test_deportivo FOR DELETE USING (user_belongs_to_club(auth.uid(), club_id));

-- Índices para performance
CREATE INDEX idx_asistencia_sesion ON public.asistencia_entrenamiento(sesion_id);
CREATE INDEX idx_asistencia_persona ON public.asistencia_entrenamiento(persona_id);
CREATE INDEX idx_mediciones_persona ON public.mediciones_biometricas(persona_id, fecha_medicion);
CREATE INDEX idx_registros_test_persona ON public.registros_test_deportivo(persona_id, fecha_ejecucion);
CREATE INDEX idx_sesiones_categoria ON public.sesiones_entrenamiento(categoria_id, fecha);
