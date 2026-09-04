import { neon } from "@neondatabase/serverless";
import https from "https";

const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_FZvhADTj74ir@ep-super-tooth-b2zv27hp-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(NEON_DATABASE_URL);

// We can query Supabase SQL via management API or fetch direct JSON
// Let's create an import function that takes full rows
async function importTableData(tableName, rows) {
  if (!rows || rows.length === 0) {
    console.log(` • ${tableName}: 0 rows`);
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
      console.warn(`   [${tableName}] insert notice (${row.id}):`, e.message);
    }
  }

  console.log(` ✓ [${tableName}] Successfully migrated ${inserted}/${rows.length} rows.`);
}

export { importTableData };
