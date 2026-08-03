"use strict";

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { pathToFileURL } = require("node:url");
const finance = require("./finance-client.cjs");

const ROOT = path.resolve(__dirname, "..");
const PLUGIN_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "plugin.config.json"), "utf8"));
const SERVER_NAME = "bloome-finance-plugin";
const SERVER_VERSION = PLUGIN_CONFIG.version;
const WIDGET_URI = `ui://widget/bloome-finance-${encodeURIComponent(SERVER_VERSION)}.html`;
const WIDGET_MIME = "text/html;profile=mcp-app";
const REQUIRED_FILES = [
  "sell_side_logic.md",
  "validation.md",
  "evidence_disposition.md",
  "decision.md",
  "final_report.md",
  "report.md",
  "report.html",
  "evidence.json",
  "coverage_stats.json",
];

const WORKSPACE_PROPERTY = { type: "string", minLength: 1, description: "Absolute path to this report's .bloome/research workspace." };
const SEARCH_PROPERTIES = {
  workspace: WORKSPACE_PROPERTY,
  corpus: { type: "string", enum: ["sell", "primary"] },
  concepts: {
    type: "array",
    maxItems: 8,
    items: { type: "array", minItems: 1, maxItems: 6, items: { type: "string", minLength: 1, maxLength: 120 } },
  },
  phrases: { type: "array", maxItems: 8, items: { type: "string", minLength: 1, maxLength: 160 } },
  tickers: { type: "array", maxItems: 20, items: { type: "string", minLength: 1, maxLength: 120 } },
  institutions: { type: "array", maxItems: 20, items: { type: "string", minLength: 1, maxLength: 120 } },
  source_types: { type: "array", maxItems: 20, items: { type: "string", minLength: 1, maxLength: 120 } },
  published_from: { type: "string", pattern: "^20\\d{2}-\\d{2}-\\d{2}$" },
  size: { type: "integer", minimum: 1, maximum: 20 },
  chunks_per_report: { type: "integer", minimum: 1, maximum: 3 },
};

function objectSchema(properties, required = []) {
  return { type: "object", properties, required, additionalProperties: false };
}

function widgetMeta(visibility = ["model", "app"]) {
  return {
    ui: { resourceUri: WIDGET_URI, visibility },
    "ui/resourceUri": WIDGET_URI,
    "openai/outputTemplate": WIDGET_URI,
    "openai/widgetAccessible": true,
    "openai/toolInvocation/invoking": "Opening research panel",
    "openai/toolInvocation/invoked": "Research panel ready",
  };
}

function runtimeName(env = process.env) {
  if (env.BLOOME_RUNTIME === "codex" || env.BLOOME_RUNTIME === "claude-code") return env.BLOOME_RUNTIME;
  return env.CLAUDE_PLUGIN_ROOT ? "claude-code" : "codex";
}

function runtimeProfile(runtime = runtimeName()) {
  const billing = "Treat confirmationRequired as a quote, not an error or quota block: show its topic, cost, and balance, ask the user to confirm, then call confirm_research_run only after explicit approval and retry the original retrieval with the same workspace.";
  if (runtime === "claude-code") {
    return {
      name: runtime,
      supportsWorkbench: false,
      instructions: `Use Claude Code as the reasoning runtime. Preserve the investment research workflow and assets/template.html report contract. Use the returned reportPath to inspect the finished HTML report. ${billing}`,
    };
  }
  return {
    name: "codex",
    supportsWorkbench: true,
    instructions: `Use Codex as the reasoning runtime. Preserve the investment research workflow and assets/template.html report contract. Bloome styling applies only to the workbench shell. ${billing}`,
  };
}

function tool(name, title, description, inputSchema, options = {}) {
  const definition = {
    name,
    title,
    description,
    inputSchema,
    annotations: {
      readOnlyHint: options.readOnly !== false,
      destructiveHint: Boolean(options.destructive),
      idempotentHint: options.idempotent !== false,
      openWorldHint: Boolean(options.openWorld),
    },
  };
  if (options.widget) definition._meta = widgetMeta();
  return definition;
}

function toolDefinitions(runtime = runtimeName()) {
  const profile = runtimeProfile(runtime);
  return [
    tool(
      "research_search",
      "Search investment research",
      "Search the controlled professional research corpus. Expert and firsthand evidence has higher decision weight than institutional reports. Before the first retrieval call, tell the user that Bloome Finance may open in their browser for sign-in and device approval. A new workspace returns a quote without charging; stop, show its topic, returned cost, and balance, then call confirm_research_run only after explicit user approval. Later requests in the same active run do not charge again.",
      objectSchema(SEARCH_PROPERTIES, ["workspace", "corpus"]),
      { openWorld: true, readOnly: false, idempotent: false },
    ),
    tool(
      "research_get_chunk",
      "Read an exact source chunk",
      "Fetch one source chunk with its exact locator for evidence traceability. Before the first retrieval call, explain possible browser sign-in. If a quote is returned, stop and obtain explicit user approval before calling confirm_research_run.",
      objectSchema(
        {
          workspace: WORKSPACE_PROPERTY,
          corpus: { type: "string", enum: ["sell", "primary"] },
          chunk_id: { type: "string", minLength: 1, maxLength: 80 },
        },
        ["workspace", "corpus", "chunk_id"],
      ),
      { openWorld: true, readOnly: false, idempotent: false },
    ),
    tool(
      "research_get_report_context",
      "Read surrounding report context",
      "Fetch ordered chunks around a known location in one report. Before the first retrieval call, explain possible browser sign-in. If a quote is returned, stop and obtain explicit user approval before calling confirm_research_run.",
      objectSchema(
        {
          workspace: WORKSPACE_PROPERTY,
          corpus: { type: "string", enum: ["sell", "primary"] },
          report_id: { type: "string", minLength: 1 },
          chunk_no: { type: "integer", minimum: 1 },
          radius: { type: "integer", minimum: 0, maximum: 4 },
        },
        ["workspace", "corpus", "report_id"],
      ),
      { openWorld: true, readOnly: false, idempotent: false },
    ),
    tool(
      "confirm_research_run",
      "Confirm paid research",
      "Start the quoted workspace run using its returned cost (zero with active annual unlimited access, otherwise one credit). Call only after the user explicitly confirms the confirmation_required message in conversation, then retry the original research tool call.",
      objectSchema(
        {
          workspace: WORKSPACE_PROPERTY,
          confirmationId: { type: "string", minLength: 43, maxLength: 43 },
        },
        ["workspace", "confirmationId"],
      ),
      { openWorld: true, readOnly: false, destructive: true },
    ),
    tool(
      "open_research_workspace",
      profile.supportsWorkbench ? "Open Bloome Research" : "Inspect Bloome Research workspace",
      profile.supportsWorkbench
        ? "Open the Bloome research workbench for an absolute project workspace path. The UI promotes from a compact conversation launcher into a native PiP panel and expands to fullscreen for the report while preserving the investment skill's native report HTML."
        : "Inspect an absolute Bloome research workspace path and return progress, evidence, artifacts, and report paths. Read report.html from reportPath to view the finished report in Claude Code.",
      objectSchema({ workspace: { type: "string", minLength: 1 } }, ["workspace"]),
      { widget: profile.supportsWorkbench },
    ),
    tool(
      "validate_research_workspace",
      "Validate investment report",
      "Validate required staged files, evidence traceability, chapter substance, report completeness, and the native report template contract. Successful validation closes the active Bloome Finance run.",
      objectSchema({ workspace: { type: "string", minLength: 1 } }, ["workspace"]),
      { readOnly: false, destructive: true },
    ),
  ];
}

async function researchProxy(endpoint, body, signal, options) {
  const operation = { "/search": "search", "/chunk": "chunk", "/context": "context" }[endpoint];
  if (!operation) throw new Error(`unknown research endpoint: ${endpoint}`);
  const { workspace, ...payload } = body;
  return finance.researchRequest(operation, payload, workspace, signal, options);
}

function readText(file, fallback = "") {
  try { return fs.readFileSync(file, "utf8"); }
  catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
}

function readJson(file, fallback) {
  const text = readText(file);
  if (!text) return fallback;
  try { return JSON.parse(text); }
  catch { return fallback; }
}

function workspacePath(value) {
  if (!value || !path.isAbsolute(value)) throw new Error("workspace must be an absolute path");
  return path.resolve(value);
}

function firstParagraph(markdown) {
  return markdown
    .split(/\n\s*\n/)
    .map((part) => part.replace(/^#+\s+.*$/gm, "").trim())
    .find(Boolean) || "等待形成可验证的核心判断。";
}

function artifactList(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((name) => name === "plan.json" || REQUIRED_FILES.includes(name) || /^report_outline\.(md|json)$/.test(name) || /^chapter_\d+_.*\.md$/.test(name))
    .sort()
    .map((name) => ({ name, bytes: fs.statSync(path.join(root, name)).size }));
}

function stageFromArtifacts(names) {
  if (names.has("report.html")) return 5;
  if (names.has("validation.md")) return 4;
  if (names.has("sell_side_logic.md")) return 3;
  if (names.has("plan.json") || names.has("report_outline.md") || names.has("report_outline.json")) return 2;
  return 1;
}

function buildSnapshot(workspace, options = {}) {
  const root = workspacePath(workspace);
  const state = readJson(path.join(root, "state.json"), {});
  const plan = readJson(path.join(root, "plan.json"), {});
  const evidence = readJson(path.join(root, "evidence.json"), []);
  const coverage = readJson(path.join(root, "coverage_stats.json"), {});
  const reportHtml = readText(path.join(root, "report.html"));
  const report = readText(path.join(root, "final_report.md"), readText(path.join(root, "report.md")));
  const artifacts = artifactList(root);
  const names = new Set(artifacts.map((item) => item.name));
  const stage = stageFromArtifacts(names);
  const chapterCount = artifacts.filter((item) => item.name.startsWith("chapter_")).length;
  const requiredReady = REQUIRED_FILES.filter((name) => names.has(name)).length +
    (names.has("report_outline.md") || names.has("report_outline.json") ? 1 : 0);
  const progress = Math.min(100, Math.round((requiredReady / (REQUIRED_FILES.length + 1)) * 90 + (chapterCount ? 10 : 0)));
  const snapshot = {
    ok: true,
    workspace: root,
    topic: state.topic || plan.topic || path.basename(root),
    status: reportHtml ? "ready" : stage >= 3 ? "researching" : "planning",
    progress,
    stage,
    judgment: state.current_judgment || firstParagraph(report),
    modules: Array.isArray(plan.modules) ? plan.modules : [],
    artifacts,
    evidence: Array.isArray(evidence) ? evidence.slice(0, 100) : [],
    coverage,
    chapterCount,
    reportPath: path.join(root, "report.html"),
  };
  if (options.includeReportHtml !== false) snapshot.reportHtml = reportHtml;
  return snapshot;
}

function coverageErrors(coverage) {
  const errors = [];
  const rounds = Array.isArray(coverage.retrieval_rounds) ? coverage.retrieval_rounds : [];
  for (const corpus of ["sell", "primary"]) {
    if (!rounds.some((round) => round.corpus === corpus)) errors.push(`${corpus} retrieval must be represented in coverage_stats.json`);
  }
  if (!String(coverage.stopping_reason || "").trim()) errors.push("coverage_stats.json requires a retrieval stopping_reason");
  if (!Array.isArray(coverage.remaining_gaps)) errors.push("coverage_stats.json requires a remaining_gaps array");
  return errors;
}

function citations(markdown) {
  return [...markdown.matchAll(/(?:\[([^\]\n]+)\]|〔([^〕\n]+)〕|【([^】\n]+)】)/g)]
    .map((match) => match[1] ?? match[2] ?? match[3])
    .filter((value) => /,\s*(?:p{1,2}\.\d+(?:-\d+)?|lines? \d+(?:-\d+)?)/.test(value));
}

function bodyParagraphs(markdown) {
  return markdown
    .replace(/^#{1,6}\s+.*$/gm, "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function moduleErrors(id, markdown) {
  const errors = [];
  if (!bodyParagraphs(markdown).length) errors.push(`module ${id} is title-only or lacks substantive evidence`);
  if (!citations(markdown).length) errors.push(`module ${id} requires at least one exact source citation`);
  return errors;
}

function chapterErrors(name, markdown) {
  const errors = [];
  if (!bodyParagraphs(markdown).length) errors.push(`${name} is title-only or lacks substantive analysis`);
  if (!citations(markdown).length) errors.push(`${name} requires at least one exact source citation`);
  return errors;
}

async function validateWorkspace(workspace) {
  const root = workspacePath(workspace);
  const core = await import(pathToFileURL(path.join(ROOT, "scripts", "core.mjs")).href);
  const artifacts = artifactList(root);
  const names = new Set(artifacts.map((item) => item.name));
  const errors = REQUIRED_FILES.filter((name) => !names.has(name)).map((name) => `missing ${name}`);
  if (!names.has("report_outline.md")) errors.push("missing report_outline.md");
  const chapterArtifacts = artifacts.filter((item) => item.name.startsWith("chapter_"));
  const chapters = chapterArtifacts.length;
  if (!chapters) errors.push("research workspace requires chapter drafts");

  const plan = readJson(path.join(root, "plan.json"), {});
  const modules = Array.isArray(plan.modules) ? plan.modules : [];
  if (!names.has("plan.json")) errors.push("missing plan.json");
  try { core.assertPlan(modules); } catch (error) { errors.push(error.message); }
  for (const module of modules) {
    const id = String(module.id || "");
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) { errors.push(`invalid module id: ${id || "missing"}`); continue; }
    const memo = readText(path.join(root, "modules", `${id}.md`));
    if (!memo) errors.push(`missing modules/${id}.md`);
    else errors.push(...moduleErrors(id, memo));
  }

  const chapterFiles = chapterArtifacts.map(({ name }) => ({ name, markdown: readText(path.join(root, name)) }));
  for (const chapter of chapterFiles) errors.push(...chapterErrors(chapter.name, chapter.markdown));
  const finalReport = readText(path.join(root, "final_report.md"));

  const evidence = readJson(path.join(root, "evidence.json"), []);
  const report = readText(path.join(root, "report.md"));
  if (report.replace(/\s+/g, " ").trim() !== finalReport.replace(/\s+/g, " ").trim()) {
    errors.push("report.md must match the synthesized final_report.md");
  }
  const html = readText(path.join(root, "report.html"));
  const sellSideLogic = readText(path.join(root, "sell_side_logic.md"));
  const validationMarkdown = readText(path.join(root, "validation.md"));
  const coverage = readJson(path.join(root, "coverage_stats.json"), {});
  errors.push(...coverageErrors(coverage));
  let result;
  if (Array.isArray(evidence) && report && html) {
    const validation = core.validateReport(report, html, evidence, { sellSideLogic, validation: validationMarkdown });
    errors.push(...validation.errors);
    result = { ok: errors.length === 0, workspace: root, errors: [...new Set(errors)], warnings: validation.warnings, artifacts, chapters };
  } else {
    if (!Array.isArray(evidence)) errors.push("evidence.json must be an array");
    result = { ok: errors.length === 0, workspace: root, errors: [...new Set(errors)], warnings: [], artifacts, chapters };
  }
  if (result.ok) {
    const completion = await finance.completeResearchRun(root);
    result.financeRunCompleted = Boolean(completion);
    if (typeof completion === "string") result.reportUrl = completion;
  }
  return result;
}

function resourceMeta() {
  return {
    "openai/widgetDescription": "Bloome investment research panel with progress, evidence, artifacts, and an unmodified native report preview. The inline surface is only a compact launcher.",
    "openai/widgetPrefersBorder": false,
    "openai/widgetCSP": {
      connect_domains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      resource_domains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      frame_domains: [],
    },
    ui: {
      prefersBorder: false,
      csp: {
        connectDomains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        resourceDomains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        frameDomains: [],
      },
    },
  };
}

function resourceText() {
  const html = fs.readFileSync(path.join(ROOT, "assets", "workbench.html"), "utf8");
  const logo = fs.readFileSync(path.join(ROOT, "assets", "wordmark-black.svg")).toString("base64");
  return html.replaceAll("{{BLOOME_WORDMARK}}", `data:image/svg+xml;base64,${logo}`);
}

function resources() {
  return [{
    uri: WIDGET_URI,
    name: "bloome_finance_workbench",
    title: "Bloome Finance Research",
    description: "Native research workspace and investment report viewer.",
    mimeType: WIDGET_MIME,
    _meta: resourceMeta(),
  }];
}

async function callTool(name, args = {}, runtime = runtimeName(), options = {}) {
  if (name === "research_search") return researchProxy("/search", args, options.signal, options);
  if (name === "research_get_chunk") return researchProxy("/chunk", args, options.signal, options);
  if (name === "research_get_report_context") return researchProxy("/context", args, options.signal, options);
  if (name === "confirm_research_run") return finance.confirmResearchRun(args.workspace, args.confirmationId, options.signal, options);
  if (name === "open_research_workspace") {
    const profile = runtimeProfile(runtime);
    return {
      ...buildSnapshot(args.workspace, { includeReportHtml: profile.supportsWorkbench }),
      runtime: profile.name,
      workbenchAvailable: profile.supportsWorkbench,
    };
  }
  if (name === "validate_research_workspace") return validateWorkspace(args.workspace);
  throw new Error(`unknown tool: ${name}`);
}

function toolResult(payload, name, runtime = runtimeName()) {
  const result = {
    content: [{ type: "text", text: JSON.stringify(payload) }],
    structuredContent: payload,
    isError: false,
  };
  if (name === "open_research_workspace" && runtimeProfile(runtime).supportsWorkbench) result._meta = widgetMeta();
  return result;
}

function toolError(error) {
  const payload = { ok: false, error: error?.message || String(error) };
  return { content: [{ type: "text", text: JSON.stringify(payload) }], structuredContent: payload, isError: true };
}

function rpcResponse(id, result) { return { jsonrpc: "2.0", id, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id, error: { code, message } }; }

async function handleRpc(message, runtime = runtimeName(), options = {}) {
  if (!message || typeof message !== "object" || Array.isArray(message)) return rpcError(null, -32600, "Invalid Request");
  const { id, method } = message;
  const params = message.params && typeof message.params === "object" ? message.params : {};
  if (typeof method !== "string") return id == null ? null : rpcError(id, -32600, "Invalid Request");
  if (method.startsWith("notifications/") || method === "$/cancelRequest") return null;
  const profile = runtimeProfile(runtime);
  try {
    if (method === "initialize") return rpcResponse(id, {
      protocolVersion: params.protocolVersion || "2024-11-05",
      capabilities: profile.supportsWorkbench
        ? { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false }, logging: {} }
        : { tools: { listChanged: false }, logging: {} },
      serverInfo: { name: SERVER_NAME, title: "Bloome Investment Research", version: SERVER_VERSION },
      instructions: profile.instructions,
    });
    if (method === "ping") return rpcResponse(id, {});
    if (method === "tools/list") return rpcResponse(id, { tools: toolDefinitions(runtime) });
    if (method === "tools/call") {
      try { return rpcResponse(id, toolResult(await callTool(params.name, params.arguments || {}, runtime, options), params.name, runtime)); }
      catch (error) { return rpcResponse(id, toolError(error)); }
    }
    if (method === "resources/list") return rpcResponse(id, { resources: profile.supportsWorkbench ? resources() : [] });
    if (method === "resources/read") {
      if (!profile.supportsWorkbench) return rpcError(id, -32601, "Resources are not available in this runtime");
      if (params.uri !== WIDGET_URI) return rpcError(id, -32602, `unknown resource: ${params.uri}`);
      return rpcResponse(id, { contents: [{ uri: WIDGET_URI, mimeType: WIDGET_MIME, text: resourceText(), _meta: resourceMeta() }] });
    }
    if (method === "resources/templates/list") return rpcResponse(id, { resourceTemplates: [] });
    if (method === "prompts/list") return rpcResponse(id, { prompts: [] });
    return rpcError(id, -32601, `Method not found: ${method}`);
  } catch (error) {
    return rpcError(id, -32000, error?.message || String(error));
  }
}

function runStdio() {
  const input = readline.createInterface({ input: process.stdin });
  const requests = new Map();
  const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
  input.on("line", async (line) => {
    if (!line.trim()) return;
    let message;
    try { message = JSON.parse(line); }
    catch (error) { send(rpcError(null, -32700, `Parse error: ${error.message}`)); return; }
    if (message.method === "$/cancelRequest") {
      requests.get(message.params?.id)?.abort();
      return;
    }
    const controller = message.method === "tools/call" ? new AbortController() : null;
    if (controller) requests.set(message.id, controller);
    const progressToken = message.params?._meta?.progressToken;
    try {
      const response = await handleRpc(message, runtimeName(), {
        signal: controller?.signal,
        onStatus(status) {
          send({ jsonrpc: "2.0", method: "notifications/message", params: { level: "info", logger: "bloome-finance", data: status.message } });
          if (progressToken !== undefined) {
            send({ jsonrpc: "2.0", method: "notifications/progress", params: { progressToken, progress: 0, total: 1, message: status.message } });
          }
        },
      });
      if (response) send(response);
    } finally {
      if (controller) requests.delete(message.id);
    }
  });
}

module.exports = {
  WIDGET_URI,
  buildSnapshot,
  callTool,
  handleRpc,
  researchProxy,
  resourceText,
  runStdio,
  runtimeName,
  runtimeProfile,
  toolDefinitions,
  validateWorkspace,
};

if (require.main === module) runStdio();
