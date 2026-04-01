
-- Proveedores table
CREATE TABLE public.proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  sitio_web TEXT,
  tipo_servicio TEXT NOT NULL DEFAULT 'General',
  activo BOOLEAN NOT NULL DEFAULT true,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read proveedores" ON public.proveedores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert proveedores" ON public.proveedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update proveedores" ON public.proveedores FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete proveedores" ON public.proveedores FOR DELETE USING (true);

-- Evaluaciones de proveedor
CREATE TABLE public.evaluaciones_proveedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  solicitud_id UUID REFERENCES public.solicitudes_compra(id) ON DELETE SET NULL,
  puntaje_plazo INTEGER NOT NULL DEFAULT 3 CHECK (puntaje_plazo BETWEEN 1 AND 5),
  puntaje_calidad INTEGER NOT NULL DEFAULT 3 CHECK (puntaje_calidad BETWEEN 1 AND 5),
  puntaje_precio INTEGER NOT NULL DEFAULT 3 CHECK (puntaje_precio BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluaciones_proveedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR SELECT USING (true);
CREATE POLICY "Anyone can insert evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR DELETE USING (true);

-- Add proveedor_id to solicitudes_compra
ALTER TABLE public.solicitudes_compra ADD COLUMN proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
