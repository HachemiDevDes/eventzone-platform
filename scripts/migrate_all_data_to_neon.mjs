import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";

const SUPABASE_URL = "https://awkreadldqmidcrrqukm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3a3JlYWRsZHFtaWRjcnJxdWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MDY2MzgsImV4cCI6MjA5ODE4MjYzOH0.OuXsk83gk4b9IUkS5K_cwCcM2u0JYUv6m-H4V5H8P5E";
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_FZvhADTj74ir@ep-super-tooth-b2zv27hp-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const sql = neon(NEON_DATABASE_URL);

// Fix column types on Neon first
async function fixColumnTypes() {
  console.log("Adjusting column types on Neon...");
  const typeFixes = [
    `ALTER TABLE public.events ALTER COLUMN template_id TYPE TEXT;`,
    `ALTER TABLE public.events ALTER COLUMN start_date TYPE TEXT;`,
    `ALTER TABLE public.events ALTER COLUMN end_date TYPE TEXT;`,
    `ALTER TABLE public.sessions ALTER COLUMN date TYPE TEXT;`,
  ];
  for (const fix of typeFixes) {
    try {
      await sql.query(fix);
    } catch (e) {
      console.warn("Type fix notice:", e.message);
    }
  }
}

const TABLES_IN_ORDER = [
  "profiles",
  "events",
  "organizations",
  "sponsors",
  "exhibitors",
  "sessions",
  "tickets",
  "team_members",
  "floor_plans",
  "communications",
  "forms",
  "form_submissions",
  "participants",
  "pending_registrations",
  "rsvps",
  "rsvp_settings",
  "influencers",
  "opportunities",
  "connections",
  "developer_api_keys",
  "developer_webhooks"
];

async function migrateTable(tableName) {
  console.log(`\nMigrating table: ${tableName}...`);
  try {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) {
      console.warn(`Could not read ${tableName} via REST:`, error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log(` • 0 rows found in ${tableName}`);
      return;
    }

    // Get column types on Neon for this table
    const colDefs = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName};
    `;
    const colTypeMap = {};
    colDefs.forEach(c => {
      colTypeMap[c.column_name] = c.data_type.toLowerCase();
    });

    console.log(` • Found ${data.length} rows in Supabase. Inserting into Neon...`);

    let inserted = 0;
    for (const row of data) {
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
      } catch (insertErr) {
        console.warn(`   Error inserting row in ${tableName} (${row.id}):`, insertErr.message);
      }
    }

    console.log(` ✓ Successfully migrated ${inserted}/${data.length} rows in ${tableName}`);
  } catch (err) {
    console.error(`Error migrating ${tableName}:`, err);
  }
}

async function run() {
  await fixColumnTypes();
  console.log("Starting full data migration from Supabase to Neon PostgreSQL...");

  for (const t of TABLES_IN_ORDER) {
    await migrateTable(t);
  }

  console.log("\n==========================================");
  console.log("Data migration completed!");
  console.log("==========================================");
}

run();
