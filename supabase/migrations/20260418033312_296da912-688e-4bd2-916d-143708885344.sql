
-- 1. Add commercial fields to suscripciones_club (used as Contratos)
ALTER TABLE public.suscripciones_club
  ADD COLUMN IF NOT EXISTS responsable_pago text,
  ADD COLUMN IF NOT EXISTS rut_facturacion text,
  ADD COLUMN IF NOT EXISTS email_contacto text;

-- 2. Leads table
CREATE TABLE IF NOT EXISTS public.leads_comerciales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_entidad text NOT NULL,
  deporte text,
  ciudad text,
  contacto_nombre text,
  contacto_email text,
  contacto_telefono text,
  estado text NOT NULL DEFAULT 'Prospecto',
  fecha_ultimo_contacto date,
  notas text,
  plan_interes_id uuid REFERENCES public.planes_plataforma(id) ON DELETE SET NULL,
  club_convertido_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads_comerciales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view leads" ON public.leads_comerciales
  FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins insert leads" ON public.leads_comerciales
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update leads" ON public.leads_comerciales
  FOR UPDATE USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete leads" ON public.leads_comerciales
  FOR DELETE USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER update_leads_comerciales_updated_at
  BEFORE UPDATE ON public.leads_comerciales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_leads_estado ON public.leads_comerciales(estado);

-- 3. Gestiones de cobranza
CREATE TABLE IF NOT EXISTS public.gestiones_cobranza (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  suscripcion_id uuid REFERENCES public.suscripciones_club(id) ON DELETE SET NULL,
  fecha_gestion date NOT NULL DEFAULT CURRENT_DATE,
  tipo_gestion text NOT NULL DEFAULT 'contacto',
  resultado text,
  nota text,
  realizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gestiones_cobranza ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view gestiones" ON public.gestiones_cobranza
  FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins insert gestiones" ON public.gestiones_cobranza
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update gestiones" ON public.gestiones_cobranza
  FOR UPDATE USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete gestiones" ON public.gestiones_cobranza
  FOR DELETE USING (public.is_super_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_gestiones_club ON public.gestiones_cobranza(club_id);
