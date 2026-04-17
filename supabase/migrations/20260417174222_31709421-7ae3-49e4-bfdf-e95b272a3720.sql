CREATE TABLE public.persona_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL UNIQUE REFERENCES public.personas(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  talla TEXT,
  talla_uniforme TEXT,
  peso TEXT,
  colegio TEXT,
  prevision_salud TEXT,
  alergias TEXT,
  direccion TEXT,
  padre_nombre TEXT,
  padre_apellido TEXT,
  padre_rut TEXT,
  padre_telefono TEXT,
  padre_email TEXT,
  padre_direccion TEXT,
  padre_profesion TEXT,
  madre_nombre TEXT,
  madre_apellido TEXT,
  madre_rut TEXT,
  madre_telefono TEXT,
  madre_email TEXT,
  madre_direccion TEXT,
  madre_profesion TEXT,
  apoderado_nombre TEXT,
  apoderado_apellido TEXT,
  apoderado_rut TEXT,
  apoderado_telefono TEXT,
  apoderado_email TEXT,
  apoderado_direccion TEXT,
  apoderado_profesion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_persona_detalle_persona_id ON public.persona_detalle(persona_id);
CREATE INDEX idx_persona_detalle_club_id ON public.persona_detalle(club_id);

ALTER TABLE public.persona_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view persona_detalle"
  ON public.persona_detalle FOR SELECT
  USING (club_id IS NULL OR public.user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Members can insert persona_detalle"
  ON public.persona_detalle FOR INSERT
  WITH CHECK (club_id IS NULL OR public.user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Members can update persona_detalle"
  ON public.persona_detalle FOR UPDATE
  USING (club_id IS NULL OR public.user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Members can delete persona_detalle"
  ON public.persona_detalle FOR DELETE
  USING (club_id IS NULL OR public.user_belongs_to_club(auth.uid(), club_id));

CREATE TRIGGER update_persona_detalle_updated_at
  BEFORE UPDATE ON public.persona_detalle
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();