
-- 1. Clubs table
CREATE TABLE public.clubs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  deporte text NOT NULL DEFAULT 'Básquetbol',
  ciudad text NULL,
  logo_url text NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- 2. Profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NULL,
  avatar_url text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Club users (membership)
CREATE TABLE public.club_usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol_sistema text NOT NULL DEFAULT 'viewer',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);
ALTER TABLE public.club_usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Module permissions per staff role
CREATE TABLE public.permisos_modulo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  rol_staff text NOT NULL,
  modulo text NOT NULL,
  puede_ver boolean NOT NULL DEFAULT true,
  puede_editar boolean NOT NULL DEFAULT false,
  puede_eliminar boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.permisos_modulo ENABLE ROW LEVEL SECURITY;

-- 5. Security definer function to check club membership role
CREATE OR REPLACE FUNCTION public.get_user_club_role(_user_id uuid, _club_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol_sistema FROM public.club_usuarios
  WHERE user_id = _user_id AND club_id = _club_id AND activo = true
  LIMIT 1
$$;

-- 6. Security definer function to check if user belongs to club
CREATE OR REPLACE FUNCTION public.user_belongs_to_club(_user_id uuid, _club_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_usuarios
    WHERE user_id = _user_id AND club_id = _club_id AND activo = true
  )
$$;

-- 7. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. RLS Policies

-- profiles: users see own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System creates profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- clubs: members can see their clubs
CREATE POLICY "Members can view their clubs" ON public.clubs FOR SELECT
  USING (public.user_belongs_to_club(auth.uid(), id));
CREATE POLICY "Admins can update clubs" ON public.clubs FOR UPDATE
  USING (public.get_user_club_role(auth.uid(), id) = 'admin');
CREATE POLICY "Anyone can create clubs" ON public.clubs FOR INSERT WITH CHECK (true);

-- club_usuarios: members see co-members, admins manage
CREATE POLICY "Members can view club members" ON public.club_usuarios FOR SELECT
  USING (public.user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can manage members" ON public.club_usuarios FOR INSERT
  WITH CHECK (public.get_user_club_role(auth.uid(), club_id) = 'admin' OR NOT EXISTS (SELECT 1 FROM public.club_usuarios WHERE club_id = club_usuarios.club_id));
CREATE POLICY "Admins can update members" ON public.club_usuarios FOR UPDATE
  USING (public.get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete members" ON public.club_usuarios FOR DELETE
  USING (public.get_user_club_role(auth.uid(), club_id) = 'admin');

-- permisos_modulo: members can see, admins manage
CREATE POLICY "Members can view permissions" ON public.permisos_modulo FOR SELECT
  USING (public.user_belongs_to_club(auth.uid(), club_id));
CREATE POLICY "Admins can manage permissions" ON public.permisos_modulo FOR INSERT
  WITH CHECK (public.get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can update permissions" ON public.permisos_modulo FOR UPDATE
  USING (public.get_user_club_role(auth.uid(), club_id) = 'admin');
CREATE POLICY "Admins can delete permissions" ON public.permisos_modulo FOR DELETE
  USING (public.get_user_club_role(auth.uid(), club_id) = 'admin');
