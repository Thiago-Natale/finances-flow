-- Add UNIQUE constraint on usuarios.login to prevent race conditions
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_login_unique UNIQUE (login);

-- Add UNIQUE constraint on usuarios.email as well for consistency
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_email_unique UNIQUE (email);