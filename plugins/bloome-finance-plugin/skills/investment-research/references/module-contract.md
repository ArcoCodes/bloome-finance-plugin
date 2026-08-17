# Research Module Contract

A module is one bounded evidence question, not a report chapter. After a landscape search, the parent creates as many non-overlapping modules as the topic needs for deep coverage and records them in `plan.json`:

```json
{
  "topic": "research topic",
  "modules": [{
    "id": "demand",
    "question": "What changes demand?",
    "scope": "Included and excluded subjects",
    "support_hypothesis": "Evidence that would support the thesis",
    "challenge_hypothesis": "Evidence that would challenge it",
    "evidence_needed": ["metric or source needed"],
    "query_seeds": ["bounded search seed"]
  }]
}
```

IDs must be unique filesystem-safe strings. Questions, scopes, support hypotheses, and challenge hypotheses must be distinct across modules.

Each worker handles exactly one module and writes only `modules/<id>.md`. Use these headings:

```markdown
# Direct answer
# Claim–evidence pairs
# Metrics
# Conflicts and date reconciliation
# Invalidating conditions
# Remaining gaps
```

Every material claim and number needs an inline `{{cite:<chunk-id>}}` marker and enough evidence fields for the parent to merge it into `evidence.json`: claim IDs, relation (`support`, `challenge`, or `context`), stance, kind, corpus, chunk ID, report ID, origin ID when known, exact quote (copy the complete original-language paragraph(s) containing the claim verbatim — never trim to a single sentence), source type, title, source path, publication date, and page or line locator. For a Chinese report, also provide `quote_zh` whenever the original quote is not Chinese: translate the entire passage faithfully without summarizing, dropping numbers or qualifiers, or inserting ellipses. Write every candidate's ID literally as `chunk_id: \`<exact-id>\`` so reconciliation can account for it. Seek both support and challenge evidence. Prefer the newest item for conflicts within the same evidence chain; preserve independent disagreement.

Write each claim–evidence pair as a full account, not a one-line summary: state the claim, the evidence, the reasoning that connects them, and the surrounding context from the source that a chapter writer would need to build a complete argument without re-reading every chunk. A thin memo starves the report downstream.

Workers must not write an executive summary, chapter, outline, `evidence.json`, or final report. Their response to the parent contains only a short direct answer and the memo path; the memo retains the full evidence detail.
