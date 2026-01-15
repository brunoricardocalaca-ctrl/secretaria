-- Debug query: Check what get_services functions currently exist
-- Run this FIRST to see what's in the database

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_services'
  AND n.nspname = 'public';
