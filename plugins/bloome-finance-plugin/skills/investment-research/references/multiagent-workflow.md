# Multi-Agent Workflow

The parent host owns the research run. MCP provides research data and deterministic validation; it never starts agents or calls a model.

## Dispatch

1. Search expert and firsthand sources first, then run a broad institutional-research landscape search. If retrieval returns a quote, the parent must obtain the user's explicit confirmation and activate the workspace run before dispatching workers.
2. Save `plan.json` with enough non-overlapping modules to cover the topic deeply, using `module-contract.md`.
3. Prefer the host's native subagents and let the host manage scheduling and concurrency.
4. Give each worker the topic, one complete module object, the absolute workspace, its unique `modules/<id>.md` output path, and the module contract.
5. If native delegation is unavailable, denied, lacks the research tools, or a worker fails, complete only the missing modules sequentially in the parent with the same contract. Do not invoke a model CLI, process, or API as a substitute.
6. Read every completed memo. Optionally use one native evidence-auditor subagent to identify unsupported claims, source conflicts, duplicate evidence, and missing locators. The auditor does not write shared artifacts.

## Reconciliation and writing

The parent, not a worker:

1. Deduplicates evidence by source and locator.
2. Resolves same-chain date conflicts while preserving independent disagreement.
3. Accounts for every module candidate in `evidence_disposition.md`, with an acceptance decision or a rejection reason, then merges accepted rows into the single `evidence.json` backbone.
4. Writes `sell_side_logic.md`, `validation.md`, and `decision.md`. Ranked decisions must use comparable bases, exact evidence links, and a reproducible final order.
5. Writes a natural-language editorial outline and, where useful, evidence-backed visual notes. Do not add internal section or visual IDs.
6. Writes each chapter in the outline's editorial order with natural headings. Every substantive chapter includes citations and an explicit boundary, opposing-evidence, risk, or invalidation discussion.
7. Synthesizes `final_report.md` from the chapter drafts and reconciled evidence. Rewrite and compress where useful, resolve contradictions, and retain decisive accepted evidence, citations, boundaries, disagreements, unresolved points, and the exact ranking from `decision.md`.
8. Copies `final_report.md` into `report.md`, renders all of it—not a dashboard summary—into the bundled single-page `report.html` template, then runs workspace validation.

Only module memos may be written concurrently. Shared evidence, validation, chapter, and final-report files are parent-owned and written after workers finish.
