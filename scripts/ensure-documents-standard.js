const { Client } = require("pg");
require("dotenv").config({ path: ".env" });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        // 1. Verify if 'knowledge_base' exists
        const checkTable = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'knowledge_base'
            );
        `);

        if (checkTable.rows[0].exists) {
            console.log("Found 'knowledge_base' table. Migrating data to 'documents'...");

            // Migrar dados (ignorar duplicados por conteúdo e tenant)
            const migrateRes = await client.query(`
                INSERT INTO "documents" (id, tenant_id, content, metadata, embedding, "createdAt")
                SELECT id, tenant_id, content, metadata, embedding, "createdAt"
                FROM "knowledge_base"
                ON CONFLICT (id) DO NOTHING;
            `);

            console.log(`Migrated ${migrateRes.rowCount} records.`);

            // Sugestão: Manter a tabela por enquanto, mas avisar o usuário que ela pode ser removida
            console.log("Data migration complete. You can now safely remove the 'knowledge_base' table if desired.");
        } else {
            console.log("Table 'knowledge_base' not found. No migration needed.");
        }

        // 2. Ensure consistency in 'documents' table
        console.log("Ensuring metadata consistency in 'documents'...");

        // Exemplo: Marcar itens órfãos como generic training se não tiverem tipo
        const cleanupRes = await client.query(`
            UPDATE "documents"
            SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{type}', '"general"')
            WHERE metadata->>'type' IS NULL;
        `);
        console.log(`Updated ${cleanupRes.rowCount} records with default type.`);

    } catch (err) {
        console.error("Standardization Error:", err);
    } finally {
        await client.end();
    }
}

main();
