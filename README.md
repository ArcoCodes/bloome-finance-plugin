# Bloome Finance Plugin

Bloome Finance 是面向 Codex、Claude Code、腾讯 WorkBuddy 和 DeepSeek Harness 的专业金融投研插件。它帮助用户把一个公司、行业、主题或资产配置问题，推进为有计划、有证据、有判断、可复核的完整研究报告。

插件使用宿主现有模型完成分析和写作，不需要额外的模型 API Key。

## 产品能力

- **专家优先研究**：分别检索机构研究、行业专家和官方资料，用一手证据校准市场共识。
- **结构化研究计划**：把复杂问题拆分为互不重叠的研究模块，明确每个模块要回答的问题、所需证据和反证条件。
- **并行深度分析**：并行完成行业、需求、供给、竞争、财务、估值、风险和情景分析，再由主任务统一核对。
- **可追溯判断**：重要结论、数字和引用均关联到具体来源、日期和原文位置。
- **完整投资报告**：输出核心判断、证据链、关键数据、情景边界、反方证据、风险、监控指标和结论失效条件。
- **受控图表与排版**：根据论证需要生成表格、图表和决策组件，形成可直接阅读的完整 HTML 报告。
- **交付前验证**：自动检查研究覆盖、引用、章节深度、视觉内容和最终报告完整性。
- **在线报告链接**：验证成功后生成可直接访问的报告链接，方便阅读和分享。

## 支持平台

| 平台 | 体验 |
|---|---|
| Codex | Bloome Research 工作台与完整报告预览 |
| Claude Code | 原生插件、研究进度和报告文件 |
| WorkBuddy | 原生 Skill、研究专家和报告交付 |
| DeepSeek Harness | 实时研究面板、模块进度和原生确认 |

## 安装

### Codex

```bash
codex plugin marketplace add ArcoCodes/bloome-finance-plugin
```

随后在 Codex Desktop 的 **Plugins** 页面安装 **Bloome Investment Research**。Codex CLI 用户也可通过 `/plugins` 安装。安装后请新建任务。

### Claude Code

```bash
claude plugin marketplace add ArcoCodes/bloome-finance-plugin
claude plugin install bloome-finance-plugin@bloome-finance
```

### WorkBuddy

在 WorkBuddy 对话中输入：

```text
/plugin marketplace add ArcoCodes/bloome-finance-plugin
/plugin install bloome-finance-plugin@bloome-finance
/reload-plugins
```

随后新建任务。也可以使用 `/investment-research-agent` 明确启动投研。

### DeepSeek Harness

```bash
dsh plugin --profile web add \
  "github:ArcoCodes/bloome-finance-plugin#path:/plugins/bloome-finance-plugin"
```

重新启动 Web profile 后即可使用。

## 使用方式

直接描述研究目标，不需要记忆工具名或固定指令：

```text
研究 AI 推理需求对 NAND 价格周期的影响，并生成完整研报。
比较铜、黄金和原油在未来十二个月的投资机会。
分析一家公司的需求、竞争格局、盈利弹性、估值和主要风险。
研究 2026 年下半年黄金价格是否仍有上涨空间。
```

插件会依次完成：

1. 明确研究问题与范围；
2. 检索机构、专家和官方资料；
3. 建立模块化研究计划；
4. 并行完成各模块分析；
5. 统一核对证据、冲突和缺口；
6. 形成判断、章节和图表；
7. 验证并交付完整报告。

## DeepSeek Harness 研究面板

研究开始后，右侧面板会展示：

- 当前研究阶段和总体进度；
- Evidence、Artifacts 和 Chapters 数量；
- 完整研究计划；
- 每个模块的 pending、running 和 completed 状态；
- 当前核心判断；
- 最终报告位置。

检索、并行研究、文件生成、报告渲染和验证过程中，面板会持续更新。关闭后可通过右侧 **B Research** 按钮重新打开；不同 Session 的面板彼此独立。

## 登录与研究额度

首次使用研究数据时，Bloome Finance 会引导用户登录和授权。研究任务会在开始前展示本次费用和当前余额，只有用户明确确认后才会开始；取消确认、普通聊天和打开已有研究均不会扣费。

同一次研究中的后续检索不会重复扣费。额度不足时，可根据页面提示前往 Bloome Finance 补充额度。

## 研究成果

研究内容保存在当前项目的：

```text
.bloome/research/<topic-slug>/
```

其中包括研究计划、模块分析、证据、核心判断、报告大纲、章节、图表、验证结果和最终报告。建议不要将 `.bloome/research/` 提交到业务代码仓库。

最终交付包括：

- `report.html`：完整可视化报告；
- `final_report.md`：最终报告正文；
- `evidence.json`：可追溯证据；
- `decision.md`：核心判断与决策依据；
- 在线报告链接。

## 本地开发

```bash
cd plugins/bloome-finance-plugin
npm ci
npm run build:report
npm run build:dsh
npm run verify
npm run test:ui
```

详细架构见 [`docs/architecture.md`](docs/architecture.md)。
