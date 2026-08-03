import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const finance = require("../mcp/finance-client.cjs");

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("first protected request completes device authorization and stores only the access token locally", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-auth-"));
  const credentialFile = path.join(root, "credential.json");
  const opened = [];
  const statuses = [];
  let polls = 0;
  const fetcher = async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/api/public/device/start") {
      return json({
        deviceCode: "device-secret",
        userCode: "ABCD-EFGH",
        verificationUri: "https://finance.example/activate",
        verificationUriComplete: "https://finance.example/activate?code=device-secret",
        expiresIn: 600,
        interval: 0,
      });
    }
    if (pathname === "/api/public/device/token") {
      polls += 1;
      return polls === 1 ? json({ status: "pending" }, 202) : json({ accessToken: "access-secret" });
    }
    assert.equal(options.headers.authorization, "Bearer access-secret");
    return json({ ok: true });
  };

  const response = await finance.authorizedRequest("/api/public/mcp/test", {}, {
    baseUrl: "https://finance.example",
    credentialFile,
    fetcher,
    openBrowser: (url) => opened.push(url),
    onStatus: (status) => statuses.push(status),
    sleep: async () => {},
  });

  assert.equal(response.ok, true);
  assert.deepEqual(opened, ["https://finance.example/activate?code=device-secret"]);
  assert.match(statuses[0].message, /sign-in will open/i);
  assert.deepEqual(JSON.parse(await readFile(credentialFile, "utf8")), { accessToken: "access-secret" });
});

test("authorization truncates device names and honors cancellation", async () => {
  const controller = new AbortController();
  let deviceName = "";
  const fetcher = async (url, options = {}) => {
    if (new URL(url).pathname === "/api/public/device/start") {
      deviceName = JSON.parse(options.body).deviceName;
      controller.abort();
      return json({ deviceCode: "device-secret", verificationUri: "/activate", expiresIn: 600, interval: 0 });
    }
    throw new Error("poll should not run after cancellation");
  };
  await assert.rejects(finance.authorizeDevice({
    baseUrl: "https://finance.example",
    credentialFile: path.join(await mkdtemp(path.join(os.tmpdir(), "bloome-finance-cancel-")), "credential.json"),
    deviceName: "x".repeat(200),
    fetcher,
    openBrowser: async () => {},
    signal: controller.signal,
  }), { name: "AbortError" });
  assert.equal(deviceName.length, 80);
});

test("a revoked credential reauthorizes and retries once", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-reauth-"));
  const credentialFile = path.join(root, "credential.json");
  await writeFile(credentialFile, JSON.stringify({ accessToken: "old-token" }));
  const authorizations = [];
  const fetcher = async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/api/public/device/start") return json({ deviceCode: "device-secret", verificationUri: "/activate", expiresIn: 600, interval: 0 });
    if (pathname === "/api/public/device/token") return json({ accessToken: "new-token" });
    authorizations.push(options.headers.authorization);
    return options.headers.authorization === "Bearer old-token" ? json({ error: "revoked" }, 401) : json({ ok: true });
  };
  const response = await finance.authorizedRequest("/api/public/mcp/test", {}, {
    baseUrl: "https://finance.example",
    credentialFile,
    fetcher,
    openBrowser: async () => {},
    sleep: async () => {},
  });
  assert.equal(response.ok, true);
  assert.deepEqual(authorizations, ["Bearer old-token", "Bearer new-token"]);
});

test("research request starts one workspace run and forwards only the research payload", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-run-"));
  const credentialFile = path.join(root, "credential.json");
  const workspace = path.join(root, "workspace");
  await mkdir(workspace);
  await writeFile(credentialFile, JSON.stringify({ accessToken: "access-secret" }));
  await writeFile(path.join(workspace, "plan.json"), JSON.stringify({ topic: "AI NAND cycle" }));

  const requests = [];
  const fetcher = async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    const body = JSON.parse(options.body);
    requests.push({ pathname, body, authorization: options.headers.authorization });
    if (pathname === "/api/public/mcp/runs/start") return json({ run: { id: "run-1", expiresAt: "2026-08-01T00:00:00.000Z" }, charged: true });
    if (pathname === "/api/public/mcp/research/search") return json({ reports: [{ report_id: "r1" }] });
    return json({ error: "not found" }, 404);
  };

  const result = await finance.researchRequest("search", { corpus: "sell", size: 2 }, workspace, undefined, {
    baseUrl: "https://finance.example",
    credentialFile,
    fetcher,
  });

  assert.equal(result.reports[0].report_id, "r1");
  assert.equal(requests[0].body.topic, "AI NAND cycle");
  assert.match(requests[0].body.workspaceKey, /^[a-f0-9]{64}$/);
  assert.deepEqual(requests[1].body, { runId: "run-1", payload: { corpus: "sell", size: 2 } });
  assert.ok(requests.every((request) => request.authorization === "Bearer access-secret"));
  assert.equal(JSON.parse(await readFile(path.join(workspace, ".bloome-finance-run.json"), "utf8")).runId, "run-1");
});

test("annual unlimited workspaces still require conversational confirmation without charging", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-confirm-"));
  const credentialFile = path.join(root, "credential.json");
  await writeFile(credentialFile, JSON.stringify({ accessToken: "access-secret" }));
  const fetcher = async (url, options = {}) => {
    const body = JSON.parse(options.body);
    if (!body.confirmationId) return json({ confirmationRequired: true, confirmationId: "c".repeat(43), topic: "NAND", cost: 0, balance: 2 });
    return json({ run: { id: "run-1", expiresAt: "2026-08-01T00:00:00.000Z" }, charged: false }, 201);
  };
  const quote = await finance.researchRequest("search", { corpus: "sell" }, root, undefined, { baseUrl: "https://finance.example", credentialFile, fetcher });
  assert.equal(quote.confirmationRequired, true);
  assert.match(quote.message, /included in your annual unlimited plan/);
  assert.equal(await finance.confirmResearchRun(root, "c".repeat(43), undefined, { baseUrl: "https://finance.example", credentialFile, fetcher }).then((result) => result.charged), false);
  assert.equal(JSON.parse(await readFile(path.join(root, ".bloome-finance-run.json"), "utf8")).runId, "run-1");
});

test("workspace billing keys canonicalize aliases and reject missing directories", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-workspace-key-"));
  const workspace = path.join(root, "workspace");
  const alias = path.join(root, "alias");
  await mkdir(workspace);
  await symlink(workspace, alias);
  assert.equal(finance.workspaceKey(workspace), finance.workspaceKey(alias));
  assert.throws(() => finance.workspaceKey(path.join(root, "missing")), /existing directory/);
});

test("a missing remote run closes a stale marker without failing validation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-stale-"));
  const credentialFile = path.join(root, "credential.json");
  await writeFile(credentialFile, JSON.stringify({ accessToken: "access-secret" }));
  await writeFile(path.join(root, ".bloome-finance-run.json"), JSON.stringify({ runId: "run-1", status: "active" }));
  const fetcher = async () => json({ error: "Active run not found" }, 404);
  assert.equal(await finance.completeResearchRun(root, { baseUrl: "https://finance.example", credentialFile, fetcher }), false);
  assert.equal(JSON.parse(await readFile(path.join(root, ".bloome-finance-run.json"), "utf8")).status, "stale");
});

test("revalidating a workspace updates its published report without another run", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-complete-"));
  const credentialFile = path.join(root, "credential.json");
  await writeFile(credentialFile, JSON.stringify({ accessToken: "access-secret" }));
  await writeFile(path.join(root, "report.html"), "<!doctype html><html><body>Report</body></html>");
  await writeFile(path.join(root, ".bloome-finance-run.json"), JSON.stringify({ runId: "run-1", status: "active" }));
  const requests = [];
  const fetcher = async (url, options = {}) => {
    const parsed = new URL(url);
    requests.push({ url: parsed.toString(), method: options.method, authorization: options.headers?.authorization });
    if (parsed.pathname === "/api/public/mcp/runs/run-1/report") {
      return json({
        uploadUrl: "https://storage.example/run-1.html?signature=secret",
        requiredHeaders: { "content-type": "text/html; charset=utf-8" },
        reportUrl: "https://finance.example/reports/run-1",
      });
    }
    if (parsed.hostname === "storage.example") {
      assert.equal(options.headers["content-type"], "text/html; charset=utf-8");
      assert.match(options.body.toString(), /<body>Report<\/body>/);
      return new Response(null, { status: 200 });
    }
    assert.equal(parsed.pathname, "/api/public/mcp/runs/run-1/complete");
    return json({ completed: true, reportUrl: "https://finance.example/reports/run-1" });
  };

  assert.equal(await finance.completeResearchRun(root, { baseUrl: "https://finance.example", credentialFile, fetcher }), "https://finance.example/reports/run-1");
  assert.equal(await finance.completeResearchRun(root, { baseUrl: "https://finance.example", credentialFile, fetcher }), "https://finance.example/reports/run-1");
  assert.deepEqual(requests.map(({ method }) => method), ["POST", "PUT", "POST", "POST", "PUT", "POST"]);
  assert.equal(requests[1].authorization, undefined);
  const saved = JSON.parse(await readFile(path.join(root, ".bloome-finance-run.json"), "utf8"));
  assert.equal(saved.status, "completed");
  assert.equal(saved.reportUrl, "https://finance.example/reports/run-1");
});
