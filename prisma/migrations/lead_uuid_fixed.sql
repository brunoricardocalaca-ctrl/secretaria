-- Migration: Change Lead ID to Supabase UUID (FIXED CASE SENSITIVITY)
-- Execute este script no Supabase SQL Editor

-- 1. Remover primary key COM CASCADE (remove as foreign keys automaticamente)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_pkey CASCADE;

-- 2. Alterar o tipo da coluna id para UUID com default do Supabase
ALTER TABLE leads ALTER COLUMN id DROP DEFAULT;
ALTER TABLE leads ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE leads ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Recriar primary key
ALTER TABLE leads ADD PRIMARY KEY (id);

-- 4. Alterar tipo das colunas leadId nas tabelas dependentes (COM ASPAS para case-sensitive)
ALTER TABLE conversations ALTER COLUMN "leadId" TYPE UUID USING "leadId"::uuid;
ALTER TABLE appointments ALTER COLUMN "leadId" TYPE UUID USING "leadId"::uuid;
ALTER TABLE transactions ALTER COLUMN "leadId" TYPE UUID USING "leadId"::uuid;

-- 5. Recriar foreign keys
ALTER TABLE conversations 
ADD CONSTRAINT conversations_leadId_fkey 
FOREIGN KEY ("leadId") REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_leadId_fkey 
FOREIGN KEY ("leadId") REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_leadId_fkey 
FOREIGN KEY ("leadId") REFERENCES leads(id) ON DELETE CASCADE;

-- 6. Verificação
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name IN ('leads', 'conversations', 'appointments', 'transactions')
  AND column_name IN ('id', 'leadId')
ORDER BY table_name, column_name;
