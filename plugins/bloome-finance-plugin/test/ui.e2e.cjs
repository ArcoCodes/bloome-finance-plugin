"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const server = require("../mcp/server.cjs");

const reportHtml = fs.readFileSync(path.resolve(__dirname, "../skills/investment-research/assets/template.html"), "utf8")
  .replace("【报告标题】", "AI 推理需求与 NAND 价格周期")
  .replace("核心判断……", "推理侧本地存储需求正在改善需求结构，但价格弹性仍取决于库存去化和原厂资本开支纪律。")
  .replace("高/中/低 — 原因", "中 — 需求信号明确，价格传导仍待验证")
  .replace("① 观点标题", "① 需求结构正在改变")
  .replace("分析内容，引用用", "推理负载把更多中间状态带回服务器本地存储，单位计算的闪存需求上升。")
  .replace("买方纪要原话……", "客户对高容量企业级 SSD 的询单增加，但交付节奏仍然谨慎。")
  .replace("② 相关标的核心数据", "② 相关标的核心数据")
  .replaceAll("{{sell_reports_read}}", "15")
  .replaceAll("{{primary_sources_read}}", "9")
  .replaceAll("{{report_month}}", "2026年7月")
  .replaceAll("{{primary_quote_source}}", "产业访谈 · 2026-07-02")
  .replaceAll("{{evidence_count}}", "2")
  .replaceAll("{{logic_claim}}", "推理负载扩大服务器本地闪存需求")
  .replaceAll("{{logic_causal_chain}}", "推理请求增加 → 中间状态写入增加 → 企业级 SSD 容量需求上升")
  .replaceAll("{{logic_assumptions}}", "推理负载持续增长，且本地闪存未被其他介质替代")
  .replaceAll("{{logic_indicators}}", "企业级 SSD 询单、出货量与库存周转")
  .replaceAll("{{logic_risks}}", "库存回升或单位计算闪存用量下降")
  .replaceAll("{{validation_claim}}", "需求改善能够传导至价格")
  .replaceAll("{{support_evidence}}", "高容量企业级 SSD 询单增加")
  .replaceAll("{{opposing_evidence}}", "库存去化速度低于预期")
  .replaceAll("{{calibration_result}}", "方向成立，但价格弹性可能推迟一个季度")
  .replaceAll("{{unverified_point}}", "下游补库能否持续两个季度")
  .replaceAll("{{evidence_strength}}", "medium")
  .replaceAll("{{judgment_falsifier}}", "库存连续回升且合约价未改善")
  .replaceAll("{{evidence_chunk_id}}", "C1")
  .replaceAll("{{evidence_corpus}}", "primary")
  .replaceAll("{{evidence_stance}}", "support")
  .replaceAll("{{evidence_claim}}", "推理负载扩大本地存储需求")
  .replaceAll("{{evidence_quote}}", "推理系统将更多中间状态卸载到本地闪存。")
  .replaceAll("{{evidence_title}}", "Technical brief")
  .replaceAll("{{evidence_published_at}}", "2026-07-01")
  .replaceAll("{{evidence_locator}}", "p.7");
const fixture = {
  ok:true,workspace:"/tmp/.bloome/research/ai-nand",topic:"AI 与 NAND 价格周期",status:"researching",progress:64,stage:3,
  judgment:"需求弹性来自推理侧本地存储，供给纪律决定价格传导能持续多久。",
  modules:[{id:"01",question:"需求传导",scope:"推理负载与本地闪存"},{id:"02",question:"供给纪律",scope:"资本开支与新增产能"},{id:"03",question:"盈利映射",scope:"价格到利润的传导"}],
  artifacts:[{name:"sell_side_logic.md",bytes:2100},{name:"validation.md",bytes:1800},{name:"evidence.json",bytes:5400}],
  evidence:[
    {claim:"推理负载扩大本地存储需求",stance:"support",chunk_id:"C1",quote:"推理系统将更多中间状态卸载到本地闪存。",title:"Technical brief",published_at:"2026-07-01",page_start:7},
    {claim:"价格弹性可能推迟一个季度",stance:"challenge",chunk_id:"C3",quote:"库存去化速度低于预期。",title:"Company filing",published_at:"2026-07-02",page_start:18},
  ],
  coverage:{sell_reports_read:15,primary_sources_read:9},reportHtml,
};

function fixtureHtml({ disableAutoPanel = false } = {}) {
  const bridge = `
    window.__BLOOME_TEST_DATA__=${JSON.stringify(fixture).replaceAll("<", "\\u003c")};
    window.__BLOOME_DISABLE_AUTO_PANEL__=${disableAutoPanel};
    window.__BLOOME_MODE_REQUESTS__=[];
    window.openai={
      displayMode:"inline",
      notifyIntrinsicHeight:()=>{},
      requestDisplayMode:async({mode})=>{
        window.__BLOOME_MODE_REQUESTS__.push(mode);
        window.openai.displayMode=mode;
        window.dispatchEvent(new CustomEvent("openai:set_globals",{detail:{globals:{displayMode:mode}}}));
        return {mode};
      },
    };
  `;
  return server.resourceText().replace("<body>", `<body><script>${bridge}<\/script>`);
}

(async () => {
  const browser = await chromium.launch({ headless:true });
  const context = await browser.newContext({ viewport:{width:900,height:300}, deviceScaleFactor:1 });
  await context.route(/https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/, (route) => route.abort());

  const launcherPage = await context.newPage();
  await launcherPage.setContent(fixtureHtml({disableAutoPanel:true}), { waitUntil:"networkidle" });
  assert.equal(await launcherPage.locator(".launcher").evaluate((node) => getComputedStyle(node).display), "grid");
  assert.equal(await launcherPage.locator(".app").evaluate((node) => getComputedStyle(node).display), "none");
  await launcherPage.getByRole("button", { name:"Open panel" }).click();
  await launcherPage.locator('html[data-display-mode="pip"]').waitFor();
  assert.equal(await launcherPage.locator(".app").evaluate((node) => getComputedStyle(node).display), "grid");
  await launcherPage.close();

  const page = await context.newPage();
  await page.setViewportSize({width:520,height:844});
  await page.setContent(fixtureHtml(), { waitUntil:"networkidle" });
  await page.locator('html[data-display-mode="pip"]').waitFor();
  await page.evaluate(() => document.fonts.ready);

  assert.deepEqual(await page.evaluate(() => window.__BLOOME_MODE_REQUESTS__), ["pip"]);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "panel horizontal overflow");
  assert.equal(await page.locator(".stages").evaluate((node) => getComputedStyle(node).display), "none");
  const mobileScreenshot = path.resolve(__dirname, "../assets/screenshot-mobile.png");
  await page.screenshot({ path:mobileScreenshot, fullPage:false });

  await page.getByRole("button", { name:"Report" }).click();
  await page.locator('html[data-display-mode="fullscreen"]').waitFor();
  assert.deepEqual(await page.evaluate(() => window.__BLOOME_MODE_REQUESTS__), ["pip", "fullscreen"]);
  await page.setViewportSize({width:1440,height:900});

  assert.equal(await page.locator(".topbar").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(255, 255, 255)");
  assert.equal(await page.locator(".topbar").evaluate((node) => getComputedStyle(node).backgroundImage), "none");
  assert.equal(await page.locator(".topbar").evaluate((node) => getComputedStyle(node).borderTopColor), "rgb(37, 86, 182)");
  assert.equal(await page.locator(".sidebar").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(255, 255, 255)");
  assert.equal(await page.locator(".ledger").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(255, 255, 255)");
  assert.ok(await page.locator(".brand img").evaluate((image) => image.naturalWidth > 0));

  await page.getByRole("tab", { name:/Support/ }).click();
  await page.locator("#ledgerList").getByRole("heading", { name:"推理负载扩大本地存储需求" }).waitFor();
  await page.getByRole("button", { name:"Research map" }).click();
  await page.getByText("sell_side_logic.md").waitFor();
  await page.getByRole("button", { name:"Report" }).click();
  assert.equal(await page.locator('[data-panel="report"]').evaluate((node) => getComputedStyle(node).display), "block");
  assert.equal(await page.locator("#reportFrame").getAttribute("sandbox"), "allow-scripts");
  const reportFrame = page.frameLocator("#reportFrame");
  await reportFrame.locator(".report").waitFor();
  await reportFrame.getByText("AI 推理需求与 NAND 价格周期").waitFor();
  assert.equal(await reportFrame.locator("[data-report-tab]").count(), 0);

  const screenshot = path.resolve(__dirname, "../assets/screenshot.png");
  await page.screenshot({ path:screenshot, fullPage:false });

  for (const viewport of [{width:1440,height:900},{width:1024,height:768},{width:720,height:900},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `horizontal overflow at ${viewport.width}px`);
    assert.equal(await reportFrame.locator("html").evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `report overflow at ${viewport.width}px`);
    const ledgerDisplay = await page.locator(".ledger").evaluate((node) => getComputedStyle(node).display);
    assert.equal(ledgerDisplay === "none", viewport.width <= 1180, `ledger breakpoint at ${viewport.width}px`);
  }

  await page.getByRole("button", { name:"Thesis" }).click();
  await page.getByRole("button", { name:"Evidence" }).click();
  await page.getByText("Evidence backbone").waitFor();
  await page.getByRole("button", { name:"Report" }).click();
  await page.frameLocator("#reportFrame").locator(".report").waitFor();
  await page.getByRole("button", { name:"Thesis" }).click();
  await page.getByRole("button", { name:"Panel" }).click();
  await page.locator('html[data-display-mode="pip"]').waitFor();
  await browser.close();
  process.stdout.write(`Native panel acceptance passed: ${screenshot}, ${mobileScreenshot}\n`);
})().catch((error) => { console.error(error); process.exitCode=1; });
