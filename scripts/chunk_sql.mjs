import fs from "fs";

const sqlFile = "d:/Antigravity Projects/Event calendar/scripts/generated_migration.sql";
const content = fs.readFileSync(sqlFile, "utf-8");
const statements = content.split(";\n").filter(s => s.trim().length > 0).map(s => s.trim() + ";");

console.log(`Total statements: ${statements.length}`);

// Let's create batch chunks of 15
const chunks = [];
const chunkSize = 15;
for (let i = 0; i < statements.length; i += chunkSize) {
  chunks.push(statements.slice(i, i + chunkSize).join("\n"));
}

fs.writeFileSync("d:/Antigravity Projects/Event calendar/scripts/migration_chunks.json", JSON.stringify(chunks, null, 2), "utf-8");
console.log(`Created ${chunks.length} chunks in scripts/migration_chunks.json`);
