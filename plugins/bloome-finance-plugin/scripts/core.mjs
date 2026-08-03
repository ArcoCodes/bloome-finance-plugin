import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function assertPlan(modules) {
  if (!Array.isArray(modules) || !modules.length) throw new Error("Research plan requires at least one module");
  const normalized = (value) => String(value).normalize("NFKC").trim().toLowerCase();
  for (const key of ["id", "question", "scope"]) {
    const values = modules.map((module) => normalized(module[key]));
    if (values.some((value) => !value) || new Set(values).size !== values.length) throw new Error(`Module ${key}s must be present and unique`);
  }
  for (const module of modules) {
    if (normalized(module.support_hypothesis) === normalized(module.challenge_hypothesis)) throw new Error(`Module ${module.id} must use distinct support and challenge hypotheses`);
  }
}

export function workspacePath(cwd, requested, topic) {
  const root = path.resolve(cwd, ".bloome", "research");
  const slug = topic.normalize("NFKC").replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 48) || "research";
  const workspace = requested ? path.resolve(cwd, requested) : path.join(root, `${new Date().toISOString().replace(/[:.]/g, "-")}-${slug}`);
  const relative = path.relative(root, workspace);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("workspace must stay under .bloome/research in the current project");
  return workspace;
}

export async function savePlan(cwd, topic, requested, modules) {
  assertPlan(modules);
  const workspace = workspacePath(cwd, requested, topic);
  await mkdir(path.join(workspace, "modules"), { recursive: true });
  await writeFile(path.join(workspace, "plan.json"), `${JSON.stringify({ topic, generated_at: new Date().toISOString(), modules }, null, 2)}\n`);
  return workspace;
}

export async function loadPlan(cwd, workspace, topic, modules) {
  const root = workspacePath(cwd, workspace, topic);
  let plan;
  try { plan = JSON.parse(await readFile(path.join(root, "plan.json"), "utf8")); } catch { throw new Error("Save the research plan before running modules"); }
  const savedIds = (plan.modules ?? []).map((module) => String(module.id)).sort();
  const requestedIds = (modules ?? []).map((module) => String(module.id)).sort();
  if (plan.topic !== topic || savedIds.length !== requestedIds.length || savedIds.some((id, index) => id !== requestedIds[index])) {
    throw new Error("Run modules with the saved topic and matching module IDs");
  }
  return root;
}

function locator(item) {
  if (item.page_start != null) return `${item.page_end != null && item.page_end !== item.page_start ? "pp" : "p"}.${item.page_start}${item.page_end != null && item.page_end !== item.page_start ? `-${item.page_end}` : ""}`;
  return `line${item.line_end != null && item.line_end !== item.line_start ? "s" : ""} ${item.line_start}${item.line_end != null && item.line_end !== item.line_start ? `-${item.line_end}` : ""}`;
}

function normalizedNarrative(value) {
  return value.replace(/[^\p{Letter}\p{Number}]+/gu, "").toLowerCase();
}

function htmlNarrative(html) {
  return normalizedNarrative(html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39);/g, " "));
}

function preservesNarrative(report, html) {
  const rendered = htmlNarrative(html);
  const segments = report
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\[([^\]\n]+)\]\([^)\n]+\)/g, "$1")
    .replace(/(?:\[[^\]\n]+\]|〔[^〕\n]+〕|【[^】\n]+】)/g, "\n")
    .split(/\n+/)
    .map((line) => normalizedNarrative(line.replace(/<[^>]*>/g, " ")))
    .filter(Boolean);
  return segments.every((segment) => rendered.includes(segment));
}

export function validateReport(report, html, evidence, staged = {}) {
  const errors = [];
  const warnings = [];
  const claimIds = (markdown) => new Set([...String(markdown ?? "").matchAll(/\bC\d+\b/gi)].map((match) => match[0].toUpperCase()));
  const logicClaimIds = claimIds(staged.sellSideLogic);
  const validationClaimIds = claimIds(staged.validation);
  const stagedClaimIds = new Set([...logicClaimIds, ...validationClaimIds]);
  for (const id of logicClaimIds) if (!validationClaimIds.has(id)) errors.push(`Claim ${id} is missing from validation.md`);
  for (const id of validationClaimIds) if (!logicClaimIds.has(id)) errors.push(`Claim ${id} is missing from sell_side_logic.md`);
  const citations = new Set();
  for (const item of evidence) {
    for (const key of ["claim", "stance", "kind", "corpus", "chunk_id", "report_id", "quote", "source_type", "title", "source_path", "published_at"]) {
      if (!String(item[key] ?? "").trim()) errors.push(`${item.chunk_id || "unknown"}: missing ${key}`);
    }
    const linkedClaims = Array.isArray(item.claim_ids) ? item.claim_ids.map((id) => String(id).toUpperCase()) : [];
    if (!linkedClaims.length) errors.push(`${item.chunk_id || "unknown"}: missing claim_ids`);
    for (const id of linkedClaims) if (!stagedClaimIds.has(id)) errors.push(`${item.chunk_id || "unknown"}: unknown claim_id ${id}`);
    if (!["support", "challenge", "context"].includes(item.relation)) errors.push(`${item.chunk_id || "unknown"}: invalid relation`);
    if (item.page_start == null && item.line_start == null) errors.push(`${item.chunk_id}: missing page/line locator`);
    citations.add(`${item.title}, ${locator(item)}`);
  }
  for (const id of stagedClaimIds) {
    const linked = evidence.filter((item) => Array.isArray(item.claim_ids) && item.claim_ids.some((claimId) => String(claimId).toUpperCase() === id));
    if (!linked.length) errors.push(`Claim ${id} has no linked evidence`);
    else {
      if (!linked.some((item) => item.relation === "support")) warnings.push(`Claim ${id} has no linked support evidence`);
      if (!linked.some((item) => item.relation === "challenge")) warnings.push(`Claim ${id} has no linked challenge evidence`);
    }
  }
  const found = [...report.matchAll(/(?:\[([^\]\n]+)\]|〔([^〕\n]+)〕|【([^】\n]+)】)/g)]
    .map((match) => ({ citation: match[1] ?? match[2] ?? match[3] }))
    .filter(({ citation }) => /,\s*(?:p{1,2}\.\d+(?:-\d+)?|lines? \d+(?:-\d+)?)/.test(citation));
  if (!found.length) errors.push("Report must contain reader-facing citations");
  const matchedEvidence = found.map((citation) => evidence.find((item) => `${item.title}, ${locator(item)}` === citation.citation));
  for (const citation of found) if (!citations.has(citation.citation)) errors.push(`Citation has no matching evidence: ${citation.citation}`);
  if (!evidence.some((item) => item.stance === "challenge")) errors.push("At least one challenge evidence item is required");
  if (/\b(?:sell|primary|corpus|report_id|chunk_id|BM25|research_(?:search|plan|run_modules|synthesize))\b|模块/i.test(report)) errors.push("Report contains internal workflow jargon");
  if (!/^<!doctype html>/i.test(html.trimStart()) || !/class=["'][^"']*report/i.test(html)) errors.push("HTML must be a complete report document");
  if (!preservesNarrative(report, html)) errors.push("HTML omits report.md narrative; render every heading, paragraph, table row, and citation context instead of rewriting a summary");
  const requiredTemplateClasses = ["report", "top-bar", "header", "header-title", "header-meta", "section", "judge-box", "source-bar", "bottom-bar"];
  const missingTemplateClasses = requiredTemplateClasses.filter((name) => !new RegExp(`class\\s*=\\s*[\"'][^\"']*\\b${name}\\b`).test(html));
  if (missingTemplateClasses.length) errors.push(`HTML must preserve assets/template.html structure; missing: ${missingTemplateClasses.join(", ")}`);
  if (/\{\{[^}]+\}\}/.test(html)) errors.push("HTML contains unresolved template placeholders");
  const classes = [...html.matchAll(/class\s*=\s*["']([^"']*)["']/gi)].map((match) => match[1].split(/\s+/));
  const sourceCount = classes.filter((names) => names.includes("src")).length;
  const tooltipCount = classes.filter((names) => names.includes("tip")).length;
  const underlineCount = (html.match(/<u\b/gi) ?? []).length;
  const primaryQuoteCount = classes.filter((names) => names.includes("primary-quote")).length;
  const sellCitationCount = matchedEvidence.filter((item) => item?.corpus === "sell").length;
  const primaryCitationCount = matchedEvidence.filter((item) => item?.corpus === "primary").length;
  const primaryTooltipCount = Math.max(0, sourceCount - sellCitationCount);
  if (sourceCount < sellCitationCount || tooltipCount < sellCitationCount || underlineCount < sellCitationCount || primaryQuoteCount + primaryTooltipCount < primaryCitationCount) {
    errors.push("Every Markdown citation must have a matching visible citation: sell citations require src tooltips; primary citations require a visible primary-quote or a tooltip");
  }
  if (primaryQuoteCount && /专家纪要\s*\/\s*产业访谈\s*·\s*日期|evidence\.json\s*回填|来源待填/i.test(html)) {
    errors.push("Primary quote source must be populated from evidence.json, not a generic placeholder");
  }
  const origins = new Map();
  for (const item of evidence) {
    if (!item.origin_id) continue;
    const reports = origins.get(item.origin_id) ?? new Set();
    reports.add(item.report_id);
    origins.set(item.origin_id, reports);
  }
  for (const [origin, reports] of origins) if (reports.size > 1) warnings.push(`Evidence from shared origin ${origin} is not independent corroboration`);
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

export async function saveDeliverables(cwd, workspace, report, html, evidence) {
  const root = workspacePath(cwd, workspace, "research");
  await mkdir(root, { recursive: true });
  await Promise.all([
    writeFile(path.join(root, "report.md"), report.endsWith("\n") ? report : `${report}\n`),
    writeFile(path.join(root, "report.html"), html.endsWith("\n") ? html : `${html}\n`),
    writeFile(path.join(root, "evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`),
  ]);
  return { workspace: path.relative(cwd, root), report: path.relative(cwd, path.join(root, "report.md")), html: path.relative(cwd, path.join(root, "report.html")), evidence: path.relative(cwd, path.join(root, "evidence.json")) };
}

export async function saveWorkspaceArtifact(cwd, workspace, filename, content) {
  const root = workspacePath(cwd, workspace, "research");
  await mkdir(root, { recursive: true });
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  const target = path.join(root, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, normalized);
  return { workspace: path.relative(cwd, root), path: path.relative(cwd, target) };
}

export async function saveWorkspaceJson(cwd, workspace, filename, value) {
  const root = workspacePath(cwd, workspace, "research");
  await mkdir(root, { recursive: true });
  const target = path.join(root, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
  return { workspace: path.relative(cwd, root), path: path.relative(cwd, target) };
}
