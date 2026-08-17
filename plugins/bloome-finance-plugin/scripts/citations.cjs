function locator(item) {
  if (item?.page_start != null) return `${item.page_end != null && item.page_end !== item.page_start ? "pp" : "p"}.${item.page_start}${item.page_end != null && item.page_end !== item.page_start ? `-${item.page_end}` : ""}`;
  if (item?.line_start != null) return `line${item.line_end != null && item.line_end !== item.line_start ? "s" : ""} ${item.line_start}${item.line_end != null && item.line_end !== item.line_start ? `-${item.line_end}` : ""}`;
  return "";
}

function normalize(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/[，]/g, ",").replace(/\s+/g, " ").trim();
}

function citationLabels(markdown) {
  const text = String(markdown || "");
  const markers = [...text.matchAll(/\{\{cite:([A-Za-z0-9._-]+)\}\}/g)].map((match) => `id:${match[1]}`);
  const brackets = [...text.matchAll(/(?:\[([^\]\n]+)\]|〔([^〕\n]+)〕|【([^】\n]+)】)/g)].map((match) => match[1] ?? match[2] ?? match[3]);
  const sources = [...text.matchAll(/^\s*>?\s*来源[:：]\s*(.+)$/gm)].map((match) => match[1].trim());
  return [...markers, ...brackets, ...sources];
}

function resolveCitation(label, evidence) {
  const items = Array.isArray(evidence) ? evidence : [];
  const id = String(label || "").match(/^id:([A-Za-z0-9._-]+)$/)?.[1];
  if (id) {
    const matches = items.filter((item) => [item.id, item.chunk_id].some((value) => String(value || "") === id));
    return matches.length === 1 ? matches[0] : null;
  }
  const normalized = normalize(label);
  const candidates = items
    .map((item) => ({ item, title:normalize(item.title) }))
    .filter(({ title }) => title && normalized.includes(title))
    .sort((a, b) => b.title.length - a.title.length);
  if (!candidates.length) return null;
  const longest = candidates[0].title.length;
  const titled = candidates.filter((candidate) => candidate.title.length === longest);
  const citedLocator = normalized.match(/(?:p{1,2}\.\s*\d+(?:[-–]\d+)?|lines?\s*\d+(?:[-–]\d+)?)/i)?.[0];
  if (citedLocator) {
    const located = titled.filter(({ item }) => normalize(locator(item)) === normalize(citedLocator));
    return located.length === 1 ? located[0].item : null;
  }
  const citedDate = normalized.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  if (citedDate) {
    const dated = titled.filter(({ item }) => String(item.published_at || "").startsWith(citedDate));
    return dated.length === 1 ? dated[0].item : null;
  }
  return titled.length === 1 ? titled[0].item : null;
}

function resolvedCitations(markdown, evidence) {
  return citationLabels(markdown).map((label) => ({ label, item:resolveCitation(label, evidence) })).filter(({ item }) => item);
}

module.exports = { citationLabels, locator, normalize, resolveCitation, resolvedCitations };
