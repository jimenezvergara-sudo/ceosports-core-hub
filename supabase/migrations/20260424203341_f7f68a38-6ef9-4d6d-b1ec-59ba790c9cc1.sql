
-- Tighten RLS for sesiones_entrenamiento and asistencia_entrenamiento
-- Only admin and staff roles can create/edit/delete; everyone in club can view

-- sesiones_entrenamiento
DROP POLICY IF EXISTS "Members can insert sesiones_ent" ON public.sesiones_entrenamiento;
DROP POLICY IF EXISTS "Members can update sesiones_ent" ON public.sesiones_entrenamiento;
DROP POLICY IF EXISTS "Members can delete sesiones_ent" ON public.sesiones_entrenamiento;
DROP POLICY IF EXISTS "Members can view sesiones_ent" ON public.sesiones_entrenamiento;

CREATE POLICY "Members can view sesiones_ent"
ON public.sesiones_entrenamiento FOR SELECT
TO authenticated
USING (user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Admin/staff can insert sesiones_ent"
ON public.sesiones_entrenamiento FOR INSERT
TO authenticated
WITH CHECK (get_user_club_role(auth.uid(), club_id) IN ('admin', 'staff'));

CREATE POLICY "Admin/staff can update sesiones_ent"
ON public.sesiones_entrenamiento FOR UPDATE
TO authenticated
USING (get_user_club_role(auth.uid(), club_id) IN ('admin', 'staff'));

CREATE POLICY "Admin/staff can delete sesiones_ent"
ON public.sesiones_entrenamiento FOR DELETE
TO authenticated
USING (get_user_club_role(auth.uid(), club_id) IN ('admin', 'staff'));

-- asistencia_entrenamiento
DROP POLICY IF EXISTS "Members can insert asistencia_ent" ON public.asistencia_entrenamiento;
DROP POLICY IF EXISTS "Members can update asistencia_ent" ON public.asistencia_entrenamiento;
DROP POLICY IF EXISTS "Members can delete asistencia_ent" ON public.asistencia_entrenamiento;
DROP POLICY IF EXISTS "Members can view asistencia_ent" ON public.asistencia_entrenamiento;

CREATE POLICY "Members can view asistencia_ent"
ON public.asistencia_entrenamiento FOR SELECT
TO authenticated
USING (user_belongs_to_club(auth.uid(), club_id));

CREATE POLICY "Admin/staff can insert asistencia_ent"
ON public.asistencia_entrenamiento FOR INSERT
TO authenticated
WITH CHECK (get_user_club_role(auth.uid(), club_id) IN ('admin', 'staff'));

CREATE POLICY "Admin/staff can update asistencia_ent"
ON public.asistencia_entrenamiento FOR UPDATE
TO authenticated
USING (get_user_club_role(auth.uid(), club_id) IN ('admin', 'staff'));

CREATE POLICY "Admin/staff can delete asistencia_ent"
ON public.asistencia_entrenamiento FOR DELETE
TO authenticated
USING (get_user_club_role(auth.uid(), club_id) IN ('admin', 'staff'));
