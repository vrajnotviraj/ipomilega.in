// Self-check: the desktop column count for the stage groups. Run with: node components/shareholder-quota/columns.check.mjs
import assert from "node:assert/strict";

const { desktopColumns } = await import("./columns.ts");

assert.equal(desktopColumns([1, 2, 2]), 3); // approved, filed, listed: 1 + 2 fill a row of 3
assert.equal(desktopColumns([1, 1, 2, 1, 2]), 4); // buy, approved, filed fill a row of 4
assert.equal(desktopColumns([4]), 4);
assert.equal(desktopColumns([3, 3]), 3);
assert.equal(desktopColumns([5]), 3); // rows of 3 leave 1 empty, rows of 4 leave 3
console.log("columns: ok");
