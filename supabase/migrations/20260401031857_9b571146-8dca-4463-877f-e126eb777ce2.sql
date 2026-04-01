
-- Staff roles table: links personas to organizational roles, optionally to categories
CREATE TABLE public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  rol TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(persona_id, rol, categoria_id)
);

-- Enable RLS
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read staff_roles" ON public.staff_roles FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert staff_roles" ON public.staff_roles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update staff_roles" ON public.staff_roles FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete staff_roles" ON public.staff_roles FOR DELETE TO public USING (true);

-- Updated_at trigger
CREATE TRIGGER update_staff_roles_updated_at
  BEFORE UPDATE ON public.staff_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
