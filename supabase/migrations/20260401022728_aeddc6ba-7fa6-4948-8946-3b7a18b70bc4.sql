
-- 1. Create personas table
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rut TEXT,
  fecha_nacimiento DATE,
  tipo_persona TEXT NOT NULL DEFAULT 'jugador',
  estado TEXT NOT NULL DEFAULT 'activo',
  email TEXT,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read personas" ON public.personas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert personas" ON public.personas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update personas" ON public.personas FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete personas" ON public.personas FOR DELETE USING (true);

-- 2. Create categorias table
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rama TEXT NOT NULL DEFAULT 'mixto',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Anyone can insert categorias" ON public.categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update categorias" ON public.categorias FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete categorias" ON public.categorias FOR DELETE USING (true);

-- 3. Create proyectos table
CREATE TABLE public.proyectos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'interno',
  presupuesto INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'activo',
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read proyectos" ON public.proyectos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert proyectos" ON public.proyectos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update proyectos" ON public.proyectos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete proyectos" ON public.proyectos FOR DELETE USING (true);

-- 4. Add FK columns to solicitudes_compra (keep old TEXT columns)
ALTER TABLE public.solicitudes_compra
  ADD COLUMN solicitante_id UUID REFERENCES public.personas(id),
  ADD COLUMN categoria_id UUID REFERENCES public.categorias(id),
  ADD COLUMN proyecto_id UUID REFERENCES public.proyectos(id);

-- 5. Add FK columns to aprobaciones_compra
ALTER TABLE public.aprobaciones_compra
  ADD COLUMN aprobado_por_id UUID REFERENCES public.personas(id),
  ADD COLUMN responsable_compra_id UUID REFERENCES public.personas(id),
  ADD COLUMN proyecto_id UUID REFERENCES public.proyectos(id);

-- 6. Add FK column to ejecuciones_compra
ALTER TABLE public.ejecuciones_compra
  ADD COLUMN ejecutado_por_id UUID REFERENCES public.personas(id);

-- 7. Add FK column to rendiciones_compra
ALTER TABLE public.rendiciones_compra
  ADD COLUMN revisado_por_id UUID REFERENCES public.personas(id);

-- 8. Add FK column to historial_compra
ALTER TABLE public.historial_compra
  ADD COLUMN responsable_id UUID REFERENCES public.personas(id);

-- 9. Add FK columns to transacciones (keep old TEXT columns)
ALTER TABLE public.transacciones
  ADD COLUMN persona_ref_id UUID REFERENCES public.personas(id),
  ADD COLUMN categoria_ref_id UUID REFERENCES public.categorias(id),
  ADD COLUMN proyecto_id UUID REFERENCES public.proyectos(id),
  ADD COLUMN origen_tipo TEXT,
  ADD COLUMN origen_id UUID;

-- 10. Create persona_categoria junction table
CREATE TABLE public.persona_categoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(persona_id, categoria_id)
);

ALTER TABLE public.persona_categoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read persona_categoria" ON public.persona_categoria FOR SELECT USING (true);
CREATE POLICY "Anyone can insert persona_categoria" ON public.persona_categoria FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete persona_categoria" ON public.persona_categoria FOR DELETE USING (true);
