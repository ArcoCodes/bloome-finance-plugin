import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { marked } from "marked";
import citationUtils from "../../scripts/citations.cjs";

const { citationLabels, locator, resolveCitation, resolvedCitations } = citationUtils;
const VISUAL_TYPES = new Set(["bar", "line", "stacked-bar", "waterfall", "scatter", "range", "flow", "table", "matrix"]);

function Citation({ item, label }) {
  const source = [item.title, item.published_at].filter(Boolean).join(" · ");
  const display = /^\{\{cite:/.test(label) ? `〔${item.title}, ${locator(item) || item.published_at}〕` : label;
  return <span className="src" tabIndex="0">{display}<span className="tip"><span className="tip-hd">{source}</span><span className="tip-bd">{item.quote_zh || item.quote}</span></span></span>;
}

function citationParts(text, evidence) {
  const pattern = /(\{\{cite:[A-Za-z0-9._-]+\}\}|\[[^\]\n]+\]|〔[^〕\n]+〕|【[^】\n]+】)/g;
  return String(text).split(pattern).filter(Boolean).map((part, index) => {
    const marker = part.match(/^\{\{cite:([A-Za-z0-9._-]+)\}\}$/);
    const item = marker ? resolveCitation(`id:${marker[1]}`, evidence) : /^[\[〔【]/.test(part) ? resolveCitation(part.slice(1, -1), evidence) : null;
    return item ? <Citation key={`${part}-${index}`} item={item} label={part} /> : <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function Inline({ tokens = [], evidenceByCitation }) {
  return tokens.map((token, index) => {
    const key = `${token.type}-${index}`;
    if (token.type === "text" || token.type === "escape") {
      return <React.Fragment key={key}>{token.tokens?.length ? <Inline tokens={token.tokens} evidenceByCitation={evidenceByCitation} /> : citationParts(token.text, evidenceByCitation)}</React.Fragment>;
    }
    if (token.type === "strong") return <strong key={key}><Inline tokens={token.tokens} evidenceByCitation={evidenceByCitation} /></strong>;
    if (token.type === "em") return <em key={key}><Inline tokens={token.tokens} evidenceByCitation={evidenceByCitation} /></em>;
    if (token.type === "del") return <del key={key}><Inline tokens={token.tokens} evidenceByCitation={evidenceByCitation} /></del>;
    if (token.type === "codespan") return <code key={key}>{token.text}</code>;
    if (token.type === "br") return <br key={key} />;
    if (token.type === "link") {
      const href = /^(?:https?:|#)/.test(token.href) ? token.href : undefined;
      return <a key={key} href={href}><Inline tokens={token.tokens} evidenceByCitation={evidenceByCitation} /></a>;
    }
    return null;
  });
}

function Figure({ visual, evidenceById, children }) {
  const sources = visual.evidence_ids.map((id) => ({ id, item:evidenceById.get(id) }));
  return <figure className={`viz viz-type-${visual.type}`} data-visual-key={visual.key} aria-label={visual.aria_label || visual.title}>
    <figcaption><strong>{visual.title}</strong>{visual.deck && <span>{visual.deck}</span>}</figcaption>
    {children}
    {visual.uncertainty && <p className="viz-uncertainty">边界：{visual.uncertainty}</p>}
    <details className="viz-sources"><summary>来源：{sources.length} 项已核验证据</summary><ul>{sources.map(({ id, item }) => <li key={id}><strong>{id}</strong> · {item.title}{locator(item) && ` · ${locator(item)}`}</li>)}</ul></details>
  </figure>;
}

function BarVisual({ visual, evidenceById }) {
  const values = visual.items.map((item) => Number(item.value));
  const max = Math.max(0, ...values);
  if (!values.length || !values.every((value) => Number.isFinite(value) && value >= 0) || max <= 0) throw new Error(`Visual ${visual.key} requires non-negative numeric bar values`);
  return <Figure visual={visual} evidenceById={evidenceById}><div className="viz-bars">
    {visual.items.map((item) => <div className="viz-bar-row" key={item.label}>
      <span className="viz-label">{item.label}</span><span className="viz-track"><i className={item.highlight ? "highlight" : ""} style={{ width:`${Math.max(0, Number(item.value)) / max * 100}%` }} /></span><b>{item.display ?? `${item.value}${visual.unit || ""}`}</b>
    </div>)}
  </div></Figure>;
}

function LineVisual({ visual, evidenceById }) {
  const series = visual.series || [];
  const points = series.flatMap((item) => item.values || []);
  const values = points.map((item) => Number(item.value));
  const min = Math.min(...values), max = Math.max(...values);
  if (!points.length || !values.every(Number.isFinite)) throw new Error(`Visual ${visual.key} requires numeric line values`);
  const labels = series[0].values.map((item) => item.label);
  if (series.some((item) => item.values.length !== labels.length || item.values.some((point, index) => point.label !== labels[index]))) throw new Error(`Visual ${visual.key} line series must share one label sequence`);
  const x = (index) => labels.length === 1 ? 330 : 46 + index * 588 / (labels.length - 1);
  const y = (value) => 218 - (max === min ? .5 : (value - min) / (max - min)) * 160;
  return <Figure visual={visual} evidenceById={evidenceById}><svg className="viz-svg" viewBox="0 0 680 270" role="img" aria-label={visual.aria_label || visual.title}>
    {labels.map((label, index) => <text className="viz-axis" x={x(index)} y="250" textAnchor="middle" key={label}>{label}</text>)}
    {series.map((item, seriesIndex) => {
      const coordinates = item.values.map((point, index) => `${x(index)},${y(Number(point.value))}`).join(" ");
      return <g className={seriesIndex === 0 ? "viz-main" : "viz-context"} key={item.name}>
        <polyline points={coordinates} fill="none" />
        {item.values.map((point, index) => <g key={`${item.name}-${point.label}`}><circle cx={x(index)} cy={y(Number(point.value))} r="4" /><text x={x(index)} y={y(Number(point.value)) - 10} textAnchor="middle">{point.display ?? point.value}</text></g>)}
        <text x="638" y={y(Number(item.values.at(-1).value)) + 4} textAnchor="end">{item.name}</text>
      </g>;
    })}
  </svg></Figure>;
}

function StackedBarVisual({ visual, evidenceById }) {
  const items = visual.items || [];
  const labels = items[0]?.segments?.map((segment) => segment.label) || [];
  const totals = items.map((item) => (item.segments || []).reduce((sum, segment) => sum + Number(segment.value), 0));
  const max = Math.max(0, ...totals);
  if (!items.length || !labels.length || labels.some((label) => !String(label).trim()) || max <= 0 || items.some((item) => !String(item.label || "").trim() || item.segments?.length !== labels.length || item.segments.some((segment, index) => segment.label !== labels[index] || !Number.isFinite(Number(segment.value)) || Number(segment.value) < 0))) throw new Error(`Visual ${visual.key} requires aligned non-negative stacked segments`);
  return <Figure visual={visual} evidenceById={evidenceById}><div className="viz-stacked-legend">{labels.map((label, index) => <span key={label}><i className={`viz-segment-${index % 4}`} />{label}</span>)}</div><div className="viz-stacked-bars">
    {items.map((item, itemIndex) => <div className="viz-stacked-row" key={item.label}><span className="viz-label">{item.label}</span><span className="viz-stacked-track">{item.segments.map((segment, index) => <i className={`viz-segment-${index % 4}`} style={{ width:`${Number(segment.value) / max * 100}%` }} key={segment.label}><span>{segment.display ?? segment.value}</span></i>)}</span><b>{item.display ?? `${totals[itemIndex]}${visual.unit || ""}`}</b></div>)}
  </div></Figure>;
}

function WaterfallVisual({ visual, evidenceById }) {
  const items = visual.items || [];
  let running = 0;
  const bars = items.map((item) => {
    const value = Number(item.value);
    const start = item.total ? 0 : running;
    const end = item.total ? value : running + value;
    running = end;
    return { ...item, value, start, end };
  });
  const values = bars.flatMap((item) => [item.start, item.end, 0]);
  const min = Math.min(...values), max = Math.max(...values);
  if (bars.length < 2 || bars.length > 8 || !bars.every((item) => String(item.label || "").trim() && Number.isFinite(item.value)) || min === max) throw new Error(`Visual ${visual.key} requires two to eight labeled numeric waterfall items`);
  const x = (index) => 52 + index * 590 / bars.length;
  const width = Math.min(54, 500 / bars.length);
  const y = (value) => 224 - (value - min) / (max - min) * 164;
  return <Figure visual={visual} evidenceById={evidenceById}><svg className="viz-svg viz-waterfall" viewBox="0 0 680 280" role="img" aria-label={visual.aria_label || visual.title}>
    <line className="viz-zero" x1="42" x2="650" y1={y(0)} y2={y(0)} />
    {bars.map((item, index) => <g className={item.total ? "viz-total" : item.value >= 0 ? "viz-increase" : "viz-decrease"} key={item.label}>
      {index > 0 && <line className="viz-connector" x1={x(index - 1) + width} x2={x(index)} y1={y(item.total ? item.end : item.start)} y2={y(item.total ? item.end : item.start)} />}
      <rect x={x(index)} y={Math.min(y(item.start), y(item.end))} width={width} height={Math.max(2, Math.abs(y(item.start) - y(item.end)))} />
      <text x={x(index) + width / 2} y={Math.min(y(item.start), y(item.end)) - 7} textAnchor="middle">{item.display ?? `${item.value > 0 && !item.total ? "+" : ""}${item.value}${visual.unit || ""}`}</text>
      <text className="viz-axis" x={x(index) + width / 2} y="254" textAnchor="middle">{item.label}</text>
    </g>)}
  </svg></Figure>;
}

function ScatterVisual({ visual, evidenceById }) {
  const points = visual.points || [];
  const xs = points.map((point) => Number(point.x)), ys = points.map((point) => Number(point.y));
  if (points.length < 2 || !String(visual.x_label || "").trim() || !String(visual.y_label || "").trim() || points.some((point) => !String(point.label || "").trim()) || ![...xs, ...ys].every(Number.isFinite)) throw new Error(`Visual ${visual.key} requires labeled numeric axes and at least two labeled points`);
  let xMin = Math.min(...xs), xMax = Math.max(...xs), yMin = Math.min(...ys), yMax = Math.max(...ys);
  if (xMin === xMax) { xMin -= 1; xMax += 1; }
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const x = (value) => 58 + (Number(value) - xMin) / (xMax - xMin) * 570;
  const y = (value) => 230 - (Number(value) - yMin) / (yMax - yMin) * 170;
  return <Figure visual={visual} evidenceById={evidenceById}><svg className="viz-svg viz-scatter" viewBox="0 0 680 290" role="img" aria-label={visual.aria_label || visual.title}>
    <line className="viz-axis-line" x1="58" x2="638" y1="230" y2="230" /><line className="viz-axis-line" x1="58" x2="58" y1="50" y2="230" />
    <text className="viz-axis-title" x="348" y="278" textAnchor="middle">{visual.x_label}</text><text className="viz-axis-title" x="15" y="140" textAnchor="middle" transform="rotate(-90 15 140)">{visual.y_label}</text>
    {points.map((point) => <g className={point.highlight ? "highlight" : ""} key={point.label}><circle cx={x(point.x)} cy={y(point.y)} r={point.highlight ? 7 : 5} /><text x={x(point.x) + (x(point.x) > 520 ? -9 : 9)} y={y(point.y) - 8} textAnchor={x(point.x) > 520 ? "end" : "start"}>{point.label}{point.display ? ` · ${point.display}` : ""}</text></g>)}
  </svg></Figure>;
}

function RangeVisual({ visual, evidenceById }) {
  const all = visual.items.flatMap((item) => [item.low, item.high, item.base, item.current].filter((value) => value != null).map(Number));
  const min = Math.min(...all), max = Math.max(...all);
  if (!all.length || !all.every(Number.isFinite) || max === min || visual.items.some((item) => Number(item.low) > Number(item.base) || Number(item.base) > Number(item.high))) throw new Error(`Visual ${visual.key} requires ordered numeric ranges`);
  const position = (value) => `${(Number(value) - min) / (max - min) * 100}%`;
  return <Figure visual={visual} evidenceById={evidenceById}><div className="viz-ranges">
    {visual.items.map((item) => <div className="viz-range-row" key={item.label}>
      <span className="viz-label">{item.label}</span><span className="viz-range-track"><i style={{ left:position(item.low), width:`${(Number(item.high) - Number(item.low)) / (max - min) * 100}%` }} /><b style={{ left:position(item.base) }} title={`基准 ${item.base}`} />{item.current != null && <em style={{ left:position(item.current) }} title={`当前 ${item.current}`} />}</span><span>{item.display || `${item.low}–${item.high}`}</span>
    </div>)}
  </div></Figure>;
}

function FlowVisual({ visual, evidenceById }) {
  if (!Array.isArray(visual.nodes) || visual.nodes.length < 2) throw new Error(`Visual ${visual.key} requires at least two flow nodes`);
  return <Figure visual={visual} evidenceById={evidenceById}><div className="viz-flow">
    {visual.nodes.map((node, index) => <React.Fragment key={node.label}><div className={node.highlight ? "viz-node highlight" : "viz-node"}><strong>{node.label}</strong>{node.detail && <span>{node.detail}</span>}</div>{index < visual.nodes.length - 1 && <span className="viz-arrow" aria-hidden="true" />}</React.Fragment>)}
  </div></Figure>;
}

function TableVisual({ visual, evidenceById }) {
  if (!Array.isArray(visual.columns) || !visual.columns.length || !Array.isArray(visual.rows) || visual.rows.some((row) => row.length !== visual.columns.length)) throw new Error(`Visual ${visual.key} table rows must match its columns`);
  return <Figure visual={visual} evidenceById={evidenceById}>
    <div className="data-table viz-table-grid"><table><thead><tr>{visual.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{visual.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
    <div className="viz-table-cards">{visual.rows.map((row, rowIndex) => <section key={rowIndex}>{row.map((cell, cellIndex) => <p key={cellIndex}><strong>{visual.columns[cellIndex]}</strong><span>{cell}</span></p>)}</section>)}</div>
  </Figure>;
}

function MatrixVisual({ visual, evidenceById }) {
  if (!Array.isArray(visual.columns) || !visual.columns.length || !Array.isArray(visual.rows) || visual.rows.some((row) => !Array.isArray(row.values) || row.values.length !== visual.columns.length)) throw new Error(`Visual ${visual.key} matrix rows must match its columns`);
  return <Figure visual={visual} evidenceById={evidenceById}><div className="data-table"><table className="viz-matrix"><thead><tr><th>{visual.corner || ""}</th>{visual.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{visual.rows.map((row, index) => <tr key={row.label}><th>{row.label}</th>{row.values.map((value, cellIndex) => <td className={index === visual.base_row && cellIndex === visual.base_column ? "highlight" : ""} key={cellIndex}>{value}</td>)}</tr>)}</tbody></table></div></Figure>;
}

function Visual({ visual, evidenceById }) {
  const components = { bar:BarVisual, line:LineVisual, "stacked-bar":StackedBarVisual, waterfall:WaterfallVisual, scatter:ScatterVisual, range:RangeVisual, flow:FlowVisual, table:TableVisual, matrix:MatrixVisual };
  const Component = components[visual.type];
  return <Component visual={visual} evidenceById={evidenceById} />;
}

function Blocks({ tokens = [], context }) {
  return tokens.map((token, index) => {
    const key = `${token.type}-${index}`;
    if (token.type === "space") return null;
    if (token.type === "paragraph") {
      const text = token.text.trim();
      const marker = text.match(/^\{\{visual:([a-z0-9][a-z0-9_-]*)\}\}$/i);
      if (marker) return <Visual key={key} visual={context.visuals.get(marker[1])} evidenceById={context.evidenceById} />;
      return <p key={key}><Inline tokens={token.tokens} evidenceByCitation={context.evidenceByCitation} /></p>;
    }
    if (token.type === "heading") {
      const Heading = `h${Math.min(6, Math.max(2, token.depth))}`;
      return <Heading key={key}><Inline tokens={token.tokens} evidenceByCitation={context.evidenceByCitation} /></Heading>;
    }
    if (token.type === "blockquote") return <blockquote className="primary-quote" key={key}><Blocks tokens={token.tokens} context={context} /></blockquote>;
    if (token.type === "list") {
      const List = token.ordered ? "ol" : "ul";
      return <List key={key}>{token.items.map((item, itemIndex) => <li key={itemIndex}><Blocks tokens={item.tokens} context={context} /></li>)}</List>;
    }
    if (token.type === "text") return <React.Fragment key={key}><Inline tokens={token.tokens || [token]} evidenceByCitation={context.evidenceByCitation} /></React.Fragment>;
    if (token.type === "table") return <div className="data-table" key={key}><table><thead><tr>{token.header.map((cell, cellIndex) => <th key={cellIndex}><Inline tokens={cell.tokens} evidenceByCitation={context.evidenceByCitation} /></th>)}</tr></thead><tbody>{token.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}><Inline tokens={cell.tokens} evidenceByCitation={context.evidenceByCitation} /></td>)}</tr>)}</tbody></table></div>;
    if (token.type === "code") return <pre key={key}><code>{token.text}</code></pre>;
    if (token.type === "hr") return <hr key={key} />;
    return null;
  });
}

function reportParts(markdown) {
  const tokens = marked.lexer(markdown, { gfm:true });
  const titleIndex = tokens.findIndex((token) => token.type === "heading" && token.depth === 1);
  if (titleIndex < 0) return { title:"Investment Research", hasTitle:false, sections:[{ title:"核心判断", tokens }] };
  const title = tokens[titleIndex].text.trim();
  const sections = [];
  let current = { title:"核心判断", tokens:[] };
  for (const token of tokens.slice(titleIndex + 1)) {
    if (token.type === "heading" && token.depth === 1) {
      if (current.tokens.length) sections.push(current);
      current = { title:token.text.trim(), tokens:[] };
    } else current.tokens.push(token);
  }
  if (current.tokens.length || !sections.length) sections.push(current);
  return { title, hasTitle:true, sections };
}

function tokenText(token) {
  if (!token) return "";
  if (Array.isArray(token)) return token.map(tokenText).join("\n");
  if (token.type === "table") return tokenText([...token.header, ...token.rows.flat()]);
  if (token.type === "list") return tokenText(token.items);
  if (token.tokens) return tokenText(token.tokens);
  return String(token.text || "");
}

export function inspectReport(markdown, evidence = []) {
  const parts = reportParts(markdown);
  const primaryQuotes = [];
  for (const section of parts.sections) {
    let context = [];
    let inQuoteGroup = false;
    for (const token of section.tokens) {
      if (token.type === "blockquote") {
        primaryQuotes.push({ text:tokenText(token.tokens), precedingText:context.join("\n"), groupStart:!inQuoteGroup });
        inQuoteGroup = true;
        continue;
      }
      const text = tokenText(token);
      if (!text.trim() || /^\{\{visual:[^}]+\}\}$/.test(text.trim())) continue;
      if (String(text).replace(/[^\p{Letter}\p{Number}]+/gu, "").length >= 24) {
        if (inQuoteGroup) context = [];
        inQuoteGroup = false;
      }
      if (!inQuoteGroup) context.push(text);
    }
  }
  return { ...parts, citations:resolvedCitations(markdown, evidence), citationLabels:citationLabels(markdown), primaryQuotes };
}

function normalizeVisuals(value, evidenceById, markdown) {
  const list = Array.isArray(value) ? value : value?.visuals || [];
  const map = new Map();
  for (const visual of list) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(visual?.key || "")) throw new Error("Every visual requires a descriptive filesystem-safe key");
    if (map.has(visual.key)) throw new Error(`Duplicate visual key: ${visual.key}`);
    if (!VISUAL_TYPES.has(visual.type)) throw new Error(`Unsupported visual type for ${visual.key}: ${visual.type}`);
    if (!String(visual.title || "").trim()) throw new Error(`Visual ${visual.key} requires a conclusion-led title`);
    if (!Array.isArray(visual.evidence_ids) || !visual.evidence_ids.length) throw new Error(`Visual ${visual.key} requires evidence_ids`);
    for (const id of visual.evidence_ids) if (!evidenceById.has(String(id))) throw new Error(`Visual ${visual.key} references unknown evidence ID: ${id}`);
    map.set(visual.key, visual);
  }
  const markers = [...markdown.matchAll(/\{\{visual:([a-z0-9][a-z0-9_-]*)\}\}/gi)].map((match) => match[1]);
  for (const key of markers) if (!map.has(key)) throw new Error(`Missing visual specification: ${key}`);
  for (const key of map.keys()) {
    const placements = markers.filter((marker) => marker === key).length;
    if (placements !== 1) throw new Error(`Visual ${key} must be placed exactly once in report.md`);
  }
  return map;
}

function Report({ markdown, evidence, coverage, visuals, css }) {
  const { title, sections } = reportParts(markdown);
  const [lead, ...rest] = sections;
  const evidenceByCitation = evidence;
  const evidenceById = new Map(evidence.flatMap((item) => [item.id, item.chunk_id].filter(Boolean).map((id) => [String(id), item])));
  const visualMap = normalizeVisuals(visuals, evidenceById, markdown);
  const context = { evidenceByCitation, evidenceById, visuals:visualMap };
  const reportMonth = coverage.report_month || coverage.data_cutoff || coverage.report_date || "未注明";
  const sourceSummary = `来源覆盖：卖方研报 ${coverage.sell_reports_read || 0} 篇 · 产业资料 ${coverage.primary_sources_read || 0} 篇 · 完整来源见正文与证据台账`;
  return <html lang="zh-CN"><head><meta charSet="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="generator" content="Bloome React SSR" /><title>{title}</title><style dangerouslySetInnerHTML={{ __html:css }} /></head><body>
    <main className="report"><div className="top-bar" /><header className="header"><div className="header-label">Global Investment Research</div><div className="header-title">{title}</div><div className="header-meta">数据覆盖：卖方机构研报已读 {coverage.sell_reports_read || 0} 篇 · 产业资料已读 {coverage.primary_sources_read || 0} 篇 · 数据截至 {reportMonth}</div></header>
      <section className="section judge-box"><div className="judge-label">{lead.title}</div><div className="analysis-text"><Blocks tokens={lead.tokens} context={context} /></div></section>
      {rest.map((section) => <section className="section" key={section.title}><div className="section-label">{section.title}</div><div className="analysis-text"><Blocks tokens={section.tokens} context={context} /></div></section>)}
      <footer className="source-bar">{sourceSummary}</footer><div className="bottom-bar" /></main>
  </body></html>;
}

const componentCss = `
.analysis-text h2,.analysis-text h3{margin:22px 0 10px;color:#003A5C;line-height:1.35}.analysis-text ul,.analysis-text ol{margin:0 0 14px 22px}.analysis-text li{margin:6px 0}.analysis-text pre{overflow:auto;margin:16px 0;padding:14px;background:#F7F5F0}.analysis-text code{font-family:ui-monospace,SFMono-Regular,monospace}.analysis-text table{margin:16px 0}.viz{margin:24px 0;padding:18px 20px;border:1px solid #E0DCD4;border-radius:8px;background:#fff;font-family:'Helvetica Neue',Arial,sans-serif}.viz figcaption{margin-bottom:18px}.viz figcaption strong{display:block;color:#003A5C;font-size:14px;line-height:1.4}.viz figcaption span{display:block;margin-top:5px;color:#5A5A5A;font-size:11px;line-height:1.5}.viz-uncertainty{margin:14px 0 0;padding-top:10px;border-top:1px solid #E0DCD4;color:#5A5A5A;font-size:11px;line-height:1.5}.viz-sources{margin-top:10px;color:#777;font-size:10px;line-height:1.5}.viz-sources summary{cursor:pointer}.viz-sources ul{max-height:180px;overflow:auto;margin:8px 0 0;padding-left:18px}.viz-sources li{margin:4px 0}.viz-table-cards{display:none}.viz-bars,.viz-ranges{display:flex;flex-direction:column;gap:12px}.viz-bar-row,.viz-range-row{display:grid;grid-template-columns:minmax(90px,1fr) minmax(180px,3fr) auto;gap:12px;align-items:center;font-size:11px}.viz-label{color:#003A5C;font-weight:600}.viz-track{height:10px;background:#E0DCD4;border-radius:5px;overflow:hidden}.viz-track i{display:block;height:100%;background:#7A93A6}.viz-track i.highlight{background:#B59A57}.viz-svg{display:block;width:100%;height:auto}.viz-svg polyline{stroke:#003A5C;stroke-width:2}.viz-svg circle{fill:#B59A57}.viz-svg text{fill:#5A5A5A;font-size:10px}.viz-svg .viz-context polyline{stroke:#7A93A6;stroke-dasharray:5 4}.viz-axis{fill:#5A5A5A}.viz-range-track{position:relative;height:26px;border-bottom:1px solid #D5D1C8}.viz-range-track i{position:absolute;top:10px;height:7px;border-radius:4px;background:#B59A57}.viz-range-track b,.viz-range-track em{position:absolute;top:4px;width:2px;height:19px;background:#003A5C}.viz-range-track em{width:7px;height:7px;top:10px;border-radius:50%;background:#C65B4A;transform:translateX(-3px)}.viz-stacked-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin-bottom:12px;color:#5A5A5A;font-size:10px}.viz-stacked-legend span{display:flex;align-items:center;gap:5px}.viz-stacked-legend i{width:9px;height:9px;border-radius:2px}.viz-stacked-bars{display:flex;flex-direction:column;gap:12px}.viz-stacked-row{display:grid;grid-template-columns:minmax(90px,1fr) minmax(180px,3fr) auto;gap:12px;align-items:center;font-size:11px}.viz-stacked-track{display:flex;height:20px;overflow:hidden;border-radius:4px;background:#E0DCD4}.viz-stacked-track>i{display:flex;align-items:center;justify-content:center;min-width:0;overflow:hidden;color:#fff;font-style:normal}.viz-stacked-track>i.viz-segment-1{color:#003A5C}.viz-stacked-track>i span{padding:0 3px;overflow:hidden;text-overflow:ellipsis}.viz-segment-0{background:#003A5C}.viz-segment-1{background:#B59A57}.viz-segment-2{background:#7A93A6}.viz-segment-3{background:#8A6F59}.viz-waterfall rect{fill:#7A93A6}.viz-waterfall .viz-increase rect{fill:#003A5C}.viz-waterfall .viz-decrease rect{fill:#C65B4A}.viz-waterfall .viz-total rect{fill:#B59A57}.viz-waterfall .viz-connector,.viz-waterfall .viz-zero,.viz-scatter .viz-axis-line{stroke:#B8B2A7;stroke-width:1}.viz-scatter circle{fill:#7A93A6}.viz-scatter .highlight circle{fill:#B59A57;stroke:#003A5C;stroke-width:2}.viz-axis-title{fill:#003A5C!important;font-weight:600}.viz-flow{display:flex;align-items:center;gap:8px}.viz-node{flex:1;min-width:0;padding:12px;border:1px solid #E0DCD4;border-radius:6px;text-align:center}.viz-node.highlight{border-color:#B59A57;background:#F7F5F0}.viz-node strong,.viz-node span{display:block}.viz-node strong{color:#003A5C;font-size:12px}.viz-node span{margin-top:4px;color:#5A5A5A;font-size:10px;line-height:1.4}.viz-arrow{position:relative;width:22px;height:12px;flex:none}.viz-arrow::before{content:'';position:absolute;top:5px;left:0;width:18px;border-top:1.5px solid #B59A57}.viz-arrow::after{content:'';position:absolute;top:2px;right:1px;width:6px;height:6px;border-top:1.5px solid #B59A57;border-right:1.5px solid #B59A57;transform:rotate(45deg)}.viz .data-table{padding:0;overflow-x:auto}.viz-matrix td.highlight{background:#F1EAD9;color:#003A5C;font-weight:700}@media(max-width:560px){.viz{padding:15px 14px}.viz-table-grid{display:none}.viz-table-cards{display:grid;gap:10px}.viz-table-cards section{padding:12px;border:1px solid #E0DCD4;border-radius:6px;background:#fff}.viz-table-cards p{display:grid;grid-template-columns:minmax(90px,.8fr) 1.2fr;gap:10px;margin:0;padding:6px 0;border-bottom:1px solid #EEEAE2;font-size:11px;line-height:1.45}.viz-table-cards p:last-child{border-bottom:0}.viz-table-cards strong{color:#003A5C}.viz-table-cards span{color:#333}.viz-bar-row,.viz-range-row,.viz-stacked-row{grid-template-columns:80px minmax(110px,1fr) auto;gap:8px}.viz-flow{align-items:stretch;flex-direction:column}.viz-arrow{transform:rotate(90deg);align-self:center}.viz-svg text{font-size:11px}}
`;

export function renderReport({ markdown, evidence = [], coverage = {}, visuals = { visuals:[] }, template }) {
  const baseCss = template.match(/<style>([\s\S]*?)<\/style>/i)?.[1] || "";
  const behavior = template.match(/<script>([\s\S]*?)<\/script>/i)?.[1] || "";
  const document = renderToStaticMarkup(<Report markdown={markdown} evidence={evidence} coverage={coverage} visuals={visuals} css={`${baseCss}\n${componentCss}`} />);
  return `<!DOCTYPE html>${document.replace("</body>", `<script>${behavior}</script></body>`)}`;
}

export function renderWorkspace(workspace, pluginRoot = path.resolve(__dirname, "..")) {
  const root = path.resolve(workspace);
  const finalPath = path.join(root, "final_report.md");
  const reportPath = path.join(root, "report.md");
  const markdown = fs.readFileSync(fs.existsSync(finalPath) ? finalPath : reportPath, "utf8");
  fs.writeFileSync(reportPath, markdown);
  const evidence = JSON.parse(fs.readFileSync(path.join(root, "evidence.json"), "utf8"));
  const coverage = JSON.parse(fs.readFileSync(path.join(root, "coverage_stats.json"), "utf8"));
  const visuals = JSON.parse(fs.readFileSync(path.join(root, "visuals.json"), "utf8"));
  const template = fs.readFileSync(path.join(pluginRoot, "skills", "investment-research", "assets", "template.html"), "utf8");
  const html = renderReport({ markdown, evidence, coverage, visuals, template });
  fs.writeFileSync(path.join(root, "report.html"), `${html}\n`);
  return { ok:true, workspace:root, report:reportPath, visuals:path.join(root, "visuals.json"), html:path.join(root, "report.html") };
}

if (require.main === module) {
  const workspace = process.argv[2];
  if (!workspace) throw new Error("Usage: render-report <absolute-workspace>");
  process.stdout.write(`${JSON.stringify(renderWorkspace(workspace, process.env.BLOOME_PLUGIN_ROOT), null, 2)}\n`);
}
