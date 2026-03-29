
CREATE TABLE public.transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text NOT NULL CHECK (tipo IN ('Ingreso', 'Egreso')),
  categoria text NOT NULL,
  subcategoria text,
  descripcion text NOT NULL,
  monto integer NOT NULL CHECK (monto > 0),
  estado text NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Pagado', 'Anulado')),
  metodo_pago text,
  referencia text,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read transacciones" ON public.transacciones FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert transacciones" ON public.transacciones FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update transacciones" ON public.transacciones FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete transacciones" ON public.transacciones FOR DELETE TO public USING (true);

CREATE TRIGGER update_transacciones_updated_at
  BEFORE UPDATE ON public.transacciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
