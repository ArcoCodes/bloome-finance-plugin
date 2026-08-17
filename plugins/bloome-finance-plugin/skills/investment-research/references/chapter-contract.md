# Chapter Writer Contract

A chapter is one reader-facing substantive section from the frozen `report_outline.md`. Chapter writing begins only after `evidence.json`, `decision.md`, and the outline are complete.

The parent gives each writer:

- the report topic and language;
- one section title and brief;
- one unique `chapter_XX_<slug>.md` output path;
- `decision.md` and the section's required conclusion;
- only the accepted evidence entries, module memo passages, calculations, and opposing evidence relevant to that section;
- short descriptions of neighboring sections so the chapter does not duplicate them.

Write only the assigned chapter file. Use the natural reader-facing heading from the outline and the existing final-report citation and quotation format. If the outline plans a visual, preserve its descriptive key and state the supporting evidence or calculation in reader-facing analysis so the parent can build `visuals.json`. Do not add “图表输入”, “visual production note”, or other internal instructions to the chapter, and do not write a visual specification or render HTML. Do not edit `evidence.json`, `decision.md`, the outline, another chapter, `final_report.md`, `report.md`, or HTML.

The chapter must contain:

- a direct answer consistent with `decision.md`;
- the complete evidence-to-conclusion chain, with every causal bridge stated;
- relevant figures, calculations, comparison bases, and valuation normalization;
- primary calibration and source disagreement where available;
- the investment implication;
- a material boundary, opposing view, risk, or invalidating condition;
- the condition that would change the section conclusion or final ranking.

Use only accepted evidence supplied by the parent. Write inline references as `{{cite:<evidence-id>}}` using the supplied exact `id` or `chunk_id`; never invent a shortened institution/date citation. Keep every citation mapped to `evidence.json`, preserve complete reader-facing quotations, and place primary quotations next to the claims they calibrate. Do not pad the chapter with generic background and do not compress distinct mechanisms, alternatives, scenarios, calculations, or risks into an executive-summary paragraph.

Return only a short direct answer and the chapter path. The file retains the full prose.
