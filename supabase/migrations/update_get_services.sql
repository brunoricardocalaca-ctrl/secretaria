-- First, let's see what exists (run this separately to debug if needed)
-- SELECT proname, proargtypes, prosrc FROM pg_proc WHERE proname = 'get_services';

-- Drop ALL versions of get_services function (with any signature)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 'DROP FUNCTION IF EXISTS ' || oid::regprocedure || ' CASCADE;' as drop_cmd
        FROM pg_proc 
        WHERE proname = 'get_services'
    LOOP
        EXECUTE r.drop_cmd;
    END LOOP;
END $$;

-- Create the new get_services function
-- IMPORTANT: Using p_tenant_id (text) to match N8N's existing calls
-- IMPORTANT: Using camelCase column names (tenantId, createdAt) as per Prisma mapping
-- Returns JSONB array for better compatibility with Supabase REST API
CREATE OR REPLACE FUNCTION get_services(p_tenant_id text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'service', service_data.name,
            'tags', service_data.tags,
            'negative_tags', service_data.negative_tags
        )
    )
    INTO result
    FROM (
        SELECT 
            s.name,
            COALESCE(s.tags, '') as tags,
            COALESCE(s.rules->>'negativeTags', '') as negative_tags
        FROM services s
        WHERE s."tenantId"::text = p_tenant_id
          AND s.active = true
        ORDER BY s."createdAt" DESC
    ) as service_data;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_services(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_services(text) TO anon;
GRANT EXECUTE ON FUNCTION get_services(text) TO service_role;