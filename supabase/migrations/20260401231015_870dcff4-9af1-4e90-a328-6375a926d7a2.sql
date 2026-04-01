
-- Fix clubs insert policy: allow any authenticated user to create
DROP POLICY IF EXISTS "Anyone can create clubs" ON public.clubs;
CREATE POLICY "Authenticated users can create clubs"
ON public.clubs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix club_usuarios insert policy: allow self-insert when club has no members yet (first user = admin)
DROP POLICY IF EXISTS "Admins can manage members" ON public.club_usuarios;
CREATE POLICY "Users can join or admins manage members"
ON public.club_usuarios FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.club_usuarios cu WHERE cu.club_id = club_usuarios.club_id
  ))
  OR
  get_user_club_role(auth.uid(), club_id) = 'admin'
);
