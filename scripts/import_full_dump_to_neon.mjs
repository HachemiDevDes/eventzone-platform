import { neon } from "@neondatabase/serverless";
import fs from "fs";

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_FZvhADTj74ir@ep-super-tooth-b2zv27hp-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(NEON_DATABASE_URL);

// Parse dump from step 438
const stepFile = "C:/Users/hache/.gemini/antigravity/brain/67408c53-d0c4-467a-a790-dca75fc2afc6/.system_generated/steps/438/output.txt";
const fileContent = fs.readFileSync(stepFile, "utf-8");
const parsedWrapper = JSON.parse(fileContent);
const rawResult = parsedWrapper.result;
const startIdx = rawResult.indexOf('{"full_backup":');
const endIdx = rawResult.lastIndexOf("}") + 1;
const backupData = JSON.parse(rawResult.substring(startIdx, endIdx)).full_backup;

const IMPORT_ORDER = [
  "profiles",
  "events",
  "organizations",
  "sponsors",
  "exhibitors",
  "sessions",
  "tickets",
  "team_members",
  "floor_plans",
  "forms",
  "form_submissions",
  "participants",
  "rsvps",
  "influencers"
];

async function importTable(tableName, rows) {
  if (!rows || rows.length === 0) {
    console.log(` • [${tableName}]: 0 rows`);
    return;
  }

  const colDefs = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName};
  `;
  const colTypeMap = {};
  colDefs.forEach(c => colTypeMap[c.column_name] = c.data_type.toLowerCase());

  let inserted = 0;
  for (const row of rows) {
    const keys = Object.keys(row).filter(k => colTypeMap[k] !== undefined);
    const values = keys.map(k => {
      const v = row[k];
      if (v === null || v === undefined) return null;
      const colType = colTypeMap[k];
      if (colType === "jsonb" || colType === "json") {
        return typeof v === "string" ? v : JSON.stringify(v);
      }
      if (colType === "array") {
        return Array.isArray(v) ? v : [v];
      }
      return v;
    });

    const cols = keys.map(k => `"${k}"`).join(", ");
    const placeholders = keys.map((k, i) => {
      const colType = colTypeMap[k];
      if (colType === "jsonb") return `$${i + 1}::jsonb`;
      if (colType === "json") return `$${i + 1}::json`;
      return `$${i + 1}`;
    }).join(", ");

    const updates = keys.filter(k => k !== "id").map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");
    const onConflictClause = updates.length > 0
      ? `ON CONFLICT (id) DO UPDATE SET ${updates}`
      : `ON CONFLICT (id) DO NOTHING`;

    const insertSql = `
      INSERT INTO public."${tableName}" (${cols})
      VALUES (${placeholders})
      ${onConflictClause};
    `;

    try {
      await sql.query(insertSql, values);
      inserted++;
    } catch (e) {
      console.warn(`   [${tableName}] notice on ${row.id}:`, e.message);
    }
  }

  console.log(` ✓ [${tableName}] Migrated ${inserted}/${rows.length} rows.`);
}

async function run() {
  console.log("Starting full Neon database import from dump...");
  for (const table of IMPORT_ORDER) {
    await importTable(table, backupData[table]);
  }
  console.log("\n===============================================");
  console.log("Full Neon database import successfully finished!");
  console.log("===============================================");
}

run();
