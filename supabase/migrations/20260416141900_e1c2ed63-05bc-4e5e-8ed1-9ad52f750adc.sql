
-- Categorías de documentos
CREATE TABLE public.categorias_documento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  icono text DEFAULT 'folder',
  orden integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_documento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categorias_documento" ON public.categorias_documento FOR SELECT USING (true);
CREATE POLICY "Anyone can insert categorias_documento" ON public.categorias_documento FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update categorias_documento" ON public.categorias_documento FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete categorias_documento" ON public.categorias_documento FOR DELETE USING (true);

-- Add category reference to club_documentos
ALTER TABLE public.club_documentos ADD COLUMN categoria_documento_id uuid REFERENCES public.categorias_documento(id) ON DELETE SET NULL;
