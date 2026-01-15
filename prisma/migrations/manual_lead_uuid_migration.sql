-- Migration: Change Lead ID to Supabase UUID
-- ATENÇÃO: Este script preserva os dados existentes

-- Passo 1: Adicionar uma nova coluna temporária com UUID
ALTER TABLE leads ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- Passo 2: Preencher a nova coluna com UUIDs para registros existentes
UPDATE leads SET new_id = gen_random_uuid() WHERE new_id IS NULL;

-- Passo 3: Criar tabela temporária para mapear IDs antigos para novos
CREATE TEMP TABLE lead_id_mapping AS
SELECT id as old_id, new_id
FROM leads;

-- Passo 4: Adicionar colunas temporárias nas tabelas dependentes
ALTER TABLE conversations ADD COLUMN new_leadId UUID;
ALTER TABLE appointments ADD COLUMN new_leadId UUID;
ALTER TABLE transactions ADD COLUMN new_leadId UUID;

-- Passo 5: Atualizar as referências usando o mapeamento
UPDATE conversations c
SET new_leadId = m.new_id
FROM lead_id_mapping m
WHERE c.leadId = m.old_id;

UPDATE appointments a
SET new_leadId = m.new_id
FROM lead_id_mapping m
WHERE a.leadId = m.old_id;

UPDATE transactions t
SET new_leadId = m.new_id
FROM lead_id_mapping m
WHERE t.leadId = m.old_id;

-- Passo 6: Remover constraints antigas
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_leadId_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_leadId_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_leadId_fkey;

-- Passo 7: Remover primary key antiga da tabela leads
ALTER TABLE leads DROP CONSTRAINT leads_pkey;

-- Passo 8: Remover colunas antigas
ALTER TABLE conversations DROP COLUMN leadId;
ALTER TABLE appointments DROP COLUMN leadId;
ALTER TABLE transactions DROP COLUMN leadId;
ALTER TABLE leads DROP COLUMN id;

-- Passo 9: Renomear novas colunas
ALTER TABLE conversations RENAME COLUMN new_leadId TO leadId;
ALTER TABLE appointments RENAME COLUMN new_leadId TO leadId;
ALTER TABLE transactions RENAME COLUMN new_leadId TO leadId;
ALTER TABLE leads RENAME COLUMN new_id TO id;

-- Passo 10: Tornar as colunas NOT NULL
ALTER TABLE conversations ALTER COLUMN leadId SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN leadId SET NOT NULL;
ALTER TABLE leads ALTER COLUMN id SET NOT NULL;

-- Passo 11: Adicionar nova primary key
ALTER TABLE leads ADD PRIMARY KEY (id);

-- Passo 12: Recriar foreign keys
ALTER TABLE conversations 
ADD CONSTRAINT conversations_leadId_fkey 
FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_leadId_fkey 
FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_leadId_fkey 
FOREIGN KEY (leadId) REFERENCES leads(id);

-- Passo 13: Recriar índice único
CREATE UNIQUE INDEX IF NOT EXISTS leads_whatsapp_instanceName_key 
ON leads(whatsapp, instanceName);

-- Verificação final
SELECT 
    'leads' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_ids
FROM leads
UNION ALL
SELECT 
    'conversations',
    COUNT(*),
    COUNT(DISTINCT leadId)
FROM conversations
UNION ALL
SELECT 
    'appointments',
    COUNT(*),
    COUNT(DISTINCT leadId)
FROM appointments
UNION ALL
SELECT 
    'transactions',
    COUNT(*),
    COUNT(DISTINCT leadId)
FROM transactions;
