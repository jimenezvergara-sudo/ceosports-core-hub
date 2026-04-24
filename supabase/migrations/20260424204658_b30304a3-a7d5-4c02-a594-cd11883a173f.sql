ALTER TABLE public.asistencia_entrenamiento DROP CONSTRAINT IF EXISTS asistencia_entrenamiento_estado_check;

ALTER TABLE public.asistencia_entrenamiento
ADD CONSTRAINT asistencia_entrenamiento_estado_check
CHECK (estado IN ('sin_marcar', 'presente', 'ausente', 'justificado', 'lesionada'));

ALTER TABLE public.asistencia_entrenamiento
ALTER COLUMN estado SET DEFAULT 'sin_marcar';