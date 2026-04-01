
-- 1. cuota_configuraciones
CREATE TABLE public.cuota_configuraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  monto_base INTEGER NOT NULL,
  frecuencia TEXT NOT NULL DEFAULT 'mensual',
  dia_vencimiento INTEGER NOT NULL DEFAULT 10,
  activa BOOLEAN NOT NULL DEFAULT true,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cuota_configuraciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cuota_configuraciones" ON public.cuota_configuraciones FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert cuota_configuraciones" ON public.cuota_configuraciones FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update cuota_configuraciones" ON public.cuota_configuraciones FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete cuota_configuraciones" ON public.cuota_configuraciones FOR DELETE TO public USING (true);

-- 2. cuotas
CREATE TABLE public.cuotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE NOT NULL,
  apoderado_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  configuracion_id UUID REFERENCES public.cuota_configuraciones(id) ON DELETE SET NULL,
  periodo TEXT NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL,
  monto_original INTEGER NOT NULL,
  descuento INTEGER NOT NULL DEFAULT 0,
  recargo INTEGER NOT NULL DEFAULT 0,
  monto_final INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cuotas" ON public.cuotas FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert cuotas" ON public.cuotas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update cuotas" ON public.cuotas FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete cuotas" ON public.cuotas FOR DELETE TO public USING (true);

-- 3. pagos_cuotas
CREATE TABLE public.pagos_cuotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuota_id UUID REFERENCES public.cuotas(id) ON DELETE CASCADE NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  monto_pagado INTEGER NOT NULL,
  metodo_pago TEXT,
  referencia TEXT,
  comprobante_path TEXT,
  recibido_por_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagos_cuotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pagos_cuotas" ON public.pagos_cuotas FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert pagos_cuotas" ON public.pagos_cuotas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update pagos_cuotas" ON public.pagos_cuotas FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete pagos_cuotas" ON public.pagos_cuotas FOR DELETE TO public USING (true);

-- 4. beneficios_cuota
CREATE TABLE public.beneficios_cuota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  tipo_beneficio TEXT NOT NULL,
  valor INTEGER NOT NULL,
  valor_tipo TEXT NOT NULL DEFAULT 'monto',
  motivo TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.beneficios_cuota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read beneficios_cuota" ON public.beneficios_cuota FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert beneficios_cuota" ON public.beneficios_cuota FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update beneficios_cuota" ON public.beneficios_cuota FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete beneficios_cuota" ON public.beneficios_cuota FOR DELETE TO public USING (true);

-- 5. Trigger: auto-update cuota status and create transaction on payment
CREATE OR REPLACE FUNCTION public.handle_pago_cuota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cuota RECORD;
  v_total_pagado INTEGER;
BEGIN
  -- Get cuota details
  SELECT * INTO v_cuota FROM public.cuotas WHERE id = NEW.cuota_id;
  
  -- Calculate total paid including this payment
  SELECT COALESCE(SUM(monto_pagado), 0) INTO v_total_pagado
  FROM public.pagos_cuotas WHERE cuota_id = NEW.cuota_id;
  
  -- Update cuota status
  IF v_total_pagado >= v_cuota.monto_final THEN
    UPDATE public.cuotas SET estado = 'pagada', updated_at = now() WHERE id = NEW.cuota_id;
  ELSE
    UPDATE public.cuotas SET estado = 'parcial', updated_at = now() WHERE id = NEW.cuota_id;
  END IF;
  
  -- Create ingreso transaction
  INSERT INTO public.transacciones (
    tipo, categoria, subcategoria, descripcion, monto, fecha, estado,
    metodo_pago, referencia, persona_ref_id, categoria_ref_id,
    origen_tipo, origen_id
  ) VALUES (
    'Ingreso',
    'Cuotas',
    v_cuota.periodo,
    'Pago cuota ' || v_cuota.periodo,
    NEW.monto_pagado,
    NEW.fecha_pago,
    'Pagado',
    NEW.metodo_pago,
    NEW.referencia,
    v_cuota.persona_id,
    v_cuota.categoria_id,
    'cuota',
    v_cuota.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pago_cuota_after_insert
AFTER INSERT ON public.pagos_cuotas
FOR EACH ROW
EXECUTE FUNCTION public.handle_pago_cuota();

-- 6. Updated_at triggers
CREATE TRIGGER trg_cuota_configuraciones_updated
BEFORE UPDATE ON public.cuota_configuraciones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_cuotas_updated
BEFORE UPDATE ON public.cuotas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
