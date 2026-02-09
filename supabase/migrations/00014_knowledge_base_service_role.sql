-- Fix: also grant knowledge_base schema access to service_role
-- The previous migration (00013) only granted to anon + authenticated

GRANT USAGE ON SCHEMA knowledge_base TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA knowledge_base TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge_base GRANT SELECT ON TABLES TO service_role;

NOTIFY pgrst, 'reload config';
