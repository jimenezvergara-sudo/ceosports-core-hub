
-- Add club_id to all data tables
ALTER TABLE public.personas ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.categorias ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.proyectos ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.transacciones ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.cuotas ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.cuota_configuraciones ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.solicitudes_compra ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.proveedores ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.staff_roles ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.documentos ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.beneficios_cuota ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.pagos_cuotas ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.persona_categoria ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.persona_relaciones ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.niveles_aprobacion ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.evaluaciones_proveedor ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.aprobaciones_compra ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.ejecuciones_compra ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.rendiciones_compra ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;
ALTER TABLE public.historial_compra ADD COLUMN club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Create indexes for club_id on key tables
CREATE INDEX idx_personas_club ON public.personas(club_id);
CREATE INDEX idx_transacciones_club ON public.transacciones(club_id);
CREATE INDEX idx_cuotas_club ON public.cuotas(club_id);
CREATE INDEX idx_solicitudes_compra_club ON public.solicitudes_compra(club_id);
CREATE INDEX idx_staff_roles_club ON public.staff_roles(club_id);
