
-- Fix legacy staff_roles without club_id: link to existing club
UPDATE public.staff_roles SET club_id = 'fc2bdf6d-c346-4f37-a064-7eba1293615a' WHERE club_id IS NULL;

-- Fix legacy personas without club_id
UPDATE public.personas SET club_id = 'fc2bdf6d-c346-4f37-a064-7eba1293615a' WHERE club_id IS NULL;

-- Fix legacy categorias without club_id
UPDATE public.categorias SET club_id = 'fc2bdf6d-c346-4f37-a064-7eba1293615a' WHERE club_id IS NULL;

-- Remove duplicate staff_roles (keep latest)
DELETE FROM public.staff_roles a USING public.staff_roles b
WHERE a.id < b.id AND a.persona_id = b.persona_id AND a.rol = b.rol AND a.club_id = b.club_id;

-- Drop old unique constraint if exists and create proper one
ALTER TABLE public.staff_roles DROP CONSTRAINT IF EXISTS staff_roles_persona_id_rol_key;
ALTER TABLE public.staff_roles ADD CONSTRAINT staff_roles_persona_rol_club_unique UNIQUE (persona_id, rol, club_id);
