import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const server = require("../mcp/server.cjs");

async function fixtureWorkspace() {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-research-test-"));
  const evidence = [
    { claim:"需求扩张",claim_ids:["C1"],relation:"support",stance:"support",kind:"fact",corpus:"sell",chunk_id:"s1",report_id:"sr1",quote:"需求增长",source_type:"institutional-research",title:"NAND Market Outlook",source_path:"sell/report.pdf",page_start:1,published_at:"2026-07-01" },
    { claim:"交付约束",claim_ids:["C1"],relation:"challenge",stance:"challenge",kind:"fact",corpus:"primary",chunk_id:"p1",report_id:"pr1",quote:"交付仍受约束",source_type:"interview",title:"Industry Interview",source_path:"primary/interview.txt",line_start:2,line_end:3,published_at:"2026-07-02" },
  ];
  const coverage = {
    retrieval_rounds: [{ corpus:"sell" }, { corpus:"primary" }],
    query_seeds:["AI NAND demand", "NAND delivery constraints"],
    stopping_reason:"Additional searches repeated the same claims and did not close the remaining company-level gap.",
    remaining_gaps:["Company product mix"],
    sell_reports_retrieved:3, primary_sources_retrieved:2,
    sell_reports_read:2, primary_sources_read:2,
  };
  const sectionTitles = ["Executive judgment", "Causal mechanism"];
  const chapters = Array.from({ length:sectionTitles.length }, (_, offset) => {
    const index = offset + 1;
    return [
      `# ${sectionTitles[offset]}`,
      "",
      "## Evidence and transmission",
      "",
      `第${index}章保留完整的论证链：需求扩张先改变订单能见度，再通过库存与供给纪律影响价格弹性；这个判断以可追溯数据为基础，而不是把行业常识当作证据。[NAND Market Outlook, p.1]${index === 1 ? " 综合排序为 base > challenger。" : ""}`,
      "",
      "还需要把公司层面的产品组合、资本开支节奏和客户验证周期放回同一个测算框架，避免只用单一总量指标推导盈利结果。情景测算必须说明假设变化如何传导到收入、利润率和估值区间。",
      "",
      "## Boundary and opposing evidence",
      "",
      "边界条件是交付约束可能让需求信号晚于预期兑现，且独立产业访谈仍显示供应链存在不确定性。[Industry Interview, lines 2-3] 如果后续订单、库存或报价没有按时间窗口改善，应下调判断强度而不是删除反方证据。",
    ].join("\n");
  });
  const visualPlans = [
    {
      title:"Demand visibility improves before pricing reaches earnings",
      brief:"Show how inventory discipline gates the transmission from orders to pricing while keeping customer qualification uncertainty visible.",
    },
  ];
  const outline = sectionTitles.map((title, index) => {
    const visual = visualPlans[index];
    return [
      `# ${title}`, "Explain the section's purpose, evidence, caveat, and investment implication.",
      visual ? `Possible visual: ${visual.title}. ${visual.brief}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");
  const finalReport = chapters.join("\n\n");
  const visibleCitations = chapters.map(() => `<span class="src">NAND Market Outlook<span class="tip"><u>需求增长</u></span></span><blockquote class="primary-quote">交付仍受约束<cite>Industry Interview · 2026-07-02</cite></blockquote>`).join("");
  const figures = visualPlans.map((visual) => `<figure aria-label="${visual.title}"><h3>${visual.title}</h3><svg viewBox="0 0 640 240" role="img" aria-label="${visual.title}"><text>Demand</text></svg><div class="chart-source">NAND Market Outlook · evidence s1 p1</div></figure>`);
  const reportSections = chapters.map((chapter, index) => `<section>${chapter}${figures[index] || ""}</section>`).join("");
  const html = `<!doctype html><html><body><div class="report"><div class="top-bar"></div><div class="header"><div class="header-title">NAND cycle</div><div class="header-meta">2026年7月</div></div><div class="section judge-box">${reportSections}${visibleCitations}</div><div class="source-bar">Sources</div><div class="bottom-bar"></div></div></body></html>`;
  const moduleMemo = [
    "# Direct answer", "需求与供给纪律共同决定周期弹性。[NAND Market Outlook, p.1]",
    "# Claim–evidence pairs", "chunk_id: `s1`\n\n需求扩张构成支持证据。[NAND Market Outlook, p.1]\n\nchunk_id: `p1`\n\n产业访谈对交付节奏构成反方校准。[Industry Interview, lines 2-3]",
    "# Metrics", "跟踪订单、库存、报价和资本开支，并保留每个数字的原始定位。",
    "# Conflicts and date reconciliation", "同一证据链采用较新日期，独立来源的分歧继续保留。",
    "# Invalidating conditions", "若订单和报价未在验证窗口改善，则需求传导假设失效。",
    "# Remaining gaps", "公司产品组合与客户验证节奏仍需更多独立来源。",
  ].join("\n\n");
  const modules = ["demand"].map((id, index) => ({
    id,
    question:`question ${index}`,
    scope:`scope ${index}`,
    support_hypothesis:`support ${index}`,
    challenge_hypothesis:`challenge ${index}`,
    evidence_needed:[`evidence ${index}`],
    query_seeds:[`query ${index}`],
  }));
  const files = {
    "state.json": JSON.stringify({ topic:"AI 与 NAND",current_judgment:"需求和供给共同进入验证期。" }),
    "plan.json": JSON.stringify({ topic:"AI 与 NAND",modules }),
    "sell_side_logic.md":"# Logic\n\n## C1 需求扩张\n",
    "validation.md":"# Validation\n\n## C1 需求扩张\n",
    "evidence_disposition.md":"# Evidence disposition\n\n## Demand module\n\n- Accepted `s1` as decisive support for C1 because it directly measures demand growth.\n- Accepted `p1` as decisive challenge evidence for C1 because it limits the timing of delivery.\n",
    "decision.md":"# Decision\n\n## Rule\n\nPrioritize probability of success, then compare payoff only after alternatives use the same valuation date and forecast basis.\n\n## Ranking\n\nbase > challenger\n\n## Reasoning\n\nBase ranks first because its evidence is stronger and more direct. Challenger has higher theoretical payoff, but more of it depends on unverified timing. Both are compared on the same valuation date and forecast year, using `s1` and `p1` for C1. The representative exposure is stated explicitly for each alternative.\n",
    "report_outline.md":outline,
    "final_report.md":finalReport,
    "report.md":finalReport,
    "report.html":html,
    "evidence.json":JSON.stringify(evidence),
    "coverage_stats.json":JSON.stringify(coverage),
  };
  for (const module of modules) files[`modules/${module.id}.md`]=moduleMemo;
  for (const [index, chapter] of chapters.entries()) files[`chapter_${String(index + 1).padStart(2,"0")}_section.md`]=chapter;
  await mkdir(path.join(root, "modules"));
  await Promise.all(Object.entries(files).map(([name, content]) => writeFile(path.join(root, name), content)));
  return root;
}

test("MCP initializes and exposes the six focused tools", async () => {
  const initialized = await server.handleRpc({ jsonrpc:"2.0",id:1,method:"initialize",params:{} }, "codex");
  const listed = await server.handleRpc({ jsonrpc:"2.0",id:2,method:"tools/list",params:{} }, "codex");
  assert.equal(initialized.result.serverInfo.name, "bloome-finance-plugin");
  assert.deepEqual(listed.result.tools.map((tool) => tool.name), [
    "research_search", "research_get_chunk", "research_get_report_context", "confirm_research_run", "open_research_workspace", "validate_research_workspace",
  ]);
  for (const definition of listed.result.tools.slice(0, 3)) {
    assert.ok(definition.inputSchema.required.includes("workspace"));
    assert.equal(definition.annotations.idempotentHint, false);
    assert.equal(definition.annotations.destructiveHint, false);
  }
  assert.equal(listed.result.tools.find((tool) => tool.name === "confirm_research_run").annotations.destructiveHint, true);
  assert.equal(listed.result.tools.at(-1).annotations.destructiveHint, true);
});

test("runtime profiles keep host-specific presentation out of the shared research core", async () => {
  const codex = await server.handleRpc({ jsonrpc:"2.0",id:1,method:"tools/list",params:{} }, "codex");
  const claude = await server.handleRpc({ jsonrpc:"2.0",id:2,method:"tools/list",params:{} }, "claude-code");
  const workbuddy = await server.handleRpc({ jsonrpc:"2.0",id:3,method:"tools/list",params:{} }, "workbuddy");
  const codexOpen = codex.result.tools.find((tool) => tool.name === "open_research_workspace");
  const claudeOpen = claude.result.tools.find((tool) => tool.name === "open_research_workspace");
  const workbuddyOpen = workbuddy.result.tools.find((tool) => tool.name === "open_research_workspace");
  assert.ok(codexOpen._meta);
  assert.equal(claudeOpen._meta, undefined);
  assert.equal(workbuddyOpen._meta, undefined);
  assert.match(claudeOpen.description, /reportPath/);
  assert.match(workbuddyOpen.description, /reportPath/);

  const claudeInit = await server.handleRpc({ jsonrpc:"2.0",id:4,method:"initialize",params:{} }, "claude-code");
  const workbuddyInit = await server.handleRpc({ jsonrpc:"2.0",id:5,method:"initialize",params:{} }, "workbuddy");
  assert.equal(claudeInit.result.capabilities.resources, undefined);
  assert.equal(workbuddyInit.result.capabilities.resources, undefined);
  assert.match(claudeInit.result.instructions, /Claude Code/);
  assert.match(workbuddyInit.result.instructions, /WorkBuddy/);
  assert.match(claudeInit.result.instructions, /confirmationRequired as a quote, not an error or quota block/);
});

test("research proxy starts a confirmed workspace run through Bloome Finance", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bloome-finance-proxy-test-"));
  const credentialFile = path.join(root, "credential.json");
  const workspace = path.join(root, "workspace");
  await mkdir(workspace);
  await writeFile(credentialFile, JSON.stringify({ accessToken:"device-token" }));
  await writeFile(path.join(workspace, "plan.json"), JSON.stringify({ topic:"AI NAND" }));
  const paths = [];
  const payload = await server.researchProxy("/search", { workspace,corpus:"sell",size:2 }, undefined, {
    baseUrl:"https://finance.example",
    credentialFile,
    fetcher:async (url, options) => {
      const pathname = new URL(url).pathname;
      paths.push(pathname);
      assert.equal(options.headers.authorization, "Bearer device-token");
      return new Response(JSON.stringify(pathname.endsWith("/start")
        ? { run:{ id:"run-1",expiresAt:"2026-08-01T00:00:00.000Z" },charged:true }
        : { reports:[{ report_id:"1" }] }), { status:200 });
    },
  });
  assert.deepEqual(paths, ["/api/public/mcp/runs/start", "/api/public/mcp/research/search"]);
  assert.equal(payload.reports[0].report_id, "1");
});

test("workspace snapshot drives progress, evidence, and native report preview", async () => {
  const workspace = await fixtureWorkspace();
  const snapshot = server.buildSnapshot(workspace);
  assert.equal(snapshot.topic, "AI 与 NAND");
  assert.equal(snapshot.progress, 100);
  assert.equal(snapshot.stage, 5);
  assert.equal(snapshot.evidence.length, 2);
  assert.match(snapshot.reportHtml, /class="report"/);
  assert.equal(snapshot.reportPath, path.join(workspace, "report.html"));
});

test("non-Codex workspace responses return paths without injecting report HTML", async () => {
  const workspace = await fixtureWorkspace();
  for (const runtime of ["claude-code", "workbuddy"]) {
    const snapshot = await server.callTool("open_research_workspace", { workspace }, runtime);
    assert.equal(snapshot.runtime, runtime);
    assert.equal(snapshot.workbenchAvailable, false);
    assert.equal(snapshot.reportHtml, undefined);
    assert.equal(snapshot.reportPath, path.join(workspace, "report.html"));
  }
});

test("workspace validator enforces all staged and report contracts", async () => {
  const workspace = await fixtureWorkspace();
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.equal(result.chapters, 2);
});

test("successful workspace validation closes its Bloome Finance run", async () => {
  const workspace = await fixtureWorkspace();
  const credentialFile = path.join(workspace, "credential.json");
  await writeFile(credentialFile, JSON.stringify({ accessToken:"device-token" }));
  await writeFile(path.join(workspace, ".bloome-finance-run.json"), JSON.stringify({ runId:"run-1",status:"active" }));
  const previousFetch = globalThis.fetch;
  const previousCredential = process.env.BLOOME_FINANCE_CREDENTIAL_FILE;
  const previousUrl = process.env.BLOOME_FINANCE_URL;
  process.env.BLOOME_FINANCE_CREDENTIAL_FILE = credentialFile;
  process.env.BLOOME_FINANCE_URL = "https://finance.example";
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/public/mcp/runs/run-1/report") {
      assert.equal(options.headers.authorization, "Bearer device-token");
      return new Response(JSON.stringify({
        uploadUrl:"https://storage.example/run-1.html",
        requiredHeaders:{ "content-type":"text/html; charset=utf-8" },
        reportUrl:"https://finance.example/reports/run-1",
      }), { status:200 });
    }
    if (parsed.hostname === "storage.example") {
      assert.equal(options.headers.authorization, undefined);
      assert.match(options.body.toString(), /class="report"/);
      return new Response(null, { status:200 });
    }
    assert.equal(parsed.pathname, "/api/public/mcp/runs/run-1/complete");
    assert.equal(options.headers.authorization, "Bearer device-token");
    return new Response(JSON.stringify({ completed:true,reportUrl:"https://finance.example/reports/run-1" }), { status:200 });
  };
  try {
    const result = await server.validateWorkspace(workspace);
    assert.equal(result.ok, true, result.errors.join("\n"));
    assert.equal(result.financeRunCompleted, true);
    assert.equal(result.reportUrl, "https://finance.example/reports/run-1");
    assert.equal(JSON.parse(await readFile(path.join(workspace, ".bloome-finance-run.json"), "utf8")).status, "completed");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousCredential === undefined) delete process.env.BLOOME_FINANCE_CREDENTIAL_FILE;
    else process.env.BLOOME_FINANCE_CREDENTIAL_FILE = previousCredential;
    if (previousUrl === undefined) delete process.env.BLOOME_FINANCE_URL;
    else process.env.BLOOME_FINANCE_URL = previousUrl;
  }
});

test("workspace validator accepts the zip template's single-page HTML without an embedded evidence ledger", async () => {
  const workspace = await fixtureWorkspace();
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, true, result.errors.join("\n"));
  const html = await readFile(path.join(workspace, "report.html"), "utf8");
  assert.doesNotMatch(html, /data-report-tab|data-evidence-section/);
});

test("workspace validator requires claim-linked evidence", async () => {
  const workspace = await fixtureWorkspace();
  const evidencePath = path.join(workspace, "evidence.json");
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  delete evidence[0].claim_ids;
  await writeFile(evidencePath, JSON.stringify(evidence));
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("s1: missing claim_ids"));
});

test("workspace validator rejects shallow module and chapter artifacts", async () => {
  const workspace = await fixtureWorkspace();
  await writeFile(path.join(workspace, "modules/demand.md"), "# Direct answer\n");
  await writeFile(path.join(workspace, "chapter_01_section.md"), "# Chapter\n\nA title without evidence.\n");
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /module demand is title-only/.test(error)));
  assert.ok(result.errors.some((error) => /chapter_01_section\.md requires at least one exact source citation/.test(error)));
});

test("workspace validator allows final synthesis to rewrite chapter drafts", async () => {
  const workspace = await fixtureWorkspace();
  const synthesis = await readFile(path.join(workspace, "chapter_01_section.md"), "utf8");
  await Promise.all([
    writeFile(path.join(workspace, "final_report.md"), synthesis),
    writeFile(path.join(workspace, "report.md"), synthesis),
  ]);
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("workspace validator rejects summary HTML that omits the Markdown report", async () => {
  const workspace = await fixtureWorkspace();
  const summaryHtml = `<!doctype html><html><body><div class="report"><div class="top-bar"></div><div class="header"><div class="header-title">Summary</div><div class="header-meta">2026年7月</div></div><div class="section judge-box">Only a short dashboard summary.</div><div class="source-bar">Sources</div><div class="bottom-bar"></div></div></body></html>`;
  await writeFile(path.join(workspace, "report.html"), summaryHtml);
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /HTML omits report\.md narrative/.test(error)));
});

test("research artifacts use natural headings without internal section or visual IDs", async () => {
  const workspace = await fixtureWorkspace();
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, true, result.errors.join("\n"));
  const outline = await readFile(path.join(workspace, "report_outline.md"), "utf8");
  const html = await readFile(path.join(workspace, "report.html"), "utf8");
  assert.doesNotMatch(outline, /\b[SV]\d{2}\b/);
  assert.doesNotMatch(html, /data-(?:section|visual)-id/);
});

test("workspace validator allows a topic with no useful visual", async () => {
  const workspace = await fixtureWorkspace();
  const outlinePath = path.join(workspace, "report_outline.md");
  const htmlPath = path.join(workspace, "report.html");
  const outline = await readFile(outlinePath, "utf8");
  const html = await readFile(htmlPath, "utf8");
  await Promise.all([
    writeFile(outlinePath, outline.replace(/^Possible visual:.*\n?/m, "")),
    writeFile(htmlPath, html.replace(/<figure\b[\s\S]*?<\/figure>/, "")),
  ]);
  const result = await server.validateWorkspace(workspace);
  assert.equal(result.ok, true, result.errors.join("\n"));
});

test("widget resource is a self-contained MCP app with real Bloome assets", async () => {
  const html = server.resourceText();
  assert.match(html, /data:image\/svg\+xml;base64,/);
  assert.match(html, /--blue:#2556b6/);
  assert.match(html, /window\.openai\?\.callTool/);
  assert.match(html, /The plugin shell does not restyle this document/);
  assert.doesNotMatch(html, /\{\{BLOOME_WORDMARK\}\}/);
});
