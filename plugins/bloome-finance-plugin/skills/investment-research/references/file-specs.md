# File Specs

Use these file shapes unless the user asks for another format.

## `sell_side_logic.md`

Recommended sections:

1. Topic and scope
2. Core conclusion
3. Causal chain
4. Key assumptions
5. Leading indicators
6. Risks and invalidation conditions
7. Claims to validate
8. Optional coverage note

Keep each claim short and uniquely numbered, for example `C1`, `C2`, `C3`.

## `validation.md`

Structure the file by claim ID.

For each claim, include:

1. Claim
2. Support evidence
3. Opposing evidence
4. Calibration result
5. Unverified point
6. Evidence strength: `strong`, `medium`, `weak`, or `insufficient`
7. What would change the judgment

Prefer exact source locators when available.

## `evidence_disposition.md`

Use concise Markdown to account for the evidence surfaced by every module. Group by module or decision question. For each material item, state:

- the exact chunk ID;
- whether and how it enters the thesis;
- which claim it informs;
- whether omitting it could change the conclusion;
- why it was rejected when it does not enter `evidence.json`.

## `decision.md`

Keep this as natural Markdown, not a JSON result or a fixed schema. Use headings, prose, bullets, and a small table only where they make the decision easier to audit.

For a ranked decision, make the following explicit:

- the priority rule, including whether probability dominates payoff;
- the final ranking;
- why each alternative represents the thing being compared;
- the evidence that drives each material comparison;
- the common valuation date, forecast period, currency, and accounting basis;
- any normalization used when raw sources are not directly comparable;
- what would change the order.

Use scores or weights only when they genuinely improve the reasoning. The narrative must still explain why the order follows from the stated rule. For a report without ranked alternatives, state the calibrated conclusion and why a ranking is not useful.

## `report_outline.md`

Recommended fields per section:

1. Section title
2. Purpose
3. 2-4 sentence summary
4. Supporting validated claims
5. Planned tables or figures
6. Planned source coverage summary

Use outline text as a blueprint, not draft prose.

## `final_report.md`

Begin with one reader-facing H1 report title. The first substantive section, normally the core judgment, follows as the next H1.

Recommended structure:

1. Executive summary
2. Topic framing and why it matters
3. Logic map
4. Validation findings
5. Key debates and unresolved points
6. Implications
7. Risks and falsifiers
8. Conclusion
9. Sources and coverage

Default citation policy:

- Use `sell` for framework and structured data.
- Use `primary` for reader-facing quoted passages and qualitative proof.
- Write primary quotations as ordinary Markdown blockquotes and end the same blockquote with `来源：<exact source party/title> · <published_at>`. The React renderer emits visible `.primary-quote` components. Keep page/line locators in `evidence.json` for traceability, not in the visible source line. Do not use generic or invented source labels. Write inline evidence references as `{{cite:<evidence-id>}}`, using the exact `id` or `chunk_id` from `evidence.json`. The renderer replaces the marker with the standard reader-facing title and page/line locator and creates the `.src` tooltip. Exact legacy bracket citations remain supported, but do not abbreviate them to institution-and-date labels such as `[J.P. Morgan, 2026-07-02]`. Expert evidence is the highest-priority reader-facing layer: show multiple independent expert passages, and for every core industry claim with accepted expert support or challenge evidence, show at least one matched passage. One isolated quotation, one extracted sentence, or a source-bar entry is invalid; show the complete paragraph or paragraphs.
- Match quotations to the report language. In a Chinese-language report, a non-Chinese evidence passage must have a complete, faithful Chinese translation in `quote_zh`. Fill each `.src` tooltip and visible `primary-quote` block with `quote_zh`; use `quote` directly only when the source passage is already Chinese. Preserve all sentences, figures, dates, qualifiers, and paragraph boundaries. Never summarize, abridge, drop clauses, or replace interior text with an ellipsis (`……`/`...`). Keep tooltip text plain, without underlines or `<u>` markup.
- Preserve the complete source-language passage verbatim in `quote` even when the report displays `quote_zh`. This separates audit evidence from reader-facing localization: validation checks the complete display field selected for the report, while traceability continues to use the untouched original.
- Keep argument and evidence adjacent. Put each `primary-quote` directly after the reader-facing paragraph, list item, or table interpretation that introduces its claim, then continue with the implication or calibration. Allow as many independent, non-redundant quotations as the same claim genuinely needs. Do not relocate decision-relevant evidence away from its argument merely to collect quotations elsewhere. Every displayed quotation must already exist as accepted evidence in `evidence.json`; never invent evidence for presentation.
- Allow charts, tables, and quantitative analysis to use `sell` data extensively.
- Calibrate key `sell` figures with `primary` where possible.
- Do not let uncalibrated `sell` data silently function as validated fact.

The final report should include a reader-facing source coverage section. Describe source categories naturally; do not expose internal fields such as `corpus`, `chunk_id`, or `report_id`. Summarize:

- retrieval rounds and query directions used
- total `sell` reports retrieved, deduplicated, read, and cited
- total `primary` sources retrieved, deduplicated, read, and cited
- relevant time-window coverage
- the main source mix used in the report
- why retrieval stopped and which evidence gaps remain

## Supporting Files

### `visuals.json`

The outline declares each visual once as `Planned visual: <descriptive-key> — ...`; the component type exists only here.

Store every planned figure or visual table as a controlled component specification using `visual-spec.md`. The file is always present and uses `{ "visuals": [] }` when no visual is useful. Every visual key appears exactly once as a standalone `{{visual:key}}` marker in `report.md`, and every `evidence_ids` entry resolves to an accepted `evidence.json` `id` or `chunk_id`. Never store raw HTML, SVG, CSS, or JavaScript.

### `coverage_stats.json`

Record search breadth and the evidence-saturation judgment. Required fields:

- `retrieval_rounds`
- `query_seeds`
- `stopping_reason`
- `remaining_gaps`

Each `retrieval_rounds` entry records `corpus`. Primary retrieval must contain separate entries with `source_layer: "expert"` and `source_layer: "official"`; this field records the query intent because primary search results do not carry that source label. One primary call cannot represent both.

Useful descriptive fields, without minimum quotas:

- `sell_reports_retrieved`
- `sell_reports_deduped`
- `sell_reports_read`
- `sell_reports_cited`
- `primary_sources_retrieved`
- `primary_sources_deduped`
- `primary_sources_read`
- `primary_sources_cited`
- `sources_cited`
- relevant recency counts or shares

### `evidence_ledger.json`

Use when traceability matters. Suggested fields:

- `claim_id`
- `stance`
- `source_type`
- `title`
- `institution`
- `published_at`
- `locator`
- `quote`
- `notes`

## `evidence.json`

Treat this as the unified evidence backbone.

Every important claim, quoted passage, tooltip, table source, and chart source should map back to an evidence entry.

Required fields include:

- `claim`
- `claim_ids`: one or more exact IDs from `sell_side_logic.md` and `validation.md`
- `relation`: `support`, `challenge`, or `context`
- `stance`
- `kind`
- `corpus`
- `chunk_id`
- `report_id`
- `quote`: the full original-language paragraph(s) containing the claim, copied verbatim from the source chunk — not a trimmed sentence and not an ellipsis-shortened summary. Keep every sentence, number, date, and qualifier around the cited statement. This is the audit record and must never be replaced by a translation.
- `quote_zh`: required when the report is Chinese and `quote` is not Chinese. Store a complete, faithful Chinese translation of the entire `quote`, preserving all paragraphs, figures, dates, qualifiers, and uncertainty. This is the reader-facing text for sell-side tooltips, primary quote blocks, and the workbench ledger. Omit it when `quote` is already Chinese.
- `title`
- `source_path`
- `published_at`
- `page_start` or `line_start`

Preserve `source_type` only when the source actually returns one; never invent a source classification.

Add `origin_id` when known so repeated reporting of the same underlying source is not treated as independent corroboration.

## `report.md`

Treat `report.md` as a generated mirror of `final_report.md`. Do not maintain it separately; `render_research_report` overwrites it atomically before rendering.

## `report.html`

Treat `report.html` as the complete reader-facing report compiled by `render_research_report`. The bundled React server renderer reads `assets/template.html`, parses Markdown tokens, renders `visuals.json` through controlled components, emits a single-page self-contained document, and includes no browser React runtime. Do not hand-write the page shell, add a second evidence tab, or embed audit artifacts in the HTML; those remain as Markdown and JSON files in the research workspace.
