
-- Add agenda/tabla fields to asambleas
ALTER TABLE public.asambleas ADD COLUMN IF NOT EXISTS tabla_contenido text;
ALTER TABLE public.asambleas ADD COLUMN IF NOT EXISTS tabla_storage_path text;
ALTER TABLE public.asambleas ADD COLUMN IF NOT EXISTS tabla_nombre_archivo text;

-- Add progress notes to acuerdos
ALTER TABLE public.asamblea_acuerdos ADD COLUMN IF NOT EXISTS notas_avance text;
