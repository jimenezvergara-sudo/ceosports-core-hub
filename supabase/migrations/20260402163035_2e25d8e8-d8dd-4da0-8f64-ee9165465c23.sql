
CREATE TABLE public.centros_costo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  club_id UUID REFERENCES public.clubs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios del club pueden ver centros de costo"
ON public.centros_costo FOR SELECT TO authenticated
USING (public.user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Usuarios del club pueden crear centros de costo"
ON public.centros_costo FOR INSERT TO authenticated
WITH CHECK (public.user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Usuarios del club pueden editar centros de costo"
ON public.centros_costo FOR UPDATE TO authenticated
USING (public.user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Usuarios del club pueden eliminar centros de costo"
ON public.centros_costo FOR DELETE TO authenticated
USING (public.user_belongs_to_club(auth.uid(), club_id));

CREATE TRIGGER update_centros_costo_updated_at
BEFORE UPDATE ON public.centros_costo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
