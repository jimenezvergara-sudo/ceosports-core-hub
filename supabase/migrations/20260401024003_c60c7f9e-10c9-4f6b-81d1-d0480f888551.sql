
CREATE TABLE public.persona_relaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  relacionado_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  tipo_relacion TEXT NOT NULL DEFAULT 'apoderado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(persona_id, relacionado_id, tipo_relacion)
);

ALTER TABLE public.persona_relaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read persona_relaciones" ON public.persona_relaciones FOR SELECT USING (true);
CREATE POLICY "Anyone can insert persona_relaciones" ON public.persona_relaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update persona_relaciones" ON public.persona_relaciones FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete persona_relaciones" ON public.persona_relaciones FOR DELETE USING (true);
