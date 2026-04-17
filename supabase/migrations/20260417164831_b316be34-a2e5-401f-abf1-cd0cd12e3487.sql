-- 1. ENUM para roles de plataforma (separado de roles dentro de un club)
CREATE TYPE public.platform_role AS ENUM ('super_admin', 'support');

-- 2. Tabla platform_roles (separada de cualquier tabla de perfil → previene escalamiento)
CREATE TABLE public.platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role platform_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- 3. Función security definer para chequear rol de plataforma sin recursión
CREATE OR REPLACE FUNCTION public.has_platform_role(_user_id UUID, _role platform_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Políticas platform_roles: solo super_admins ven/gestionan
CREATE POLICY "Super admins view platform_roles" ON public.platform_roles
  FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins insert platform_roles" ON public.platform_roles
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update platform_roles" ON public.platform_roles
  FOR UPDATE USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete platform_roles" ON public.platform_roles
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- 4. Catálogo de planes (editable)
CREATE TABLE public.planes_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  precio_mensual INTEGER NOT NULL DEFAULT 0,
  precio_anual INTEGER NOT NULL DEFAULT 0,
  moneda TEXT NOT NULL DEFAULT 'CLP',
  limite_clubes INTEGER,
  limite_usuarios INTEGER,
  caracteristicas JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT true,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planes_plataforma ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver planes activos (para mostrar en upgrade); solo super_admin gestiona
CREATE POLICY "Anyone authed can view planes" ON public.planes_plataforma
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage planes insert" ON public.planes_plataforma
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins manage planes update" ON public.planes_plataforma
  FOR UPDATE USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins manage planes delete" ON public.planes_plataforma
  FOR DELETE USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_planes_updated
  BEFORE UPDATE ON public.planes_plataforma
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Suscripciones por club
CREATE TABLE public.suscripciones_club (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.planes_plataforma(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'trial' CHECK (estado IN ('trial','activo','suspendido','cancelado','vencido')),
  ciclo_facturacion TEXT NOT NULL DEFAULT 'mensual' CHECK (ciclo_facturacion IN ('mensual','anual')),
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  trial_hasta DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id)
);
ALTER TABLE public.suscripciones_club ENABLE ROW LEVEL SECURITY;

-- Super admins ven/gestionan todo; miembros del club ven solo su suscripción
CREATE POLICY "Super admins view all suscripciones" ON public.suscripciones_club
  FOR SELECT USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Super admins insert suscripciones" ON public.suscripciones_club
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update suscripciones" ON public.suscripciones_club
  FOR UPDATE USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete suscripciones" ON public.suscripciones_club
  FOR DELETE USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_suscripciones_updated
  BEFORE UPDATE ON public.suscripciones_club
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_suscripciones_club_id ON public.suscripciones_club(club_id);
CREATE INDEX idx_suscripciones_estado ON public.suscripciones_club(estado);

-- 6. Pagos de plataforma (historial de cobros)
CREATE TABLE public.pagos_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  suscripcion_id UUID REFERENCES public.suscripciones_club(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.planes_plataforma(id) ON DELETE SET NULL,
  monto INTEGER NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'CLP',
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  periodo_desde DATE,
  periodo_hasta DATE,
  metodo TEXT NOT NULL DEFAULT 'transferencia' CHECK (metodo IN ('transferencia','efectivo','tarjeta','webpay','otro')),
  referencia TEXT,
  comprobante_path TEXT,
  estado TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado','pendiente','anulado')),
  notas TEXT,
  registrado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagos_plataforma ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view all pagos" ON public.pagos_plataforma
  FOR SELECT USING (public.is_super_admin(auth.uid()) OR public.user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Super admins insert pagos" ON public.pagos_plataforma
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update pagos" ON public.pagos_plataforma
  FOR UPDATE USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete pagos" ON public.pagos_plataforma
  FOR DELETE USING (public.is_super_admin(auth.uid()));

CREATE INDEX idx_pagos_club_id ON public.pagos_plataforma(club_id);
CREATE INDEX idx_pagos_fecha ON public.pagos_plataforma(fecha_pago DESC);

-- 7. Política para que super_admin vea TODOS los clubs
CREATE POLICY "Super admins can view all clubs" ON public.clubs
  FOR SELECT USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins can update all clubs" ON public.clubs
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

-- 8. Campos de contacto de cobranza en clubs
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS contacto_cobranza_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contacto_cobranza_email TEXT,
  ADD COLUMN IF NOT EXISTS contacto_cobranza_telefono TEXT;

-- 9. Bucket privado para comprobantes de pago de plataforma
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-plataforma', 'comprobantes-plataforma', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Super admins read comprobantes plataforma" ON storage.objects
  FOR SELECT USING (bucket_id = 'comprobantes-plataforma' AND public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins upload comprobantes plataforma" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'comprobantes-plataforma' AND public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update comprobantes plataforma" ON storage.objects
  FOR UPDATE USING (bucket_id = 'comprobantes-plataforma' AND public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete comprobantes plataforma" ON storage.objects
  FOR DELETE USING (bucket_id = 'comprobantes-plataforma' AND public.is_super_admin(auth.uid()));

-- 10. Seed de planes base (editables después)
INSERT INTO public.planes_plataforma (nombre, descripcion, precio_mensual, precio_anual, moneda, limite_clubes, limite_usuarios, orden, caracteristicas) VALUES
  ('Free', 'Plan gratuito para evaluar la plataforma', 0, 0, 'CLP', 1, 3, 1, '["1 club","3 usuarios","Hasta 30 personas"]'::jsonb),
  ('Club', 'Plan estándar para clubes en operación', 29990, 299900, 'CLP', 1, 10, 2, '["1 club","10 usuarios","Personas ilimitadas","Cuotas y cobranzas"]'::jsonb),
  ('Pro', 'Plan completo con todas las funcionalidades', 59990, 599900, 'CLP', 5, 50, 3, '["Hasta 5 clubes","50 usuarios","Soporte prioritario","Reportes avanzados"]'::jsonb)
ON CONFLICT (nombre) DO NOTHING;