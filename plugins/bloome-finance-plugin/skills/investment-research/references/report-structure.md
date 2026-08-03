# Report Structure

Use `report_outline.md` as a natural-language editorial plan. It should help the researcher think, not behave like a machine protocol.

## Outline

Use normal Markdown headings:

```markdown
# 核心判断

Explain the decision, why it wins, the decisive evidence, and the main caveat.

Possible visual: Separate probability from payoff and keep the common valuation basis visible.

# 供需机制

Explain how demand, qualified capacity, yield, inventory, and pricing interact.

Possible visual: Show where qualification or pricing can interrupt the path from demand to earnings.

# 情景、估值与标的

Compare scenarios and securities on the same date, forecast period, currency, and accounting basis.

Possible visual: Show the valuation range and the assumptions that create it.
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

Write one chapter draft for each substantive outline section, in the same editorial order. Use the same natural heading or a clearly equivalent heading. Chapters may add subsections when useful.

Every substantive chapter should include:

- its direct answer;
- the evidence and causal reasoning;
- relevant numbers or comparisons;
- expert or firsthand calibration and source disagreement where available;
- the transmission to price, margin, EPS, cash flow, or valuation;
- material disagreement, boundary, or invalidation;
- the implication for the final decision;
- the condition that would change the section's conclusion or ranking.

The final synthesis may rewrite and de-duplicate chapter prose, but it must preserve the approved argument order, decisive evidence, causal bridges, calculations, caveats, and decision logic. Do not reduce a completed chapter to one paragraph when it contains distinct demand, supply, pricing, profit, valuation, or risk arguments.

## Depth review

Do not use length, chapter count, or source count as a quality target. Review depth by asking whether every decision-relevant layer supported by the evidence survived synthesis:

- give the winner the deepest treatment and give every material alternative an evidence-backed explanation;
- show the common comparison basis, scenario or sensitivity logic, and security-level valuation where relevant;
- preserve the causal bridge from demand through qualified supply and pricing into earnings and valuation;
- retain the opposing evidence, unresolved conflicts, ranking-flip conditions, and a concrete monitoring or invalidation framework.

If the final report feels compressed, compare it against the chapter drafts and restore omitted reasoning. Shorten only by removing repetition, generic background, or non-decision-useful source description.

## Visual notes

Describe visuals in ordinary Markdown near the section they support. A short paragraph or bullets are enough. Include:

- what the reader should learn;
- the evidence or calculation behind it;
- the comparison basis;
- the uncertainty that must remain visible.

Do not prescribe a chart type before understanding the evidence. Use the `investment-visualization` skill to choose, render, and review the final form.

## HTML

Render the complete report in outline order inside the bundled single-page template. Do not expose internal planning labels in the reader-facing report.

Visuals use self-contained HTML/CSS/SVG, show a visible source line, and trace their values to exact `evidence.json` entries. The `investment-visualization` skill owns visual composition and quality review.

Before delivery, compare Markdown and HTML for content parity:

- every reader-facing heading and subsection appears in order;
- every table, list, primary quotation, citation, and planned visual is present;
- late sections such as monitoring and research gaps are not omitted;
- mobile rendering preserves access to every column in wide tables;
- screenshots cover the beginning, middle, and end of the long page.
