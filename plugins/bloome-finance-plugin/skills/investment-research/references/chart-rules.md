# Chart Rules

Use a visual only when structure helps the argument. A controlled table is better for exact lookup; prose is better for one or two values.

## Selection

| Evidence structure | `visuals.json` type |
|---|---|
| Time series or inflection | `line` |
| One-period comparison or ranking | `bar` |
| Composition across categories or periods | `stacked-bar` |
| Signed bridge from drivers to earnings | `waterfall` |
| Growth–valuation, probability–payoff, or risk–return plane | `scatter` |
| Valuation, target-price, or scenario interval | `range` |
| Causal transmission or process | `flow` |
| Exact multi-metric comparison | `table` |
| Two-variable sensitivity | `matrix` |

Use only types defined in `visual-spec.md`. If a recurring evidence structure genuinely needs another form, add one reviewed React component and contract test; never improvise raw HTML/SVG in a report run.

## Data and editorial rules

- Every visual has a conclusion-led title, visible units or basis, accessible description, uncertainty where material, and exact accepted evidence IDs.
- The sentence before `{{visual:key}}` states the claim the visual supports.
- Observed, forecast, and scenario values remain distinguishable in labels and explanatory text.
- Keep dates, forecast periods, currencies, fiscal/calendar years, and accounting definitions comparable.
- Use a zero baseline for `bar` values.
- Put the main series first in `line`; all series share one honest scale and label sequence.
- Keep every `stacked-bar` segment on one absolute basis and in one label order; do not silently normalize totals.
- Use `waterfall` only for additive signed bridges and mark from-zero totals explicitly.
- Give `scatter` explicit numeric axes and direct point labels; do not imply correlation from a small sample.
- Use `range` only when every item shares one basis.
- Keep `flow` in one reading direction with few nodes and explicit gates.
- Print every `matrix` value and mark the base row/column.
- Never invent interpolation, missing periods, normalized scores, or proportions.
- Do not rely on hover, remote assets, chart libraries, raw HTML, custom CSS, or JavaScript.

The controlled React renderer owns geometry, palette, typography, and mobile behavior. The `investment-visualization` skill owns selection, normalization, annotation text, uncertainty, sequence, and screenshot review.
