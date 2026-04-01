
-- Function to auto-create transaction from ejecucion_compra
CREATE OR REPLACE FUNCTION public.create_transaction_from_ejecucion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_solicitud RECORD;
BEGIN
  -- Get solicitud details
  SELECT titulo, descripcion, categoria_equipo, proyecto_asociado, categoria_id, proyecto_id, solicitante_id
  INTO v_solicitud
  FROM public.solicitudes_compra
  WHERE id = NEW.solicitud_id;

  -- Insert egreso transaction
  INSERT INTO public.transacciones (
    tipo, categoria, subcategoria, descripcion, monto, fecha, estado,
    metodo_pago, referencia, notas,
    categoria_deportiva, persona_id,
    persona_ref_id, categoria_ref_id, proyecto_id,
    origen_tipo, origen_id
  ) VALUES (
    'Egreso',
    'Compras',
    v_solicitud.categoria_equipo,
    'Compra: ' || COALESCE(v_solicitud.titulo, 'Sin título'),
    NEW.monto_real,
    NEW.fecha_compra,
    'Pagado',
    NEW.medio_pago,
    NEW.numero_comprobante,
    'Proveedor: ' || NEW.proveedor_real || COALESCE('. ' || NEW.observaciones, ''),
    v_solicitud.categoria_equipo,
    NULL,
    v_solicitud.solicitante_id,
    v_solicitud.categoria_id,
    v_solicitud.proyecto_id,
    'compra',
    NEW.solicitud_id
  );

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_ejecucion_compra_transaction
  AFTER INSERT ON public.ejecuciones_compra
  FOR EACH ROW
  EXECUTE FUNCTION public.create_transaction_from_ejecucion();
