---
name: investment-visualization
description: Designs and reviews editorial-grade evidence-led visual specifications rendered by controlled React report components. Use when an investment report needs financial data journalism, valuation or scenario graphics, supply-demand charts, company comparisons, mechanism diagrams, or a visual-quality review.
---

# Investment Visualization

Create original, evidence-led financial visuals with the clarity, restraint, annotation quality, and narrative sequencing expected from top-tier data journalism. Treat that as a quality bar, not a request to reproduce another publisher's brand, page, headline, or proprietary design.

This skill owns visual judgment. The renderer contract defines only safe recurring geometry; keep selection, normalization, annotation, uncertainty, and editorial sequencing here rather than encoding those judgments as validator regex or CSS-class gates.

## Role in an investment report

Use this skill after the main research has reconciled evidence and formed a provisional decision. The investment-research workflow owns the thesis, evidence, ranking, and final report. This skill turns the most important relationships into reader-facing graphics without changing the underlying judgment.

When working inside the Bloome plugin:

- preserve `../investment-research/assets/template.html` as the single-page report shell;
- write safe component inputs to workspace `visuals.json` using `../investment-research/references/visual-spec.md`;
- place each component in `report.md` with one descriptive `{{visual:key}}` marker;
- use the report palette and typography through the renderer rather than custom CSS;
- keep exact source links through accepted `evidence.json` IDs.

Do not add a separate visualization dashboard or evidence tab.

## Editorial workflow

### 1. Find the visual argument

Read the report outline, decision record, relevant chapter draft, and linked evidence before drawing.

For each possible visual, answer in plain Markdown:

- What decision question does this help the reader answer?
- What is the one-sentence takeaway?
- Which values, comparisons, or relationships are essential?
- Which evidence IDs support them?
- What uncertainty, caveat, or competing interpretation must remain visible?

Do not force these notes into a fixed table. A short paragraph or bullets are enough.

Discard a proposed visual when prose or a small table answers the question more clearly.

### 2. Build a visual sequence

Plan the report as a narrative, not a dashboard. A strong investment sequence often moves through:

1. **Change:** what has shifted and when.
2. **Mechanism:** how the shift reaches price, volume, margin, or cash flow.
3. **Comparison:** why alternatives differ.
4. **Decision:** what remains attractive after valuation and risk.

Not every report needs all four. Use only the visuals that advance the thesis.

### 3. Audit the data before choosing the form

Check:

- observed versus forecast periods;
- valuation date and forecast year;
- currency, units, fiscal/calendar year, and accounting definition;
- nominal versus real values;
- stock versus flow measures;
- source independence and shared origins;
- missing intervals, revisions, and scenario assumptions.

Normalize only when the conversion is defensible and explain it visibly. If two alternatives cannot be compared honestly, do not place them on one scale.

### 4. Choose the visual form

Read `references/editorial-grammar.md`.

Choose the simplest form that reveals the relationship:

- time and inflection → annotated line or area chart;
- several alternatives on the same measure → aligned small multiples;
- exact multi-metric comparison → compact table;
- one-period ranking → sorted dot plot or bars;
- change from price/volume/mix to earnings → waterfall;
- valuation or target-price dispersion → range plot;
- bull/base/bear → interval or scenario plot;
- two-variable sensitivity → printed matrix;
- causal transmission → restrained mechanism diagram;
- probability first, payoff second → separate aligned views or a clearly explained decision plane.

Avoid visual forms whose novelty exceeds their explanatory value.

### 5. Compose the graphic

Every graphic should have:

- a conclusion-led title;
- a short deck only when the title needs context;
- direct labels near the marks;
- the decisive number or inflection printed on the graphic;
- one or two annotations that explain why the pattern matters;
- visible units and time basis;
- a concise uncertainty treatment;
- a source line tied to exact evidence IDs;
- an accessible description.

Use color to focus attention, not to decorate or encode the only meaning. Keep comparison scales honest. Separate observed history from forecasts. Remove borders, legends, gridlines, and labels that do not help the reader.

### 6. Specify and render inside the report

Read `../investment-research/references/visual-spec.md`. Choose the narrowest supported component that honestly expresses the evidence: `bar`, `line`, `stacked-bar`, `waterfall`, `scatter`, `range`, `flow`, `table`, or `matrix`. If none fits, use prose rather than injecting custom HTML or inventing geometry during a report run.

For every planned visual:

- use a descriptive key that states the argument rather than an opaque ID;
- save the conclusion, accessible description, uncertainty, exact values, units, and accepted evidence IDs in `visuals.json`;
- place one matching `{{visual:key}}` marker immediately after the prose that states its conclusion;
- keep meaningful text and decisive values visible without hover dependence;
- let the controlled React component own SVG/HTML geometry, report palette, and mobile reflow;
- never write raw HTML, SVG, CSS, JavaScript, or event handlers.

Call `render_research_report`, then use `references/editorial-grammar.md` for composition review and `references/review.md` for acceptance.

### 7. Review the rendered result

Render the actual report in a browser and inspect it at desktop and narrow-phone widths. Use screenshots for visual review.

For a long-form report, inspect the beginning, middle, and end rather than only the first viewport. Confirm that the HTML contains the complete Markdown narrative, that late sections were not dropped, that repeated long tables do not dominate the page, and that section rhythm remains readable. Prefer one decisive visual per major argument over compressing prose merely to make the page shorter.

Do not claim editorial quality from markup inspection alone. Review the picture:

- Does the takeaway register in five seconds?
- Can the reader explain the mechanism or comparison after thirty seconds?
- Is the decisive evidence visually prominent?
- Are uncertainty and source basis visible without overwhelming the story?
- Does the visual still work in grayscale and on mobile?
- Does it change or sharpen the investment decision?

Revise until the answer is yes, or replace the graphic with a table or prose.

## Investment-specific safeguards

- Probability and payoff are different questions. Do not let a large payoff visually overpower weak evidence when the decision rule prioritizes probability.
- Never compare valuation multiples from different forecast periods or dates without an explicit bridge.
- State why the selected company, security, or proxy represents the industry or theme.
- Distinguish industry attractiveness from stock attractiveness.
- Show challenge evidence when it can change timing, magnitude, or ranking.
- Avoid false precision in normalized scores. When the evidence is qualitative, use ranges or ordered categories and explain them.
- Do not let the visual ranking contradict `decision.md` or the final report.

## Output boundary

This skill may edit the report outline's visual notes, workspace `visuals.json`, and descriptive visual markers in `report.md`. It does not hand-edit `report.html` or rewrite the thesis, evidence ledger, decision record, or chapter conclusions.

Keep planning and review notes as Markdown. Keep `visuals.json` limited to renderer-supported data and labels; do not turn it into a layout language.

## References

Read `references/editorial-grammar.md` before choosing chart forms or composing visuals.

Read `references/review.md` before final delivery.

Read `../investment-research/references/visual-spec.md` before writing `visuals.json`.
