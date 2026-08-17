import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { approvedAnswer, parameterProperties } from "../dsh/schema.mjs";

const root = new URL("../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), "utf8");
}

test("MCP JSON schemas become Harness parameter schemas", () => {
  assert.deepEqual(parameterProperties({
    type: "object",
    properties: {
      workspace: { type: "string", minLength: 1 },
      filters: {
        type: "object",
        properties: { corpus: { type: "string" }, limit: { type: "integer" } },
        required: ["corpus"],
      },
    },
    required: ["workspace"],
  }), {
    workspace: { type: "string", required: true },
    filters: {
      type: "object",
      properties: {
        corpus: { type: "string", required: true },
        limit: { type: "integer" },
      },
    },
  });
});

test("native research confirmation requires the exact approval choice", () => {
  assert.equal(approvedAnswer({ answers: [{ id: "charge", selected: ["Approve"] }] }, "charge"), true);
  assert.equal(approvedAnswer({ answers: [{ id: "charge", selected: ["Cancel"] }] }, "charge"), false);
  assert.equal(approvedAnswer({ answers: [{ id: "charge", selected: ["Approve"], custom: "maybe" }] }, "charge"), false);
  assert.equal(approvedAnswer({ answers: [] }, "charge"), false);
});

test("DeepSeek Harness bundle exposes native host and client faces", async () => {
  const [pkg, patch, host, client] = await Promise.all([
    text("package.json").then(JSON.parse),
    text("cordis.patch.yml"),
    text("dsh/host.mjs"),
    text("dsh/client.jsx"),
  ]);

  assert.equal(pkg.main, "dsh/host.mjs");
  assert.equal(pkg.exports["./client"], "./dist/dsh-client.js");
  assert.equal(pkg.dsh.bundle.patch, "./cordis.patch.yml");
  assert.equal(pkg.dsh.client.platform, "web");
  assert.match(patch, /name: bloome-finance-plugin/);
  assert.match(host, /ctx\.skills\.register\(\{/);
  assert.match(host, /investment-research-agent/);
  assert.match(host, /ctx\.tools\.register\(defineTool/);
  assert.match(host, /ctx\.userQuestions\.ask/);
  assert.match(host, /if \(!approvedAnswer/);
  assert.match(host, /callTool\(definition\.name, args, "claude-code"/);
  assert.doesNotMatch(host, /handleRpc|stdin|stdout/);
  assert.match(client, /kind: "bloome-research"/);
  assert.match(await text("dist/dsh-client.js"), /__ModuleLoader__\.load\(\{id:'bloome-finance-plugin'/);
  assert.match(client, /event\.type === "tool\/call"/);
  assert.match(client, /event\.type === "tool\/result"/);
  assert.match(client, /conversation\.chat\.node/);
  assert.match(client, /shell\.overlay/);
  assert.match(client, /useSyncExternalStore/);
  assert.doesNotMatch(client, /conversation\.details\.business|name: ["']details["']/);
});
