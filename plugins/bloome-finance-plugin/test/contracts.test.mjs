import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const contracts = new Map([
  ["skills/investment-research/assets/template.html", "bccdad3c36972637ee8d76372597ba5e4cf676733a14d5c03a60d215dab14f2a"],
  ["skills/investment-research/references/file-specs.md", "f25ed9678403892bb4cda3f42c39815636294ac5176571d6a72e171454d6a2aa"],
  ["skills/investment-research/references/chart-rules.md", "0f00fd2b12f7dac44b6ee3c718d638fd09fd5e078e03c1c6d2bc72b108282e10"],
]);

test("investment report contracts remain byte-for-byte unchanged", async () => {
  for (const [file, expected] of contracts) {
    const digest = createHash("sha256").update(await readFile(new URL(file, root))).digest("hex");
    assert.equal(digest, expected, file);
  }
});

test("cross-runtime skill keeps the original report template as source of truth", async () => {
  const skill = await readFile(new URL("skills/investment-research/SKILL.md", root), "utf8");
  const template = await readFile(new URL("skills/investment-research/assets/template.html", root), "utf8");
  assert.match(skill, /Use `assets\/template\.html` as the visual source of truth/);
  assert.match(skill, /Do not replace it with a newly invented card layout/);
  assert.match(skill, /evidence\.json` as the unified evidence backbone/);
  assert.match(skill, /Codex, Claude\/Cowork.*WorkBuddy/);
  assert.match(skill, /host's existing account supplies the model/);
  assert.match(skill, /returned `reportPath`/);
  assert.match(skill, /reader-facing and single-page/);
  assert.match(template, /class="report"/);
  assert.doesNotMatch(template, /data-report-tab|data-evidence-section/);
});

test("user-facing research is expert-led and hides backend workflow names", async () => {
  const files = await Promise.all([
    "skills/investment-research/SKILL.md",
    "skills/investment-research/assets/template.html",
    "assets/workbench.html",
    "plugin.config.json",
  ].map((file) => readFile(new URL(file, root), "utf8")));
  assert.match(files[0], /Expert evidence carries more weight than institutional reports/);
  assert.match(files[0], /In user-facing conversation/);
  for (const content of files) assert.doesNotMatch(content, /sell-side|卖方/i);
});

test("shared workflow delegates memos with host-managed concurrency and a sequential fallback", async () => {
  const [skill, moduleContract, workflow, reportStructure, worker, auditor] = await Promise.all([
    "skills/investment-research/SKILL.md",
    "skills/investment-research/references/module-contract.md",
    "skills/investment-research/references/multiagent-workflow.md",
    "skills/investment-research/references/report-structure.md",
    "agents/research-module.md",
    "agents/evidence-auditor.md",
  ].map((file) => readFile(new URL(file, root), "utf8")));
  assert.match(skill, /Let the host manage worker scheduling and concurrency/);
  assert.match(skill, /run only the missing modules sequentially in the parent/);
  assert.match(skill, /render all of `report\.md` into a static single-page `report\.html`/);
  assert.match(skill, /evidence_disposition\.md/);
  assert.match(skill, /Save `decision\.md`/);
  assert.match(skill, /Continue until additional retrieval no longer materially changes/);
  assert.match(skill, /Synthesize `final_report\.md` from the chapter drafts, reconciled evidence, and `decision\.md`/);
  assert.match(skill, /writes only `modules\/<id>\.md`/);
  assert.match(workflow, /MCP provides research data and deterministic validation; it never starts agents or calls a model/);
  assert.match(moduleContract, /# Conflicts and date reconciliation/);
  assert.match(moduleContract, /must not write an executive summary, chapter, outline, `evidence\.json`, or final report/);
  assert.match(reportStructure, /natural-language editorial plan/);
  assert.match(reportStructure, /Do not require internal labels such as `S01` or `V01`/);
  assert.match(worker, /Write only the assigned module memo/);
  assert.match(auditor, /Do not edit files or write report prose/);
});

test("editorial investment visualization is owned by a reusable skill, not validator markup", async () => {
  const [skill, grammar, review, researchSkill] = await Promise.all([
    "skills/investment-visualization/SKILL.md",
    "skills/investment-visualization/references/editorial-grammar.md",
    "skills/investment-visualization/references/review.md",
    "skills/investment-research/SKILL.md",
  ].map((file) => readFile(new URL(file, root), "utf8")));
  assert.match(skill, /This skill owns visual judgment/);
  assert.match(skill, /quality bar, not a request to reproduce another publisher's brand/);
  assert.match(skill, /Render the actual report in a browser and inspect it at desktop and narrow-phone widths/);
  assert.match(grammar, /The visual sentence/);
  assert.match(grammar, /Show probability evidence separately from payoff/);
  assert.match(review, /Five-second test/);
  assert.match(review, /Final decision test/);
  assert.match(researchSkill, /use the `investment-visualization` skill/);
});
