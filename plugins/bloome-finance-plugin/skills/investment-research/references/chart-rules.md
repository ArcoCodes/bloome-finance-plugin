# Chart rules

Use a chart only when visual structure helps the argument. A table is better for exact lookup; prose is better for one or two values.

## Selection

| Data structure | Presentation |
|---|---|
| Time series | inline SVG line chart |
| Discrete comparison | horizontal bars or columns |
| Quantity plus growth | bars plus line, with both axes labeled |
| Price/revenue/margin/EPS bridge | waterfall |
| Bull/base/bear | grouped bars or range plot |
| One-variable sensitivity | tornado |
| Two-variable sensitivity | table/heatmap with printed values |
| Share/market structure | sorted bars; doughnut only for a small complete whole |
| Valuation methods/ranges | football/range plot |
| Exact multi-metric comparison | table |

Relationship rather than numeric data goes through `concept-diagrams.md`.

## Rendering

- Prefer the runtime's `reson-charts` widget for numeric data charts when it is available. Use its documented chart type and data schema, configure the report palette, and give every chart an explicit height. If it is unavailable, render an equivalent self-contained inline SVG/CSS chart; do not load remote assets or invent an API.
- Keep every chart inside the template's existing visual system.
- Every chart has a visible title, units, numeric anchors, source line, and accessible description (`role="img" aria-label="..."`).
- Print important values directly. Do not rely on hover for the chart's meaning.
- Use the report palette only. Distinguish series with labels, line styles, or patterns as well as color.
- Never truncate labels or let secondary data obscure the main series.
- The sentence before a chart must state the claim it supports; never write “the chart below shows”.
- Arrows are SVG paths/symbols, never text glyphs such as `->` or `▶`.
- Do not invent interpolation, missing periods, or proportions. If reliable scaling is awkward, use a table.

## Widget Contract

When the runtime provides `reson-charts`, use the following conceptual contract and read its own catalog/schema before calling it:

```js
ResonChart.configure({
  brand: { blue: '#003A5C', orange: '#B59A57' },
  palette: ['#003A5C', '#B59A57', '#5A5A5A', '#7A93A6', '#D4C089']
});
ResonChart.render('chart-id', { type, data, height: '300px', options });
```

Use `options.labels` to localize built-in labels and use `.chart-source` below the chart. Never mix an unlabelled widget with an unrelated legend or put the only source in a hover state.

Recommended numeric chart types are `line`, `combo`, `waterfall`, `clustered`, `tornado`, `sensitivity`, `doughnut`, `mekko`, `treemap`, `football`, and `source-attribution`. Use the actual supported catalog rather than assuming every runtime supports every type.
