// Creates the indexes the app's query patterns rely on. Idempotent -- safe to re-run, and
// worth running after any restore. Usage: node scripts/ensure-indexes.mjs
import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const i = line.indexOf('=');
      if (i < 1 || line.trim().startsWith('#')) continue;
      const k = line.slice(0, i).trim();
      if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
    }
  }
}
loadEnv();

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);

const plan = [
  // /analysis/[slug] and /api/analysis/[id] resolve an IPO by slug on every request.
  ['ipos', { slug: 1 }, { name: 'slug_1' }],
  // Admin's "recently added" bucket sorts on this.
  ['ipos', { scraped_at: -1 }, { name: 'scraped_at_-1' }],
  // The IPO -> analysis join key.
  ['ipo_comprehensive_analysis', { ipo_table_id: 1 }, { name: 'ipo_table_id_1' }],
  ['ipo_comprehensive_analysis', { slug: 1 }, { name: 'slug_1' }],
  // Blog list queries: filter on status, sort on created_at.
  ['blogs', { status: 1, created_at: -1 }, { name: 'status_1_created_at_-1' }],
  ['blogs', { slug: 1 }, { name: 'slug_1' }],
  ['categories', { status: 1, category: 1 }, { name: 'status_1_category_1' }],
];

for (const [coll, keys, opts] of plan) {
  try {
    const name = await db.collection(coll).createIndex(keys, opts);
    console.log(`ok   ${coll}.${name}`);
  } catch (err) {
    console.log(`skip ${coll} ${JSON.stringify(keys)}: ${err.message}`);
  }
}

await client.close();
