-- Grant API roles access to the knowledge_base schema
-- Fixes: "Could not find the table 'public.knowledge_base.tenders' in the schema cache"
-- The knowledge_base schema was created in 00012 but never granted to PostgREST roles.

-- 1. Grant permissions to all API roles (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA knowledge_base TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA knowledge_base TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA knowledge_base GRANT SELECT ON TABLES TO anon, authenticated, service_role;

-- 2. Expose knowledge_base schema to PostgREST by adding it to the authenticator role config
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, storage, graphql_public, knowledge_base';

-- 3. Reload PostgREST config
NOTIFY pgrst, 'reload config';
