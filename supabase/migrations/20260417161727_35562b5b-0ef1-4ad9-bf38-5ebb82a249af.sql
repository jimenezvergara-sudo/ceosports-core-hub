-- Add fields to proyectos
ALTER TABLE public.proyectos
  ADD COLUMN IF NOT EXISTS fuente_financiamiento text DEFAULT 'Otro',
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS responsable_id uuid REFERENCES public.personas(id) ON DELETE SET NULL;

-- Tighten RLS by club_id
DROP POLICY IF EXISTS "Anyone can read proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Anyone can insert proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Anyone can update proyectos" ON public.proyectos;
DROP POLICY IF EXISTS "Anyone can delete proyectos" ON public.proyectos;

CREATE POLICY "Members can view proyectos" ON public.proyectos
  FOR SELECT USING (club_id IS NULL OR public.user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can insert proyectos" ON public.proyectos
  FOR INSERT WITH CHECK (club_id IS NULL OR public.user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can update proyectos" ON public.proyectos
  FOR UPDATE USING (club_id IS NULL OR public.user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can delete proyectos" ON public.proyectos
  FOR DELETE USING (public.get_user_club_role(auth.uid(), club_id) = 'admin');

-- Trigger updated_at
DROP TRIGGER IF EXISTS proyectos_updated_at ON public.proyectos;
CREATE TRIGGER proyectos_updated_at BEFORE UPDATE ON public.proyectos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for transacciones.proyecto_id (used to compute ejecutado)
CREATE INDEX IF NOT EXISTS idx_transacciones_proyecto_id ON public.transacciones(proyecto_id);