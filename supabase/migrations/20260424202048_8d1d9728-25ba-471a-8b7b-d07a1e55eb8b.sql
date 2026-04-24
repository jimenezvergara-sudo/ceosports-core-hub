CREATE TABLE public.reconciliaciones_banco (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  ejecutado_por UUID,
  nombre_archivo TEXT NOT NULL,
  banco_detectado TEXT,
  total_movimientos INTEGER NOT NULL DEFAULT 0,
  identificados_auto INTEGER NOT NULL DEFAULT 0,
  posibles_coincidencias INTEGER NOT NULL DEFAULT 0,
  no_identificados INTEGER NOT NULL DEFAULT 0,
  cuotas_conciliadas INTEGER NOT NULL DEFAULT 0,
  monto_conciliado BIGINT NOT NULL DEFAULT 0,
  detalle JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reconciliaciones_banco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reconciliaciones"
  ON public.reconciliaciones_banco FOR SELECT TO authenticated
  USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE POLICY "Admins can insert reconciliaciones"
  ON public.reconciliaciones_banco FOR INSERT TO authenticated
  WITH CHECK (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE POLICY "Admins can delete reconciliaciones"
  ON public.reconciliaciones_banco FOR DELETE TO authenticated
  USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE INDEX idx_reconciliaciones_club ON public.reconciliaciones_banco(club_id, created_at DESC);