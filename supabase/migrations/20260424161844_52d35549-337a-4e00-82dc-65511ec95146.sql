
-- Helper: drop & recreate policies per table
-- Pattern:
--   SELECT: club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id)
--   INSERT/UPDATE/DELETE: club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin'
-- Restricted to authenticated role.

-- ============ personas ============
DROP POLICY IF EXISTS "Anyone can read personas" ON public.personas;
DROP POLICY IF EXISTS "Anyone can insert personas" ON public.personas;
DROP POLICY IF EXISTS "Anyone can update personas" ON public.personas;
DROP POLICY IF EXISTS "Anyone can delete personas" ON public.personas;

CREATE POLICY "Members can view personas" ON public.personas FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert personas" ON public.personas FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update personas" ON public.personas FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete personas" ON public.personas FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ cuotas ============
DROP POLICY IF EXISTS "Anyone can read cuotas" ON public.cuotas;
DROP POLICY IF EXISTS "Anyone can insert cuotas" ON public.cuotas;
DROP POLICY IF EXISTS "Anyone can update cuotas" ON public.cuotas;
DROP POLICY IF EXISTS "Anyone can delete cuotas" ON public.cuotas;

CREATE POLICY "Members can view cuotas" ON public.cuotas FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert cuotas" ON public.cuotas FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update cuotas" ON public.cuotas FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete cuotas" ON public.cuotas FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ pagos_cuotas ============
DROP POLICY IF EXISTS "Anyone can read pagos_cuotas" ON public.pagos_cuotas;
DROP POLICY IF EXISTS "Anyone can insert pagos_cuotas" ON public.pagos_cuotas;
DROP POLICY IF EXISTS "Anyone can update pagos_cuotas" ON public.pagos_cuotas;
DROP POLICY IF EXISTS "Anyone can delete pagos_cuotas" ON public.pagos_cuotas;

CREATE POLICY "Members can view pagos_cuotas" ON public.pagos_cuotas FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert pagos_cuotas" ON public.pagos_cuotas FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update pagos_cuotas" ON public.pagos_cuotas FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete pagos_cuotas" ON public.pagos_cuotas FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ cuota_configuraciones ============
DROP POLICY IF EXISTS "Anyone can read cuota_configuraciones" ON public.cuota_configuraciones;
DROP POLICY IF EXISTS "Anyone can insert cuota_configuraciones" ON public.cuota_configuraciones;
DROP POLICY IF EXISTS "Anyone can update cuota_configuraciones" ON public.cuota_configuraciones;
DROP POLICY IF EXISTS "Anyone can delete cuota_configuraciones" ON public.cuota_configuraciones;

CREATE POLICY "Members can view cuota_configuraciones" ON public.cuota_configuraciones FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert cuota_configuraciones" ON public.cuota_configuraciones FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update cuota_configuraciones" ON public.cuota_configuraciones FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete cuota_configuraciones" ON public.cuota_configuraciones FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ beneficios_cuota ============
DROP POLICY IF EXISTS "Anyone can read beneficios_cuota" ON public.beneficios_cuota;
DROP POLICY IF EXISTS "Anyone can insert beneficios_cuota" ON public.beneficios_cuota;
DROP POLICY IF EXISTS "Anyone can update beneficios_cuota" ON public.beneficios_cuota;
DROP POLICY IF EXISTS "Anyone can delete beneficios_cuota" ON public.beneficios_cuota;

CREATE POLICY "Members can view beneficios_cuota" ON public.beneficios_cuota FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert beneficios_cuota" ON public.beneficios_cuota FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update beneficios_cuota" ON public.beneficios_cuota FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete beneficios_cuota" ON public.beneficios_cuota FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ categorias ============
DROP POLICY IF EXISTS "Anyone can read categorias" ON public.categorias;
DROP POLICY IF EXISTS "Anyone can insert categorias" ON public.categorias;
DROP POLICY IF EXISTS "Anyone can update categorias" ON public.categorias;
DROP POLICY IF EXISTS "Anyone can delete categorias" ON public.categorias;

CREATE POLICY "Members can view categorias" ON public.categorias FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert categorias" ON public.categorias FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update categorias" ON public.categorias FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete categorias" ON public.categorias FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ categorias_documento ============
DROP POLICY IF EXISTS "Anyone can read categorias_documento" ON public.categorias_documento;
DROP POLICY IF EXISTS "Anyone can insert categorias_documento" ON public.categorias_documento;
DROP POLICY IF EXISTS "Anyone can update categorias_documento" ON public.categorias_documento;
DROP POLICY IF EXISTS "Anyone can delete categorias_documento" ON public.categorias_documento;

CREATE POLICY "Members can view categorias_documento" ON public.categorias_documento FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert categorias_documento" ON public.categorias_documento FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update categorias_documento" ON public.categorias_documento FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete categorias_documento" ON public.categorias_documento FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ documentos ============
DROP POLICY IF EXISTS "Anyone can read documents" ON public.documentos;
DROP POLICY IF EXISTS "Anyone can insert documents" ON public.documentos;
DROP POLICY IF EXISTS "Anyone can update documents" ON public.documentos;
DROP POLICY IF EXISTS "Anyone can delete documents" ON public.documentos;

CREATE POLICY "Members can view documentos" ON public.documentos FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert documentos" ON public.documentos FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update documentos" ON public.documentos FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete documentos" ON public.documentos FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ persona_categoria ============
DROP POLICY IF EXISTS "Anyone can read persona_categoria" ON public.persona_categoria;
DROP POLICY IF EXISTS "Anyone can insert persona_categoria" ON public.persona_categoria;
DROP POLICY IF EXISTS "Anyone can update persona_categoria" ON public.persona_categoria;
DROP POLICY IF EXISTS "Anyone can delete persona_categoria" ON public.persona_categoria;

CREATE POLICY "Members can view persona_categoria" ON public.persona_categoria FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert persona_categoria" ON public.persona_categoria FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update persona_categoria" ON public.persona_categoria FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete persona_categoria" ON public.persona_categoria FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ persona_relaciones ============
DROP POLICY IF EXISTS "Anyone can read persona_relaciones" ON public.persona_relaciones;
DROP POLICY IF EXISTS "Anyone can insert persona_relaciones" ON public.persona_relaciones;
DROP POLICY IF EXISTS "Anyone can update persona_relaciones" ON public.persona_relaciones;
DROP POLICY IF EXISTS "Anyone can delete persona_relaciones" ON public.persona_relaciones;

CREATE POLICY "Members can view persona_relaciones" ON public.persona_relaciones FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert persona_relaciones" ON public.persona_relaciones FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update persona_relaciones" ON public.persona_relaciones FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete persona_relaciones" ON public.persona_relaciones FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ persona_detalle (refuerza con admin para escritura) ============
DROP POLICY IF EXISTS "Members can view persona_detalle" ON public.persona_detalle;
DROP POLICY IF EXISTS "Members can insert persona_detalle" ON public.persona_detalle;
DROP POLICY IF EXISTS "Members can update persona_detalle" ON public.persona_detalle;
DROP POLICY IF EXISTS "Members can delete persona_detalle" ON public.persona_detalle;

CREATE POLICY "Members can view persona_detalle" ON public.persona_detalle FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert persona_detalle" ON public.persona_detalle FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update persona_detalle" ON public.persona_detalle FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete persona_detalle" ON public.persona_detalle FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ aprobaciones_compra ============
DROP POLICY IF EXISTS "Anyone can read aprobaciones" ON public.aprobaciones_compra;
DROP POLICY IF EXISTS "Anyone can insert aprobaciones" ON public.aprobaciones_compra;

CREATE POLICY "Members can view aprobaciones" ON public.aprobaciones_compra FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert aprobaciones" ON public.aprobaciones_compra FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update aprobaciones" ON public.aprobaciones_compra FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete aprobaciones" ON public.aprobaciones_compra FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ ejecuciones_compra ============
DROP POLICY IF EXISTS "Anyone can read ejecuciones" ON public.ejecuciones_compra;
DROP POLICY IF EXISTS "Anyone can insert ejecuciones" ON public.ejecuciones_compra;

CREATE POLICY "Members can view ejecuciones" ON public.ejecuciones_compra FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert ejecuciones" ON public.ejecuciones_compra FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update ejecuciones" ON public.ejecuciones_compra FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete ejecuciones" ON public.ejecuciones_compra FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ historial_compra ============
DROP POLICY IF EXISTS "Anyone can read historial" ON public.historial_compra;
DROP POLICY IF EXISTS "Anyone can insert historial" ON public.historial_compra;

CREATE POLICY "Members can view historial" ON public.historial_compra FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Members can insert historial" ON public.historial_compra FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));

-- ============ evaluaciones_proveedor ============
DROP POLICY IF EXISTS "Anyone can read evaluaciones_proveedor" ON public.evaluaciones_proveedor;
DROP POLICY IF EXISTS "Anyone can insert evaluaciones_proveedor" ON public.evaluaciones_proveedor;
DROP POLICY IF EXISTS "Anyone can update evaluaciones_proveedor" ON public.evaluaciones_proveedor;
DROP POLICY IF EXISTS "Anyone can delete evaluaciones_proveedor" ON public.evaluaciones_proveedor;

CREATE POLICY "Members can view evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete evaluaciones_proveedor" ON public.evaluaciones_proveedor FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');

-- ============ niveles_aprobacion ============
DROP POLICY IF EXISTS "Anyone can read niveles_aprobacion" ON public.niveles_aprobacion;
DROP POLICY IF EXISTS "Anyone can insert niveles_aprobacion" ON public.niveles_aprobacion;
DROP POLICY IF EXISTS "Anyone can update niveles_aprobacion" ON public.niveles_aprobacion;
DROP POLICY IF EXISTS "Anyone can delete niveles_aprobacion" ON public.niveles_aprobacion;

CREATE POLICY "Members can view niveles_aprobacion" ON public.niveles_aprobacion FOR SELECT TO authenticated
USING (club_id IS NULL OR user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can insert niveles_aprobacion" ON public.niveles_aprobacion FOR INSERT TO authenticated
WITH CHECK (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update niveles_aprobacion" ON public.niveles_aprobacion FOR UPDATE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete niveles_aprobacion" ON public.niveles_aprobacion FOR DELETE TO authenticated
USING (club_id IS NULL OR get_user_club_role(auth.uid(), club_id) = 'admin');
