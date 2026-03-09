-- ====================================================
-- RLS POLICY FIX FOR SECURITY DEFINER FUNCTIONS
-- ====================================================

-- The owner of the `has_role` function (postgres) needs to be able to 
-- bypass RLS on the `user_roles` table to check a user's role.
-- By default, only the table owner bypasses RLS. The table owner is `supabase_admin`.
-- We change the owner of the `user_roles` table to `postgres` so that the 
-- `SECURITY DEFINER` function runs as the table owner, thus bypassing RLS.

ALTER TABLE public.user_roles OWNER TO postgres;

-- We also grant all privileges on this table to the original service roles for good measure.
GRANT ALL ON TABLE public.user_roles TO supabase_admin;
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT ALL ON TABLE public.user_roles TO service_role;
