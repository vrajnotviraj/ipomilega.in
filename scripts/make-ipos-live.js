/* eslint-disable @typescript-eslint/no-require-imports */
// Moves up to N analysed IPOs into the "Live" bucket by rewriting their open/close dates,
// for demoing the Live section when nothing is live.
// Usage: node scripts/make-ipos-live.js [count=5]

const fs = require("fs");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    const eq = trimmed.indexOf("=");
    if (trimmed.startsWith("#") || eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

const COUNT = parseInt(process.argv[2], 10) || 5;

// "D Month" with no year: the app's date parser adds the current year, so it never goes stale.
const formatDate = (d) => `${d.getDate()} ${d.toLocaleString("en-US", { month: "long" })}`;

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    throw new Error("Missing MONGODB_URI or MONGODB_DB (checked process.env and .env.local)");
  }

  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });

  await client.connect();
  const db = client.db(dbName);

  try {
    const analysisDocs = await db
      .collection("ipo_comprehensive_analysis")
      .find({}, { projection: { ipo_table_id: 1 } })
      .toArray();
    const analyzedIds = new Set(analysisDocs.map((a) => String(a.ipo_table_id)).filter(Boolean));

    if (analyzedIds.size === 0) {
      console.log("No IPOs with analysis found in ipo_comprehensive_analysis. Nothing to do.");
      return;
    }

    const allIpos = await db.collection("ipos").find({}).toArray();
    const candidates = allIpos.filter((ipo) => analyzedIds.has(String(ipo._id)));

    if (candidates.length === 0) {
      console.log("Found analysis docs, but none matched an ipos._id. Check ipo_table_id values.");
      return;
    }

    const targets = candidates.slice(0, COUNT);
    console.log(`Making ${targets.length} IPO(s) live (out of ${candidates.length} with analysis)...\n`);

    for (const ipo of targets) {
      // Opened 1-3 days ago, closes in 2-5 days, so the IPOs don't all look identical.
      const openStr = formatDate(daysFromToday(-(1 + Math.floor(Math.random() * 3))));
      const closeStr = formatDate(daysFromToday(2 + Math.floor(Math.random() * 4)));
      const name = ipo.upcoming_ipo_2025 || ipo.ipo_name || "(unnamed)";

      const result = await db.collection("ipos").updateOne(
        { _id: ipo._id },
        {
          $set: {
            "ipo_dates.ipo_open_date": openStr,
            "ipo_dates.ipo_close_date": closeStr,
            open_date: openStr,
            closing_date: closeStr,
          },
        }
      );

      console.log(
        `${name} (${ipo._id}) -> open: "${openStr}", close: "${closeStr}" | modified: ${result.modifiedCount}`
      );
    }

    console.log("\nDone.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
