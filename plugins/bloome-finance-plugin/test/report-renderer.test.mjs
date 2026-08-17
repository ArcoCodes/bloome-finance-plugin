import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const renderer = require("../dist/render-report.cjs");

test("React SSR compiles Markdown into self-contained report HTML", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "bloome-react-report-"));
  await mkdir(workspace, { recursive:true });
  await Promise.all([
    writeFile(path.join(workspace, "report.md"), `# AI NAND 周期研究\n\n# 核心判断\n\n需求改善，但验证周期仍限制盈利兑现。{{cite:s1}}\n\n渠道也观察到改善。[Channel Check，2026-08-01]\n\n> 渠道反馈显示订单改善，但库存仍需观察。\n>\n> 来源：Channel Check · 2026-08-01\n\n# 情景与估值\n\n| 情景 | 结论 |\n|---|---|\n| 基准 | 谨慎增持 |\n\n<div id="unsafe">bad</div>\n\n{{visual:scenario-range}}\n`),
    writeFile(path.join(workspace, "evidence.json"), JSON.stringify([
      { chunk_id:"s1",title:"NAND Market Outlook",page_start:3,published_at:"2026-08-01",quote:"Demand is improving while qualification remains uncertain.",quote_zh:"需求正在改善，但验证仍存在不确定性。<u>非标注</u>" },
      { chunk_id:"s2",title:"Channel Check",published_at:"2026-08-01",quote:"Channel demand improved." },
    ])),
    writeFile(path.join(workspace, "visuals.json"), JSON.stringify({ visuals:[{ key:"scenario-range",type:"range",title:"基准情景保留上行空间",deck:"估值区间与当前价格使用同一口径。",uncertainty:"验证延迟会把兑现时间推后",aria_label:"NAND 基准估值区间",evidence_ids:["s1"],items:[{label:"NAND",low:8,base:13,high:18,current:10,display:"8–18"}] }] })),
    writeFile(path.join(workspace, "coverage_stats.json"), JSON.stringify({ sell_reports_read:4,primary_sources_read:3,report_month:"2026年8月" })),
  ]);

  const result = renderer.renderWorkspace(workspace);
  const html = await readFile(result.html, "utf8");
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /<meta name="generator" content="Bloome React SSR"/);
  assert.match(html, /class="report"/);
  assert.match(html, /AI NAND 周期研究/);
  assert.match(html, /〔NAND Market Outlook, p\.3〕/);
  assert.match(html, /需求正在改善，但验证仍存在不确定性。/);
  assert.match(html, /&lt;u&gt;非标注&lt;\/u&gt;/);
  assert.match(html, /Channel demand improved\./);
  assert.equal((html.match(/class="src"/g) || []).length, 2);
  assert.match(html, /class="primary-quote"/);
  assert.match(html, /<table>/);
  assert.match(html, /<figure class="viz viz-type-range"/);
  assert.match(html, /<details class="viz-sources">/);
  assert.doesNotMatch(html, /react(?:-dom)?(?:\.production)?\.js|<script[^>]+src=/i);
  assert.doesNotMatch(html, /dangerouslySetInnerHTML|\{\{visual:|id="unsafe"/);
  const inspection = renderer.inspectReport(
    await readFile(path.join(workspace, "report.md"), "utf8"),
    JSON.parse(await readFile(path.join(workspace, "evidence.json"), "utf8")),
  );
  assert.equal(inspection.title, "AI NAND 周期研究");
  assert.equal(inspection.primaryQuotes.length, 1);
  assert.match(inspection.primaryQuotes[0].text, /来源：Channel Check/);
  await writeFile(path.join(workspace, "report.md"), `${await readFile(path.join(workspace, "report.md"), "utf8")}\n{{visual:scenario-range}}\n`);
  assert.throws(() => renderer.renderWorkspace(workspace), /must be placed exactly once/);
});

test("controlled renderer supports every visual specification type", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "bloome-visual-specs-"));
  const keys = ["bars", "lines", "stacked", "waterfall", "scatter", "ranges", "flow", "table", "matrix"];
  await Promise.all([
    writeFile(path.join(workspace, "report.md"), `# Visual report\n\n# Decision\n\n${keys.map((key) => `{{visual:${key}}}`).join("\n\n")}\n`),
    writeFile(path.join(workspace, "evidence.json"), JSON.stringify([{ chunk_id:"e1",title:"Source",page_start:1,quote:"Evidence",published_at:"2026-08-01" }])),
    writeFile(path.join(workspace, "coverage_stats.json"), JSON.stringify({})),
    writeFile(path.join(workspace, "visuals.json"), JSON.stringify({ visuals:[
      { key:"bars",type:"bar",title:"Bars",evidence_ids:["e1"],items:[{label:"A",value:2,highlight:true},{label:"B",value:1}] },
      { key:"lines",type:"line",title:"Lines",evidence_ids:["e1"],series:[{name:"Demand",values:[{label:"2026",value:1},{label:"2027E",value:2}]}] },
      { key:"stacked",type:"stacked-bar",title:"Stacked bars",evidence_ids:["e1"],items:[{label:"2026",segments:[{label:"Industrial",value:6},{label:"Investment",value:4}],display:"10"},{label:"2027E",segments:[{label:"Industrial",value:8},{label:"Investment",value:5}],display:"13"}] },
      { key:"waterfall",type:"waterfall",title:"Waterfall",evidence_ids:["e1"],items:[{label:"Start",value:10,total:true},{label:"Price",value:4},{label:"Cost",value:-2},{label:"End",value:12,total:true}] },
      { key:"scatter",type:"scatter",title:"Scatter",x_label:"Growth",y_label:"Valuation",evidence_ids:["e1"],points:[{label:"A",x:12,y:10,highlight:true},{label:"B",x:8,y:14}] },
      { key:"ranges",type:"range",title:"Ranges",evidence_ids:["e1"],items:[{label:"A",low:1,base:2,high:3,current:1.5}] },
      { key:"flow",type:"flow",title:"Flow",evidence_ids:["e1"],nodes:[{label:"A"},{label:"B",highlight:true}] },
      { key:"table",type:"table",title:"Table",evidence_ids:["e1"],columns:["A","B"],rows:[["x","1"]] },
      { key:"matrix",type:"matrix",title:"Matrix",evidence_ids:["e1"],columns:["Low","Base"],rows:[{label:"Low",values:["1","2"]},{label:"Base",values:["2","3"]}],base_row:1,base_column:1 },
    ] })),
  ]);
  const result = renderer.renderWorkspace(workspace);
  const html = await readFile(result.html, "utf8");
  for (const type of ["bar", "line", "stacked-bar", "waterfall", "scatter", "range", "flow", "table", "matrix"]) assert.match(html, new RegExp(`viz-type-${type}`));
  assert.match(html, /Industrial/);
  assert.match(html, /Price/);
  assert.match(html, /Growth/);
  assert.match(html, /class="viz-table-cards"/);
  assert.doesNotMatch(html, /\{\{visual:/);
});
