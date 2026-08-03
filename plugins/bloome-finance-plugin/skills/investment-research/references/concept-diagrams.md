# 概念图组件库(示意图)

被 SKILL.md「四、图表」引用。**先分流:要画的是"数据"还是"关系"?**

- **数据**(数值序列 / 占比 / 对比)→ 数据图，按 `chart-rules.md` 使用自包含 inline SVG/CSS。
- **关系**(非线性:机制 / 因果链 / 临界点 / 飞轮 / 层级 / 倍数 / 区间)→ **概念图**，用下面这套手写组件。

非线性的"关系形状",折线柱状画不出、纯文字数字又抓不住结构 —— 必须用概念图。

## 组件化用法(重要:不要每次重写)

1. **通用 CSS + 箭头 symbol,一份 widget 里只内联一次**(放最前)。
2. 之后每个图**只写 HTML 片段**,复用 class;箭头一律 `<use href="#arr"/>`,**不重复整段 SVG**。
3. 样式是"组件库"、内容才是"片段"——**别每份报告重写 CSS**。

## 选型:什么关系用什么组件

| 关系 | 组件 |
|---|---|
| 多条件**共同触发**一个结果 | `.cd-conv` |
| 逐步**收敛到阈值 / 临界点** | `.cnt` |
| 单组**倍数 / 比例**对比 | `.mg` |
| 线性**流程 / 传导链** | `.stepper` |
| **区间 / 上下限**(估值、目标价) | `.rng`(单区间)；多方法 / 多情景并列用 inline SVG range plot |

## 通用规则

- 外层统一 `.cd`,图题 `.cd-cap`,机制注释 `.cd-note`。
- **数字直接写进图形**,不放远处说明。
- `.cd-note` 只写"机制:……",**不写"下面这张图说明了……"旁白**。
- 箭头一律 `<use href="#arr"/>`,禁 `▶` / 文本三角。
- 视觉克制:白底、细边、蓝 `#003A5C` / 金 `#B59A57`,无渐变、无阴影。

---

## ① 一次性内联:通用 CSS

```css
.cd{margin:20px 0;border:1px solid #E0DCD4;border-radius:8px;padding:18px 20px;background:#fff}
.cd-cap{font-size:12px;font-weight:700;color:#003A5C;font-family:'Helvetica Neue',Arial,sans-serif;margin-bottom:16px}
.cd-note{font-size:12px;color:#5A5A5A;line-height:1.6;font-family:'Helvetica Neue',Arial,sans-serif;margin-top:14px;padding-top:12px;border-top:1px solid #E0DCD4}
.ico{display:inline-block;vertical-align:middle}
/* conv 触发机制 */
.cd-conv{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.cd-inputs{display:flex;flex-direction:column;gap:10px;flex:1;min-width:200px}
.cd-in{border:1px solid #E0DCD4;border-left:3px solid #B59A57;border-radius:6px;padding:10px 12px;font-size:12px;color:#1A1A1A;line-height:1.5;font-family:'Helvetica Neue',Arial,sans-serif}
.cd-in b{color:#003A5C}
.cd-merge{flex:0 0 auto;display:flex;align-items:center}
.cd-out{flex:1;min-width:180px;background:#003A5C;color:#fff;border-radius:6px;padding:14px 16px;font-size:13px;font-weight:700;font-family:'Helvetica Neue',Arial,sans-serif}
.cd-out span{display:block;font-weight:400;font-size:11.5px;color:#B59A57;margin-top:6px;line-height:1.5}
/* cnt 收敛倒计时器 */
.cnt{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;justify-content:center}
.cnt-stage{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px}
.cnt-stage.warm{background:#F7F5F0;border-radius:8px}
.cnt-plot{display:flex;align-items:flex-end;gap:6px;height:82px}
.cnt-b{width:22px;border-radius:3px 3px 0 0}
.cnt-b.qlc{background:#003A5C}.cnt-b.hdd{background:#B59A57}
.cnt-x{font-family:Georgia,serif;font-size:20px;font-weight:700;color:#003A5C}
.cnt-stage.warm .cnt-x{color:#B59A57}
.cnt-when{font-size:11px;color:#5A5A5A;text-align:center;line-height:1.4;font-family:'Helvetica Neue',Arial,sans-serif}
.cnt-arr{display:flex;align-items:center;padding-bottom:26px}
.cnt-legend{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin-top:14px;font-size:11px;color:#5A5A5A;font-family:'Helvetica Neue',Arial,sans-serif}
.cnt-legend .k{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:middle}
.cnt-legend .k.qlc{background:#003A5C}.cnt-legend .k.hdd{background:#B59A57}
/* mg 倍数/比例 */
.mg{display:flex;align-items:center;gap:20px;justify-content:center;flex-wrap:wrap}
.mg-item{display:flex;flex-direction:column;align-items:center;gap:8px}
.mg-box{display:flex;align-items:center;justify-content:center;background:#003A5C;color:#fff;border-radius:6px;font-size:12px;font-weight:700;font-family:'Helvetica Neue',Arial,sans-serif}
.mg-box.gold{background:#B59A57}
.mg-cap{font-size:11.5px;color:#5A5A5A;font-family:'Helvetica Neue',Arial,sans-serif}
.mg-x{font-family:Georgia,serif;font-size:26px;font-weight:700;color:#003A5C;text-align:center;line-height:1.1}
.mg-x span{display:block;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:400;color:#5A5A5A;margin-top:4px}
/* stepper 流程链 */
.stepper{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.stepper .st{flex:1;min-width:120px;border:1px solid #E0DCD4;border-radius:6px;padding:10px 12px;text-align:center;font-family:'Helvetica Neue',Arial,sans-serif}
.stepper .st b{display:block;color:#003A5C;font-size:12.5px;margin-bottom:3px}
.stepper .st .v{color:#5A5A5A;font-size:11px}
.stepper .st-arr{flex:0 0 auto;display:flex;align-items:center}
/* rng 区间条 */
.rng{display:flex;flex-direction:column;gap:16px;font-family:'Helvetica Neue',Arial,sans-serif}
.rng-row{display:flex;align-items:center;gap:12px}
.rng-name{width:110px;font-size:12px;color:#003A5C;font-weight:700;text-align:right}
.rng-track{position:relative;flex:1;height:30px}
.rng-bar{position:absolute;top:11px;height:8px;background:#B59A57;border-radius:4px}
.rng-mid{position:absolute;top:5px;width:2px;height:20px;background:#003A5C}
.rng-lab{position:absolute;top:-3px;font-size:10.5px;color:#5A5A5A;transform:translateX(-50%)}
```

## ② 一次性内联:箭头 symbol(之后用 `<use>` 复用)

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="arr" viewBox="0 0 26 16">
    <path d="M1 8h20.5" stroke="#B59A57" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <path d="M16 2.5 23 8l-7 5.5" stroke="#B59A57" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </symbol>
</svg>
```

用法(每处箭头都这一行):`<svg class="ico" aria-hidden="true" width="26" height="16"><use href="#arr"/></svg>`

---

## 组件片段 + 示例(只写这部分,不重复上面的 CSS)

### A. `.cd-conv` — 多条件触发机制

```html
<div class="cd">
  <div class="cd-cap">图 · QLC 替代 HDD 的触发机制:两个条件同时到位才越过拐点</div>
  <div class="cd-conv">
    <div class="cd-inputs">
      <div class="cd-in"><b>① HDD 停扩缺货</b><br>三大厂不扩产 · 交期 18–24 月 · 年产能仅 +20% vs 需求近翻倍</div>
      <div class="cd-in"><b>② 成本价差收敛</b><br>5–6 倍(2–3 年前)→ 3 倍(现)→ 2 倍(临界)</div>
    </div>
    <div class="cd-merge"><svg class="ico" aria-hidden="true" width="26" height="16"><use href="#arr"/></svg></div>
    <div class="cd-out">越过替代拐点<span>价差 ≤ 2 倍 → 温数据从 HDD 全面切向 QLC(预计 2028–30)</span></div>
  </div>
  <div class="cd-note">机制:单靠"便宜"不够,还得"HDD 买不到"。缺货把需求逼向 SSD,成本年降 15–20% 把价差压向临界值。</div>
</div>
```

### B. `.cnt` — 成本 / 价差"倒计时器"(收敛到阈值)

```html
<div class="cd">
  <div class="cd-cap">图 · 成本"倒计时器":SSD∶HDD 价差 5–6× → 3× → 2×</div>
  <div class="cnt">
    <div class="cnt-stage">
      <div class="cnt-plot"><div class="cnt-b qlc" style="height:76px"></div><div class="cnt-b hdd" style="height:14px"></div></div>
      <div class="cnt-x">×5–6</div><div class="cnt-when">2–3 年前</div>
    </div>
    <div class="cnt-arr"><svg class="ico" aria-hidden="true" width="26" height="16"><use href="#arr"/></svg></div>
    <div class="cnt-stage">
      <div class="cnt-plot"><div class="cnt-b qlc" style="height:66px"></div><div class="cnt-b hdd" style="height:22px"></div></div>
      <div class="cnt-x">×3</div><div class="cnt-when">现在</div>
    </div>
    <div class="cnt-arr"><svg class="ico" aria-hidden="true" width="26" height="16"><use href="#arr"/></svg></div>
    <div class="cnt-stage warm">
      <div class="cnt-plot"><div class="cnt-b qlc" style="height:44px"></div><div class="cnt-b hdd" style="height:22px"></div></div>
      <div class="cnt-x">×2</div><div class="cnt-when">临界 · 2028–30<br>触发全面替代</div>
    </div>
  </div>
  <div class="cnt-legend">
    <span><span class="k qlc"></span>QLC 0.06–0.07 元/GB · 年降 15–20%</span>
    <span><span class="k hdd"></span>HDD 0.015–0.02 元/GB · 基本持平</span>
  </div>
  <div class="cd-note">机制:HDD 成本几乎不动,QLC 每年降 15–20%,价差被逐年压缩,压到 2× 触发替代。</div>
</div>
```

### C. `.mg` — 倍数 / 比例(方块面积按比例设 inline)

```html
<div class="cd">
  <div class="cd-cap">图 · KV Cache 数据量:128K 上下文是 4K 的 32×</div>
  <div class="mg">
    <div class="mg-item"><div class="mg-box" style="width:22px;height:22px">4K</div><div class="mg-cap">0.27 GB</div></div>
    <div class="mg-x">×32<span>KV cache 数据量</span></div>
    <div class="mg-item"><div class="mg-box gold" style="width:80px;height:80px">128K</div><div class="mg-cap">8.6 GB</div></div>
  </div>
  <div class="cd-note">机制:上下文越长,KV cache 越大,越需从 HBM 卸载到 SSD——推理端 NAND 需求的底层来源。</div>
</div>
```

### D. `.stepper` — 流程 / 传导链

```html
<div class="cd">
  <div class="cd-cap">图 · 产业传导链:AI 推理 → NAND 需求 → 涨价 → 原厂盈利</div>
  <div class="stepper">
    <div class="st"><b>AI 推理</b><span class="v">Rubin 单卡 16TB SSD</span></div>
    <div class="st-arr"><svg class="ico" aria-hidden="true" width="26" height="16"><use href="#arr"/></svg></div>
    <div class="st"><b>NAND 需求</b><span class="v">+75–100EB(2027)</span></div>
    <div class="st-arr"><svg class="ico" aria-hidden="true" width="26" height="16"><use href="#arr"/></svg></div>
    <div class="st"><b>合约涨价</b><span class="v">Q2 +70–75% QoQ</span></div>
    <div class="st-arr"><svg class="ico" aria-hidden="true" width="26" height="16"><use href="#arr"/></svg></div>
    <div class="st"><b>原厂盈利</b><span class="v">SNDK FY27 EPS $439</span></div>
  </div>
  <div class="cd-note">机制:量的确定性(16TB 锚点)+ 供给刚性 → 价格弹性 → 传导到原厂 EPS。</div>
</div>
```

### E. `.rng` — 区间条(上下限 + 基准点;位置用 left/width %,同一坐标轴)

```html
<div class="cd">
  <div class="cd-cap">图 · SNDK 目标价区间($8–18,基准 $13;现价 $10)</div>
  <div class="rng">
    <div class="rng-row">
      <div class="rng-name">SNDK</div>
      <div class="rng-track">
        <div class="rng-bar" style="left:40%;width:50%"></div>
        <div class="rng-mid" style="left:65%"></div>
        <div class="rng-lab" style="left:40%">$8</div>
        <div class="rng-lab" style="left:65%">基准 $13</div>
        <div class="rng-lab" style="left:90%">$18</div>
      </div>
    </div>
  </div>
  <div class="cd-note">机制:区间跨度反映情景分歧,基准点是中性假设;现价 $10 低于基准 → 隐含上行空间。多标的时逐行叠加,共用一条 0–$20 坐标。</div>
</div>
```
