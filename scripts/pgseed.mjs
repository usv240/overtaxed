import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env", import.meta.url),"utf8").split("\n")){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const { Client } = await import("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false} });
await c.connect();
await c.query(`INSERT INTO saved_properties (country,pin,address,region) VALUES ('US','P001','3212 N Racine Ave, Chicago IL','Cook County') ON CONFLICT DO NOTHING`);
console.log("seeded; rows:", (await c.query("select count(*) from saved_properties")).rows[0].count);
await c.end();
