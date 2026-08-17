import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = await mkdtemp(path.join(os.tmpdir(), "bloome-report-bundle-"));
const output = path.join(temp, "render-report.cjs");
try {
  await build({ entryPoints:[path.join(root, "src/report/render-report.jsx")], bundle:true, minify:true, legalComments:"none", define:{"process.env.NODE_ENV":"\"production\""}, platform:"node", format:"cjs", outfile:output, logLevel:"silent" });
  const [expected, actual] = await Promise.all([readFile(output), readFile(path.join(root, "dist/render-report.cjs"))]);
  assert.deepEqual(actual, expected, "dist/render-report.cjs is stale; run npm run build:report");
  process.stdout.write("Verified bundled React report renderer\n");
} finally {
  await rm(temp, { recursive:true, force:true });
}
