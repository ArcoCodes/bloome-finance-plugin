import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const contracts = new Map([
  ["skills/investment-research/assets/template.html", "0bc07d431ece1f8f64b20d42c0ff1746a0d79bc5f62edfe9681a420e4ebee858"],
  ["skills/investment-research/references/file-specs.md", "c2f390d5ae54ddfa1ce3847710dd8ca501a6c581178a4c45e0d81ed8b32351b7"],
  ["skills/investment-research/references/chart-rules.md", "98f1ea61386428048ab8e92069025bbb2a5b3b0eedf5de823feadf144ddba59d"],
]);

test("investment report contracts remain byte-for-byte unchanged", async () => {
  for (const [file, expected] of contracts) {
    const digest = createHash("sha256").update(await readFile(new URL(file, root))).digest("hex");
    assert.equal(digest, expected, file);
  }
});

test("cross-runtime skill uses React SSR with the original report styles", async () => {
  const skill = await readFile(new URL("skills/investment-research/SKILL.md", root), "utf8");
  const template = await readFile(new URL("skills/investment-research/assets/template.html", root), "utf8");
  assert.match(skill, /React static renderer reads `assets\/template\.html` as the visual source of truth/);
  assert.match(skill, /must not insert raw page HTML, SVG, CSS, JavaScript/);
  assert.match(skill, /call `render_research_report`/);
  assert.match(skill, /evidence\.json` as the unified evidence backbone/);
  assert.match(skill, /Codex or Claude\/Cowork/);
  assert.match(skill, /host's existing account supplies the model/);
  assert.match(skill, /returned `reportPath`/);
  assert.match(skill, /reader-facing and single-page/);
  assert.match(template, /class="report"/);
  assert.doesNotMatch(template, /data-report-tab|data-evidence-section/);
});

test("report-link delivery uses direct user-facing language", async () => {
  const [skill, server, readme] = await Promise.all([
    "skills/investment-research/SKILL.md",
    "mcp/server.cjs",
    "../../README.md",
  ].map((file) => readFile(new URL(file, root), "utf8")));
  assert.match(skill, /报告链接已生成：<link>/);
  assert.match(skill, /never knowingly generate a stale link/);
  assert.doesNotMatch(skill, /我先把当前版本上传|Bloome 外部服务|私有链接/);
  assert.match(server, /Validate report and generate link/);
  assert.doesNotMatch(server, /file-upload|deployable report link/);
  assert.match(readme, /生成可直接访问的报告链接/);
});

test("research skill makes industry-expert evidence a mandatory completion gate", async () => {
  const skill = await readFile(new URL("skills/investment-research/SKILL.md", root), "utf8");
  assert.match(skill, /`sell` and `primary` may be searched in either order/);
  assert.match(skill, /Keep `sell` and `primary` as separate corpus searches/);
  assert.match(skill, /run separate expert-targeted and official-targeted `research_search` calls using different concepts and phrases/);
  assert.match(skill, /never `source_types`/);
  assert.doesNotMatch(skill, /primary_layer/);
  assert.match(skill, /Finding official materials does not complete primary research/);
  assert.match(skill, /customer, supplier, competitor, channel, and former-employee roles/);
  assert.match(skill, /`sell` contains research published by sell-side institutions/);
  assert.match(skill, /It represents what the market believes: earnings forecasts, key assumptions, debates, risks, and valuation frameworks/);
  assert.match(skill, /Use it to extract the investment logic, causal chain, key assumptions, forecasts, disagreements, and valuation framework/);
  assert.match(skill, /understand what the market has priced in/);
  assert.match(skill, /Treat its conclusions as hypotheses to test against industry-expert and official material, not proof of industry reality/);
  assert.match(skill, /Industry-expert material:\*\* expert interviews, former-employee interviews, industry-participant or consultant conversations, channel checks, fieldwork/);
  assert.match(skill, /customers and end users, procurement or operations staff, upstream suppliers, competitors, distributors and channel partners, integrators, and former executives or employees/);
  assert.match(skill, /Official material:\*\* regulatory filings, company announcements, government documents, investor-relations materials, and earnings releases or calls/);
  assert.match(skill, /Earnings-call management commentary is official material, not an expert interview/);
  assert.match(skill, /highest-priority retrieval requirement/);
  assert.match(skill, /a floor on expert coverage, not a ceiling on other evidence/);
  assert.match(skill, /never cut or thin sell-side or official content to shift the evidence mix toward experts/);
  assert.match(skill, /distributed across the core industry claims rather than concentrated in one section/);
  assert.match(skill, /highest-priority reader-facing evidence layer/);
  assert.match(skill, /complete passages from multiple independent expert sources/);
  assert.match(skill, /translate every non-Chinese sell-side tooltip and primary quotation into complete, faithful Chinese/);
  assert.match(skill, /evidence\.json\.quote_zh/);
  assert.match(skill, /Place each visible `primary-quote` immediately after the paragraph, list item, or table interpretation/);
  assert.match(skill, /Use only accepted evidence mapped in `evidence\.json`; do not invent or add evidence/);
  assert.match(skill, /a single quote, sentence excerpt, or source-only listing is invalid/);
  assert.match(skill, /For every core industry claim supported or challenged by expert evidence/);
  assert.match(skill, /In every `primary` iteration, keep expert-targeted and official-targeted directions separate/);
  assert.match(skill, /official results do not count as expert coverage/);
  assert.match(skill, /until the core industry claims are covered by multiple independent expert sources/);
  assert.match(skill, /Continue searching industry-expert material until the core industry claims have broad, independent expert coverage/);
  assert.match(skill, /still write the complete report/);
  assert.match(skill, /instead of dropping the claim, thinning the analysis, or withholding the report/);
});

test("shared workflow delegates evidence and chapters with host-managed concurrency and a sequential fallback", async () => {
  const [skill, moduleContract, chapterContract, workflow, reportStructure, worker, chapterWriter, auditor] = await Promise.all([
    "skills/investment-research/SKILL.md",
    "skills/investment-research/references/module-contract.md",
    "skills/investment-research/references/chapter-contract.md",
    "skills/investment-research/references/multiagent-workflow.md",
    "skills/investment-research/references/report-structure.md",
    "agents/research-module.md",
    "agents/chapter-writer.md",
    "agents/evidence-auditor.md",
  ].map((file) => readFile(new URL(file, root), "utf8")));
  assert.match(skill, /Let the host manage worker scheduling and concurrency/);
  assert.match(skill, /run only the missing modules or chapters sequentially in the parent/);
  assert.match(skill, /one chapter worker to each planned substantive section/);
  assert.match(skill, /rewrite, merge, and de-duplicate chapter prose for flow/);
  assert.match(skill, /call `render_research_report` with the absolute workspace path/);
  assert.match(skill, /atomically synchronizes `final_report\.md` to `report\.md`/);
  assert.match(skill, /evidence_disposition\.md/);
  assert.match(skill, /Save `decision\.md`/);
  assert.match(skill, /Continue until additional retrieval no longer materially changes/);
  assert.match(skill, /Edit `final_report\.md` from the chapter drafts in outline order/);
  assert.match(skill, /Planned visual: <descriptive-key>/);
  assert.match(skill, /Visual treatment: prose/);
  assert.match(skill, /writes only `modules\/<id>\.md`/);
  assert.match(workflow, /MCP provides research data and deterministic validation; it never starts agents or calls a model/);
  assert.match(workflow, /Chapter files may be written concurrently in the second pass/);
  assert.match(moduleContract, /# Conflicts and date reconciliation/);
  assert.match(moduleContract, /must not write an executive summary, chapter, outline, `evidence\.json`, or final report/);
  assert.match(chapterContract, /Write only the assigned chapter file/);
  assert.match(chapterContract, /complete evidence-to-conclusion chain/);
  assert.match(chapterContract, /supporting evidence or calculation in reader-facing analysis/);
  assert.match(chapterContract, /Do not add “图表输入”/);
  assert.match(chapterContract, /\{\{cite:<evidence-id>\}\}/);
  assert.match(reportStructure, /natural-language editorial plan/);
  assert.match(reportStructure, /Do not require internal labels such as `S01` or `V01`/);
  assert.match(worker, /Write only the assigned module memo/);
  assert.match(chapterWriter, /Write only the assigned chapter file/);
  assert.match(auditor, /Do not edit files or write report prose/);
});

test("editorial investment visualization uses evidence-linked controlled components", async () => {
  const [skill, grammar, review, visualSpec, researchSkill] = await Promise.all([
    "skills/investment-visualization/SKILL.md",
    "skills/investment-visualization/references/editorial-grammar.md",
    "skills/investment-visualization/references/review.md",
    "skills/investment-research/references/visual-spec.md",
    "skills/investment-research/SKILL.md",
  ].map((file) => readFile(new URL(file, root), "utf8")));
  assert.match(skill, /This skill owns visual judgment/);
  assert.match(skill, /quality bar, not a request to reproduce another publisher's brand/);
  assert.match(skill, /Render the actual report in a browser and inspect it at desktop and narrow-phone widths/);
  assert.match(skill, /never write raw HTML, SVG, CSS, JavaScript, or event handlers/);
  assert.match(visualSpec, /`stacked-bar`, `waterfall`, `scatter`/);
  assert.match(visualSpec, /Every specification must have one marker/);
  assert.match(grammar, /The visual sentence/);
  assert.match(grammar, /Show probability evidence separately from payoff/);
  assert.match(review, /Five-second test/);
  assert.match(review, /Final decision test/);
  assert.match(researchSkill, /use the `investment-visualization` skill/i);
});
