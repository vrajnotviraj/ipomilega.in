// scripts/make-ipos-live.js
//
// Picks up to N IPOs that already have an analysis document and forces their
// open/close dates so they land in the "Live" bucket (open_date <= today <=
// close_date) — useful for demoing the Live IPOs section when nothing is
// genuinely live. Works on any IPO regardless of current status (upcoming,
// past, TBA) since it just overwrites the dates outright.
//
// Run with plain Node (uses the same `mongodb` driver + .env.local as the app):
//   node scripts/make-ipos-live.js
//
// Optional: pass a count as the first arg (default 5):
//   node scripts/make-ipos-live.js 3

const fs = require("fs");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

// --- Minimal .env.local loader (no extra dependency) ---
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  });
}
loadEnvLocal();

const COUNT = parseInt(process.argv[2], 10) || 5;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
// "D Month" with no year — the app's date parser appends the current year
// itself when a date string has none, so this never goes stale.
function fmt(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
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
    // 1. Find ipo_table_ids that have an analysis document.
    const analysisDocs = await db
      .collection("ipo_comprehensive_analysis")
      .find({}, { projection: { ipo_table_id: 1 } })
      .toArray();
    const analyzedIds = new Set(analysisDocs.map((a) => String(a.ipo_table_id)).filter(Boolean));

    if (analyzedIds.size === 0) {
      console.log("No IPOs with analysis found in ipo_comprehensive_analysis. Nothing to do.");
      return;
    }

    // 2. Load matching IPO docs.
    const allIpos = await db.collection("ipos").find({}).toArray();
    const candidates = allIpos.filter((ipo) => analyzedIds.has(String(ipo._id)));

    if (candidates.length === 0) {
      console.log("Found analysis docs, but none matched an ipos._id. Check ipo_table_id values.");
      return;
    }

    const targets = candidates.slice(0, COUNT);
    const today = new Date();

    console.log(`Making ${targets.length} IPO(s) live (out of ${candidates.length} with analysis)...\n`);

    for (const ipo of targets) {
      // Stagger dates slightly per IPO so they don't all look identical:
      // open 1-3 days ago, close 2-5 days from now.
      const daysOpenAgo = 1 + Math.floor(Math.random() * 3);
      const daysUntilClose = 2 + Math.floor(Math.random() * 4);

      const openDate = new Date(today);
      openDate.setDate(today.getDate() - daysOpenAgo);
      const closeDate = new Date(today);
      closeDate.setDate(today.getDate() + daysUntilClose);

      const openStr = fmt(openDate);
      const closeStr = fmt(closeDate);

      const name = ipo.upcoming_ipo_2025 || ipo.ipo_name || "(unnamed)";

      const result = await db.collection("ipos").updateOne(
        { _id: ipo._id },
        {
          $set: {
            "ipo_dates.ipo_open_date": openStr,
            "ipo_dates.ipo_close_date": closeStr,
            // top-level fallback fields some components read directly
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
