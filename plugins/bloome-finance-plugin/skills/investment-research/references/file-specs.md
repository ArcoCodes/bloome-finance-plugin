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

- Use `primary` expert and firsthand evidence as the main basis for qualitative judgments.
- Use `sell` for supporting frameworks and structured data.
- Render expert and firsthand quotations as visible `<blockquote class="primary-quote">` blocks. Replace `{{primary_quote_source}}` with a source label built from the matched evidence entry's source party/title and `published_at`; keep page/line locators in `evidence.json` for traceability, not in the visible source line. Do not use generic or invented source labels. Keep institutional-research citations in the template's `.src` hover tooltip.
- Fill each `.src` tooltip body with the full original passage from the matched evidence entry's `quote` — the complete paragraph(s) containing the cited statement, verbatim, with key sentences underlined. A one-sentence summary is not acceptable; the tooltip exists so readers can read the original text, and it scrolls when long.
- Allow charts, tables, and quantitative analysis to use `sell` data extensively.
- Calibrate key `sell` figures with expert or firsthand `primary` evidence where possible.
- Do not let uncalibrated `sell` data override stronger expert evidence or silently function as validated fact.

The final report should include a source coverage section that summarizes:

- retrieval rounds and query directions used
- total `sell` reports retrieved, deduplicated, read, and cited
- total `primary` sources retrieved, deduplicated, read, and cited
- relevant time-window coverage
- the main source mix used in the report
- why retrieval stopped and which evidence gaps remain

## Supporting Files

### `coverage_stats.json`

Record search breadth and the evidence-saturation judgment. Required fields:

- `retrieval_rounds`
- `query_seeds`
- `stopping_reason`
- `remaining_gaps`

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
- `quote`: the full original paragraph(s) containing the claim, copied verbatim from the source chunk — not a trimmed sentence. This field feeds the reader-facing `.src` tooltips, so it must be long enough to read as original text on its own.
- `source_type`
- `title`
- `source_path`
- `published_at`
- `page_start` or `line_start`

Add `origin_id` when known so repeated reporting of the same underlying source is not treated as independent corroboration.

## `report.html`

Treat `report.html` as the complete reader-facing report rendered with `assets/template.html`. Keep it single-page and self-contained. Do not add a second evidence tab or embed the audit artifacts in the HTML; those remain as Markdown and JSON files in the research workspace.
