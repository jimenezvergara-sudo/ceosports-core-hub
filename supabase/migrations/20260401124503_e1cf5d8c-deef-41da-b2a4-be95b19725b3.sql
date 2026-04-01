
CREATE TABLE public.niveles_aprobacion (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monto_minimo integer NOT NULL DEFAULT 0,
  monto_maximo integer NULL,
  roles_autorizados text[] NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.niveles_aprobacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read niveles_aprobacion" ON public.niveles_aprobacion FOR SELECT USING (true);
CREATE POLICY "Anyone can insert niveles_aprobacion" ON public.niveles_aprobacion FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update niveles_aprobacion" ON public.niveles_aprobacion FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete niveles_aprobacion" ON public.niveles_aprobacion FOR DELETE USING (true);

INSERT INTO public.niveles_aprobacion (monto_minimo, monto_maximo, roles_autorizados, descripcion) VALUES
  (0, 100000, ARRAY['Secretario/a', 'Tesorero/a'], 'Hasta $100.000 — Secretario/a o Tesorero/a'),
  (100001, 500000, ARRAY['Tesorero/a', 'Vicepresidente/a'], '$100.001 a $500.000 — Tesorero/a o Vicepresidente/a'),
  (500001, 1000000, ARRAY['Tesorero/a', 'Presidente/a'], '$500.001 a $1.000.000 — Tesorero/a o Presidente/a'),
  (1000001, NULL, ARRAY['Presidente/a', 'Tesorero/a'], 'Más de $1.000.000 — Presidente/a y Tesorero/a');
