import { neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_FZvhADTj74ir@ep-super-tooth-b2zv27hp-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);

async function check() {
  const events = await sql`SELECT id, name, location, capacity, status FROM events;`;
  console.log("Seeded Events on Neon:", events);
}

check();
