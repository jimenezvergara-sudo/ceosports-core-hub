
-- Tabla principal de solicitudes de compra
CREATE TABLE public.solicitudes_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  categoria_equipo TEXT,
  tipo_gasto TEXT NOT NULL,
  proyecto_asociado TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  monto_estimado INTEGER NOT NULL,
  prioridad TEXT NOT NULL DEFAULT 'media',
  fecha_requerida DATE,
  proveedor_sugerido TEXT,
  justificacion TEXT,
  adjunto_path TEXT,
  estado TEXT NOT NULL DEFAULT 'borrador',
  solicitante TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de aprobaciones
CREATE TABLE public.aprobaciones_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_compra(id) ON DELETE CASCADE,
  aprobado_por TEXT NOT NULL,
  decision TEXT NOT NULL,
  monto_aprobado INTEGER,
  centro_costo TEXT,
  proyecto_asociado TEXT,
  responsable_compra TEXT,
  observaciones TEXT,
  fecha_aprobacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de ejecuciones de compra
CREATE TABLE public.ejecuciones_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_compra(id) ON DELETE CASCADE,
  proveedor_real TEXT NOT NULL,
  monto_real INTEGER NOT NULL,
  fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
  medio_pago TEXT NOT NULL,
  numero_comprobante TEXT,
  comprobante_path TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de rendiciones
CREATE TABLE public.rendiciones_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_compra(id) ON DELETE CASCADE,
  monto_rendido INTEGER NOT NULL,
  diferencia INTEGER NOT NULL DEFAULT 0,
  estado_revision TEXT NOT NULL DEFAULT 'rendida',
  observaciones_tesoreria TEXT,
  fecha_cierre TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial de cambios
CREATE TABLE public.historial_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes_compra(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,
  responsable TEXT NOT NULL,
  detalle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at para solicitudes
CREATE TRIGGER update_solicitudes_compra_updated_at
  BEFORE UPDATE ON public.solicitudes_compra
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.solicitudes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aprobaciones_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejecuciones_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendiciones_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_compra ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing pattern - no auth yet)
CREATE POLICY "Anyone can read solicitudes" ON public.solicitudes_compra FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert solicitudes" ON public.solicitudes_compra FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update solicitudes" ON public.solicitudes_compra FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete solicitudes" ON public.solicitudes_compra FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read aprobaciones" ON public.aprobaciones_compra FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert aprobaciones" ON public.aprobaciones_compra FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can read ejecuciones" ON public.ejecuciones_compra FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert ejecuciones" ON public.ejecuciones_compra FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can read rendiciones" ON public.rendiciones_compra FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert rendiciones" ON public.rendiciones_compra FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update rendiciones" ON public.rendiciones_compra FOR UPDATE TO public USING (true);

CREATE POLICY "Anyone can read historial" ON public.historial_compra FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert historial" ON public.historial_compra FOR INSERT TO public WITH CHECK (true);
