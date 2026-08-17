# Multi-Agent Workflow

The parent host owns the research run. MCP provides research data and deterministic validation; it never starts agents or calls a model.

## Dispatch

1. Run a broad sell-side and primary-source landscape search. If it returns a quote, the parent must obtain the user's explicit confirmation and activate the workspace run before dispatching workers.
2. Save `plan.json` with enough non-overlapping modules to cover the topic deeply, using `module-contract.md`.
3. Prefer the host's native subagents and let the host manage scheduling and concurrency.
4. Give each worker the topic, one complete module object, the absolute workspace, its unique `modules/<id>.md` output path, and the module contract.
5. If native delegation is unavailable, denied, lacks the research tools, or a worker fails, complete only the missing modules sequentially in the parent with the same contract. Do not invoke a model CLI, process, or API as a substitute.
6. Read every completed memo. Optionally use one native evidence-auditor subagent to identify unsupported claims, source conflicts, duplicate evidence, and missing locators. The auditor does not write shared artifacts.

## Reconciliation and writing

The parent:

1. Deduplicates evidence by source and locator.
2. Resolves same-chain date conflicts while preserving independent disagreement.
3. Accounts for every module candidate in `evidence_disposition.md`, with an acceptance decision or a rejection reason, then merges accepted rows into the single `evidence.json` backbone.
4. Writes `sell_side_logic.md`, `validation.md`, and `decision.md`. Ranked decisions must use comparable bases, exact evidence links, and a reproducible final order.
5. Writes a natural-language editorial outline with an explicit treatment for each section: `Planned visual: <descriptive-key> — ...` or `Visual treatment: prose — ...` with the reason. Keys map to `visuals.json` and describe the argument; do not use opaque labels or target a fixed visual count.
6. Freezes `evidence.json`, `decision.md`, and `report_outline.md`, then dispatches one chapter worker per substantive outline section using `chapter-contract.md`. Each worker receives only its section brief, relevant accepted evidence and memo passages, the decision, and neighboring-section boundaries, and writes one unique `chapter_XX_*.md`. If delegation is unavailable or a worker fails, the parent writes only the missing chapter with the same contract.
7. Reads every chapter, then edits `final_report.md` in outline order. It may rewrite, merge, and de-duplicate prose, including repeated background with different wording, but must preserve every chapter heading, direct answer, distinct mechanism, decisive number or calculation, evidence-linked citation marker, disagreement, boundary, invalidating condition, and ranking-flip condition. It resolves contradictions rather than concatenating them and does not collapse substantive chapters into summary paragraphs.
8. Writes every planned visual as a controlled component specification in `visuals.json`, places each with a descriptive `{{visual:key}}` marker in `final_report.md`, then calls `render_research_report`, which synchronizes `report.md` automatically. It visually reviews the self-contained static output, rerenders after any Markdown or visual-spec change, and only then runs workspace validation.

Evidence memos may be written concurrently in the first pass. Chapter files may be written concurrently in the second pass after evidence and decisions are frozen. Every worker has one unique output path; shared evidence, decision, outline, final-report, and HTML files remain parent-owned.
