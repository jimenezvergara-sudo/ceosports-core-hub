-- Enable extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- cron_logs: log of every cron-cuotas run
CREATE TABLE IF NOT EXISTS public.cron_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name text NOT NULL,
  ejecutado_en timestamptz NOT NULL DEFAULT now(),
  resultado text NOT NULL DEFAULT 'ok',
  clubes_procesados integer NOT NULL DEFAULT 0,
  cuotas_generadas integer NOT NULL DEFAULT 0,
  cuotas_vencidas_actualizadas integer NOT NULL DEFAULT 0,
  detalle jsonb,
  error text
);

CREATE INDEX IF NOT EXISTS cron_logs_job_fecha_idx
  ON public.cron_logs (job_name, ejecutado_en DESC);

ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view cron_logs"
  ON public.cron_logs FOR SELECT
  TO authenticated
  USING (true);

-- notificaciones_admin: alertas para admins del club
CREATE TABLE IF NOT EXISTS public.notificaciones_admin (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  severidad text NOT NULL DEFAULT 'info',
  leida boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS notif_admin_club_unread_idx
  ON public.notificaciones_admin (club_id, leida, created_at DESC);

ALTER TABLE public.notificaciones_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view notificaciones"
  ON public.notificaciones_admin FOR SELECT
  TO authenticated
  USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE POLICY "Admins update notificaciones"
  ON public.notificaciones_admin FOR UPDATE
  TO authenticated
  USING (get_user_club_role(auth.uid(), club_id) = 'admin');

CREATE POLICY "Admins delete notificaciones"
  ON public.notificaciones_admin FOR DELETE
  TO authenticated
  USING (get_user_club_role(auth.uid(), club_id) = 'admin');