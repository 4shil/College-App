-- Allow registration (anon) to fetch programmes via SECURITY DEFINER RPC
-- Date: 2026-01-07

DO $$
BEGIN
  -- get_programmes(UUID)
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_programmes'
      AND p.pronargs = 1
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_programmes(UUID) TO anon';
  END IF;

  -- get_degree_programs(UUID)
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_degree_programs'
      AND p.pronargs = 1
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_degree_programs(UUID) TO anon';
  END IF;
END $$;
