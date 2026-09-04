import { neon } from "@neondatabase/serverless";
import fs from "fs";

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_FZvhADTj74ir@ep-super-tooth-b2zv27hp-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(NEON_DATABASE_URL);

// Parse columns from step 387
const stepFile = "C:/Users/hache/.gemini/antigravity/brain/67408c53-d0c4-467a-a790-dca75fc2afc6/.system_generated/steps/387/output.txt";
const fileContent = fs.readFileSync(stepFile, "utf-8");
const parsedWrapper = JSON.parse(fileContent);
const rawResult = parsedWrapper.result;
const startIdx = rawResult.indexOf("[{");
const endIdx = rawResult.lastIndexOf("}]") + 2;
const columns = JSON.parse(rawResult.substring(startIdx, endIdx));

async function syncSchema() {
  console.log("Synchronizing schema definitions with Neon Postgres...");

  const tables = new Set();
  const stmts = [];

  for (const col of columns) {
    const { table_name, column_name, data_type } = col;
    if (table_name.startsWith("_") || table_name.startsWith("pg_")) continue;

    tables.add(table_name);
    let pgType = data_type;
    if (data_type === "USER-DEFINED") pgType = "TEXT";
    if (data_type === "ARRAY") pgType = "TEXT[]";

    stmts.push(`ALTER TABLE public."${table_name}" ADD COLUMN IF NOT EXISTS "${column_name}" ${pgType};`);
  }

  // Ensure tables exist first
  for (const t of tables) {
    try {
      await sql.query(`CREATE TABLE IF NOT EXISTS public."${t}" (id UUID PRIMARY KEY DEFAULT gen_random_uuid());`);
    } catch (e) {}
  }

  // Execute in batches using sql.transaction
  const batchSize = 20;
  for (let i = 0; i < stmts.length; i += batchSize) {
    const chunk = stmts.slice(i, i + batchSize);
    await sql.transaction(chunk.map(s => sql.query(s)));
    console.log(`✓ Processed ${Math.min(i + batchSize, stmts.length)}/${stmts.length} columns...`);
  }

  console.log("✓ Schema synchronized successfully!");
}

syncSchema();
