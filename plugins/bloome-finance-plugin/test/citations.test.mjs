import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { citationLabels, resolveCitation, resolvedCitations } = require("../scripts/citations.cjs");
const evidence = [
  { chunk_id:"s1",title:"Market Outlook",page_start:7,published_at:"2026-07-01" },
  { chunk_id:"p1",title:"Industry Interview",line_start:2,line_end:3,published_at:"2026-07-02" },
];

test("shared citation resolver accepts locators, dates, and primary source lines", () => {
  assert.equal(resolveCitation("id:s1", evidence).chunk_id, "s1");
  assert.equal(resolveCitation("Market Outlook，机构，2026-07-01，p.7", evidence).chunk_id, "s1");
  assert.equal(resolveCitation("Industry Interview · 2026-07-02", evidence).chunk_id, "p1");
  const markdown = "判断。[Market Outlook, p.7]\n\n> 访谈原文。\n>\n> 来源：Industry Interview · 2026-07-02";
  assert.deepEqual(citationLabels(markdown), ["Market Outlook, p.7", "Industry Interview · 2026-07-02"]);
  assert.deepEqual(resolvedCitations(markdown, evidence).map(({ item }) => item.chunk_id), ["s1", "p1"]);
});

test("shared citation resolver rejects ambiguous title-only citations", () => {
  const duplicates = [...evidence, { chunk_id:"s2",title:"Market Outlook",page_start:8,published_at:"2026-07-01" }];
  assert.equal(resolveCitation("Market Outlook", duplicates), null);
  assert.equal(resolveCitation("Market Outlook, p.8", duplicates).chunk_id, "s2");
});
