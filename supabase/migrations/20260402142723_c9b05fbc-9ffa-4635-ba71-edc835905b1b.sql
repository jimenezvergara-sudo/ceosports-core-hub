
-- Add new columns to clubs table
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS rut text,
  ADD COLUMN IF NOT EXISTS representante_legal text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS sitio_web text,
  ADD COLUMN IF NOT EXISTS fecha_fundacion date,
  ADD COLUMN IF NOT EXISTS tipo_organizacion text DEFAULT 'Club Deportivo',
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS redes_sociales jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS numero_registro text,
  ADD COLUMN IF NOT EXISTS municipalidad text,
  ADD COLUMN IF NOT EXISTS region text;

-- Create club_documentos table for legal/institutional documents
CREATE TABLE public.club_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  etiqueta text NOT NULL DEFAULT 'otro',
  descripcion text,
  storage_path text NOT NULL,
  nombre_archivo text NOT NULL,
  tipo_mime text NOT NULL,
  fecha_emision date,
  fecha_vencimiento date,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.club_documentos ENABLE ROW LEVEL SECURITY;

-- Only club members can view documents
CREATE POLICY "Members can view club documents"
  ON public.club_documentos FOR SELECT
  USING (user_belongs_to_club(auth.uid(), club_id));

-- Only admins can manage documents
CREATE POLICY "Admins can insert club documents"
  ON public.club_documentos FOR INSERT
  WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE POLICY "Admins can update club documents"
  ON public.club_documentos FOR UPDATE
  USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE POLICY "Admins can delete club documents"
  ON public.club_documentos FOR DELETE
  USING (get_user_club_role(auth.uid(), club_id) = 'admin');

-- Trigger for updated_at
CREATE TRIGGER update_club_documentos_updated_at
  BEFORE UPDATE ON public.club_documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for club documents
INSERT INTO storage.buckets (id, name, public) VALUES ('club-documentos', 'club-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Members can view club doc files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'club-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload club doc files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'club-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete club doc files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'club-documentos' AND auth.role() = 'authenticated');
