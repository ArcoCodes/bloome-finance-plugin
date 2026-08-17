import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import citationUtils from "./citations.cjs";

const { citationLabels, locator, normalize, resolveCitation, resolvedCitations } = citationUtils;

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

function normalizedNarrative(value) {
  return value.replace(/[^\p{Letter}\p{Number}]+/gu, "").toLowerCase();
}

export function validateReport(report, evidence, inspection, staged = {}) {
  const errors = [];
  const warnings = [];
  const chineseCharacters = (value) => (String(value ?? "").match(/[\u3400-\u9fff]/g) || []).length;
  const latinCharacters = (value) => (String(value ?? "").match(/[A-Za-z]/g) || []).length;
  const reportIsChinese = chineseCharacters(report) >= 40 && chineseCharacters(report) >= latinCharacters(report);
  const needsChineseTranslation = (value) => latinCharacters(value) >= 20 && chineseCharacters(value) * 4 < latinCharacters(value);
  const claimIds = (markdown) => new Set([...String(markdown ?? "").matchAll(/\bC\d+\b/gi)].map((match) => match[0].toUpperCase()));
  const logicClaimIds = claimIds(staged.sellSideLogic);
  const validationClaimIds = claimIds(staged.validation);
  const stagedClaimIds = new Set([...logicClaimIds, ...validationClaimIds]);
  for (const id of logicClaimIds) if (!validationClaimIds.has(id)) errors.push(`Claim ${id} is missing from validation.md`);
  for (const id of validationClaimIds) if (!logicClaimIds.has(id)) errors.push(`Claim ${id} is missing from sell_side_logic.md`);
  for (const item of evidence) {
    for (const key of ["claim", "stance", "kind", "corpus", "chunk_id", "report_id", "quote", "title", "source_path", "published_at"]) {
      if (!String(item[key] ?? "").trim()) errors.push(`${item.chunk_id || "unknown"}: missing ${key}`);
    }
    if (reportIsChinese && needsChineseTranslation(item.quote)) {
      if (!String(item.quote_zh ?? "").trim()) errors.push(`${item.chunk_id || "unknown"}: Chinese report requires quote_zh for non-Chinese evidence`);
      else if (!chineseCharacters(item.quote_zh)) errors.push(`${item.chunk_id || "unknown"}: quote_zh must contain a Chinese translation`);
    }
    const linkedClaims = Array.isArray(item.claim_ids) ? item.claim_ids.map((id) => String(id).toUpperCase()) : [];
    if (!linkedClaims.length) errors.push(`${item.chunk_id || "unknown"}: missing claim_ids`);
    for (const id of linkedClaims) if (!stagedClaimIds.has(id)) errors.push(`${item.chunk_id || "unknown"}: unknown claim_id ${id}`);
    if (!["support", "challenge", "context"].includes(item.relation)) errors.push(`${item.chunk_id || "unknown"}: invalid relation`);
    if (item.page_start == null && item.line_start == null) errors.push(`${item.chunk_id}: missing page/line locator`);
  }
  for (const id of stagedClaimIds) {
    const linked = evidence.filter((item) => Array.isArray(item.claim_ids) && item.claim_ids.some((claimId) => String(claimId).toUpperCase() === id));
    if (!linked.length) errors.push(`Claim ${id} has no linked evidence`);
    else if (!linked.some((item) => ["support", "challenge"].includes(item.relation))) errors.push(`Claim ${id} has no support or challenge evidence`);
    else {
      if (!linked.some((item) => item.relation === "support")) warnings.push(`Claim ${id} has no linked support evidence`);
      if (!linked.some((item) => item.relation === "challenge")) warnings.push(`Claim ${id} has no linked challenge evidence`);
    }
  }
  const citationLabelsFound = citationLabels(report);
  const resolved = resolvedCitations(report, evidence);
  if (!resolved.length) errors.push("Report must contain reader-facing citations resolved to evidence.json");
  for (const label of citationLabelsFound) {
    if (!resolveCitation(label, evidence) && /^(?:id:)|(?:\d{4}-\d{2}-\d{2}|p{1,2}\.\s*\d+|lines?\s*\d+)/i.test(label)) errors.push(`Citation has no matching evidence: ${label}`);
  }
  const matchedEvidence = resolved.map(({ item }) => item);
  if (!evidence.some((item) => item.relation === "challenge")) errors.push("At least one challenge evidence item is required");
  if (/\b(?:corpus|report_id|chunk_id|BM25|research_(?:search|plan|run_modules|synthesize))\b/i.test(report)) errors.push("Report contains internal workflow jargon");
  const displayQuote = (item) => String(item?.quote_zh || item?.quote || "");
  const primaryQuotes = inspection?.primaryQuotes || [];
  const primaryQuoteBodies = primaryQuotes.map((quote) => normalizedNarrative(quote.text));
  for (const quote of primaryQuotes) {
    const sourceLabel = quote.text.match(/来源[:：]\s*([^\n]+)/)?.[1]?.trim();
    const quoteBody = normalizedNarrative(quote.text);
    let source = sourceLabel && resolveCitation(sourceLabel, evidence);
    if (!source && sourceLabel) {
      const label = normalize(sourceLabel);
      const candidates = evidence.filter((item) => item.corpus === "primary" && label.includes(normalize(item.title)) && (!item.published_at || label.includes(String(item.published_at).slice(0, 10))) && quoteBody.includes(normalizedNarrative(displayQuote(item))));
      if (candidates.length === 1) source = candidates[0];
    }
    if (!source || source.corpus !== "primary") errors.push(`Primary quote source does not resolve to primary evidence: ${sourceLabel || "missing source line"}`);
    else if (!quoteBody.includes(normalizedNarrative(displayQuote(source)))) errors.push(`Primary quote does not match its stated source: ${source.title}`);
  }
  if (primaryQuotes.some((quote) => quote.groupStart && normalizedNarrative(quote.precedingText).length < 80)) {
    errors.push("Each primary quote group needs a substantive local argument immediately before it");
  }
  const quoteIsVisible = (item) => {
    const quote = normalizedNarrative(displayQuote(item));
    return quote.length >= 12 && primaryQuoteBodies.some((body) => body.includes(quote));
  };
  const primaryEvidence = evidence.filter((item) => item.corpus === "primary");
  if (primaryEvidence.length && !primaryEvidence.some(quoteIsVisible)) {
    errors.push("Report must show at least one complete primary-source passage in a visible primary-quote block");
  }
  for (const item of matchedEvidence.filter((item) => item?.corpus === "primary")) {
    if (!quoteIsVisible(item)) warnings.push(`Primary citation would read better with its quote shown in a visible primary-quote block: ${item.title}`);
  }
  if (primaryEvidence.length) {
    const primaryOrigin = (item) => String(item.origin_id || item.report_id || item.chunk_id);
    const independentPrimaryOrigins = new Set(primaryEvidence.map(primaryOrigin));
    const visiblePrimaryEvidence = primaryEvidence.filter(quoteIsVisible);
    const visiblePrimaryOrigins = new Set(visiblePrimaryEvidence.map(primaryOrigin));
    if (independentPrimaryOrigins.size < 2) errors.push("One primary source is insufficient. Continue primary retrieval until multiple independent sources are accepted");
    if (visiblePrimaryOrigins.size < 2) errors.push("Report body must show multiple independent primary passages; one isolated quote or source-bar listing is insufficient");
    const primaryClaimIds = new Set(primaryEvidence.flatMap((item) =>
      Array.isArray(item.claim_ids) ? item.claim_ids.map((id) => String(id).toUpperCase()) : []));
    for (const id of primaryClaimIds) {
      const claimHasVisiblePrimary = visiblePrimaryEvidence.some((item) =>
        Array.isArray(item.claim_ids) && item.claim_ids.some((claimId) => String(claimId).toUpperCase() === id));
      if (!claimHasVisiblePrimary) warnings.push(`Core claim ${id} has accepted primary evidence but no matched primary passage visible in report.html`);
    }
  }
  if (primaryQuotes.length && /专家纪要\s*\/\s*产业访谈\s*·\s*日期|evidence\.json\s*回填|来源待填/i.test(report)) {
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
