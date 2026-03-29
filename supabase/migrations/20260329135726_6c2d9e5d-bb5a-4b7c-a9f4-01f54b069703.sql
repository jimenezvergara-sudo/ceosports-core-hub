-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true);

-- Storage policies
CREATE POLICY "Documents are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'documentos');

CREATE POLICY "Anyone can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Anyone can update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documentos');

CREATE POLICY "Anyone can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documentos');

-- Create documents table
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id TEXT NOT NULL,
  etiqueta TEXT NOT NULL CHECK (etiqueta IN ('Cédula Identidad', 'Certificado Médico', 'Ficha Federativa', 'Otros')),
  nombre_archivo TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url_publica TEXT,
  fecha_carga TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read documents" ON public.documentos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert documents" ON public.documentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update documents" ON public.documentos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete documents" ON public.documentos FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_documentos_updated_at
BEFORE UPDATE ON public.documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();