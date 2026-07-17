import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env", import.meta.url),"utf8").split("\n")){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const { Client } = await import("pg");
for (const ssl of [{ rejectUnauthorized: false }, false]) {
  try {
    const c = new Client({ connectionString: process.env.DATABASE_URL, ssl, connectionTimeoutMillis: 8000 });
    await c.connect();
    const r = await c.query("select version()");
    console.log(`ssl=${JSON.stringify(ssl)} => OK:`, r.rows[0].version.slice(0,50));
    await c.end();
    process.exit(0);
  } catch (e) { console.log(`ssl=${JSON.stringify(ssl)} => FAIL:`, e.message.slice(0,90)); }
}
process.exit(1);
