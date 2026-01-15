-- Migration: Change Lead ID to Supabase UUID (SIMPLIFIED - Table is Empty)
-- Execute este script no Supabase SQL Editor

-- 1. Remover foreign keys que dependem de leads.id
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_leadId_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_leadId_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_leadId_fkey;

-- 2. Remover primary key da tabela leads
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_pkey;

-- 3. Alterar o tipo da coluna id para UUID com default do Supabase
ALTER TABLE leads ALTER COLUMN id DROP DEFAULT;
ALTER TABLE leads ALTER COLUMN id TYPE UUID USING id::uuid;
ALTER TABLE leads ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Recriar primary key
ALTER TABLE leads ADD PRIMARY KEY (id);

-- 5. Alterar tipo das colunas leadId nas tabelas dependentes
ALTER TABLE conversations ALTER COLUMN leadId TYPE UUID USING leadId::uuid;
ALTER TABLE appointments ALTER COLUMN leadId TYPE UUID USING leadId::uuid;
ALTER TABLE transactions ALTER COLUMN leadId TYPE UUID USING leadId::uuid;

-- 6. Recriar foreign keys
ALTER TABLE conversations 
ADD CONSTRAINT conversations_leadId_fkey 
FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_leadId_fkey 
FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_leadId_fkey 
FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE;

-- 7. Verificação
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name IN ('leads', 'conversations', 'appointments', 'transactions')
  AND column_name IN ('id', 'leadId')
ORDER BY table_name, column_name;
