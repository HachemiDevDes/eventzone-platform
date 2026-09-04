import { neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_FZvhADTj74ir@ep-super-tooth-b2zv27hp-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function testConnection() {
  try {
    const sql = neon(DATABASE_URL);
    const result = await sql`SELECT version(), current_database(), current_user;`;
    console.log("✓ Successfully connected to Neon Postgres!");
    console.log("Database Info:", result[0]);
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

testConnection();
