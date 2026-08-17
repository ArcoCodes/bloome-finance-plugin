# Report Structure

Use `report_outline.md` as a natural-language editorial plan. It should help the researcher think, not behave like a machine protocol.

## Outline

Use normal Markdown headings:

```markdown
# 核心判断

Explain the decision, why it wins, the decisive evidence, and the main caveat.

Planned visual: probability-vs-payoff — Separate probability from payoff and keep the common valuation basis visible.

# 供需机制

Explain how demand, qualified capacity, yield, inventory, and pricing interact.

Planned visual: qualification-to-earnings — Show where qualification or pricing can interrupt the path from demand to earnings.

# 情景、估值与标的

Compare scenarios and securities on the same date, forecast period, currency, and accounting basis.

Planned visual: valuation-scenarios — Show the valuation range and the assumptions that create it.
```

Let the topic determine the headings, order, and number of sections. Do not require internal labels such as `S01` or `V01`.

For a deep comparative or ranked investment question, use this as the default editorial spine unless the evidence calls for a different order:

1. executive judgment and exact ranking;
2. decision rule and common comparison basis;
3. cross-alternative scorecard or evidence matrix;
4. winning thesis: demand and unit-content growth;
5. winning thesis: qualified supply, yield, lead time, and pricing;
6. earnings transmission from price/volume/mix to margin, EPS, and cash flow;
7. cycle boundary, bull/base/bear scenarios, and route-substitution risk;
8. security-level valuation normalization and stock-by-stock ranking;
9. full treatment of every material losing alternative;
10. catalysts, monitoring, invalidation, and unresolved evidence gaps.

Combine adjacent items when that improves the narrative, but do not omit a layer merely to make the report shorter. A reader should be able to audit both why the industry wins and why the selected security wins at its current valuation.

## Chapters

The final report begins with one reader-facing H1 title before the first H1 chapter heading. The renderer uses that first H1 as the document header rather than a substantive section.

Write one chapter draft for each substantive outline section, in the same editorial order. Use the same natural heading or a clearly equivalent heading. Chapters may add subsections when useful.

Every substantive chapter should include:

- its direct answer;
- the evidence and causal reasoning;
- relevant numbers or comparisons;
- primary-source calibration and source disagreement where available;
- the transmission to price, margin, EPS, cash flow, or valuation;
- material disagreement, boundary, or invalidation;
- the implication for the final decision;
- the condition that would change the section's conclusion or ranking.

Integrate primary quotations inside the argument. Place a quotation immediately after the paragraph, list item, or table interpretation whose claim it supports or challenges, and continue with the implication or calibration. Multiple independent passages may appear together when they add distinct evidence to the same claim. Preserve the report's natural structure; do not move decision-relevant evidence away from its argument merely to collect quotations elsewhere.

Use the completed chapters as the analytical source for final editing. Rewrite, merge, and de-duplicate repeated background for flow, but preserve every chapter heading, direct answer, distinct mechanism, decisive number or calculation, citation, disagreement, caveat, and decision condition. Distinct demand, supply, pricing, profit, valuation, and risk arguments must survive as distinct prose; repeated explanations need not.

## Depth review

Do not use length, chapter count, or source count as a quality target. Review depth by asking whether every decision-relevant layer supported by the evidence survived synthesis:

- give the winner the deepest treatment and give every material alternative an evidence-backed explanation;
- show the common comparison basis, scenario or sensitivity logic, and security-level valuation where relevant;
- preserve the causal bridge from demand through qualified supply and pricing into earnings and valuation;
- retain the opposing evidence, unresolved conflicts, ranking-flip conditions, and a concrete monitoring or invalidation framework.

Before rendering, compare the final report against every chapter draft and restore any omitted analytical element from the chapter checklist. Remove generic background, non-decision-useful source description, and repeated explanations even when their wording differs.

## Visual notes

Give every outline section one explicit visual treatment. Use `Planned visual: <descriptive-key> — ...` when a visual materially improves the argument; otherwise use `Visual treatment: prose — ...` and explain why prose is clearer. The component type belongs only in `visuals.json`, so the outline cannot disagree with the renderer. Keys describe the argument and map to `visuals.json`; never use opaque labels such as `V01`. Do not target a fixed number of visuals.

For each planned visual, describe:

- what the reader should learn;
- the evidence or calculation behind it;
- the comparison basis;
- the uncertainty that must remain visible.

Do not prescribe a chart type before understanding the evidence. Use the `investment-visualization` skill to choose, render, and review the final form. Every planned figure or table must appear in `report.html`.

## HTML

Call `render_research_report` to compile the complete report in outline order. The bundled React server renderer parses Markdown into tokens and emits one self-contained static HTML document with no browser React runtime. Do not hand-write the page shell or expose internal planning labels in the reader-facing report.

Save visuals as supported component specifications in `visuals.json` using `visual-spec.md`, place them with descriptive `{{visual:key}}` markers in `final_report.md`, and use `{{cite:<evidence-id>}}` for inline citations. `render_research_report` synchronizes the generated `report.md`. Every visual traces to exact accepted evidence IDs. Do not insert raw HTML, SVG, CSS, JavaScript, or event handlers. The `investment-visualization` skill owns visual selection, data normalization, annotation text, and quality review; controlled React components own geometry, page integration, and responsive styles.

Before delivery, compare Markdown and HTML for content parity:

- every reader-facing heading and subsection appears in order;
- every table, list, primary quotation, citation, and planned visual is present;
- every primary quotation remains adjacent to the claim it supports or challenges;
- late sections such as monitoring and research gaps are not omitted;
- mobile rendering preserves access to every column in wide tables;
- screenshots cover the beginning, middle, and end of the long page.
