# Bloome Finance Plugin

面向 Codex、Claude Code 与腾讯 WorkBuddy 的专家优先金融投研插件。它把可追溯的投研工作流、受控研究数据接口和统一报告契约打包成同一份共享实现，并为三个宿主生成各自的插件清单和 marketplace。专家与一手资料的判断权重高于机构研究报告。

宿主使用用户现有账号完成规划、推理和写作，不需要额外的模型 API Key。Investment Research Skill 自带的研报结构、引用规则与 HTML 模板保持为最终输出标准。Codex 还会渲染 Bloome PiP / fullscreen 工作台；Claude Code 和 WorkBuddy 返回同一工作区的进度、证据和 `reportPath`，直接读取最终报告，不假装支持 Codex 专属面板。

## Codex 安装

```bash
codex plugin marketplace add ArcoCodes/bloome-finance-plugin
```

随后在 Codex Desktop 的 **Plugins** 页面选择 **Bloome Research** 并安装 **Bloome Investment Research**。Codex CLI 用户也可以通过 `/plugins` 安装。安装后需要新建一个任务，插件的 skill 和 MCP tools 才会载入。

## Claude Code 安装

同一仓库同时包含 Claude Code marketplace：

```bash
claude plugin marketplace add ArcoCodes/bloome-finance-plugin
claude plugin install bloome-finance-plugin@bloome-finance
```

本地开发时可以跳过安装，直接运行：

```bash
claude --plugin-dir ./plugins/bloome-finance-plugin
```

修改插件组件后，在 Claude Code 中执行 `/reload-plugins`。

## WorkBuddy 安装

在 WorkBuddy 对话中依次输入：

```text
/plugin marketplace add ArcoCodes/bloome-finance-plugin
/plugin install bloome-finance-plugin@bloome-finance
/reload-plugins
```

然后新建任务，直接描述投研需求，或用 `/investment-research-agent` 明确调用 Skill。

本地开发可直接添加仓库目录：

```text
/plugin marketplace add /absolute/path/to/bloome-finance-plugin --name bloome-finance
/plugin install bloome-finance-plugin@bloome-finance
```

WorkBuddy 会加载同一套 Skills、Agents 和本地 MCP；完成报告通过返回的 `reportPath` 打开。插件可在左侧 **专家·技能·连接器** 中管理。

## 账号与研究额度

模型推理继续使用 Codex、Claude 或 WorkBuddy 的现有账号，不需要额外模型 Key。首次调用研究工具时，本地 MCP 会打开 Bloome Finance：用户通过 Google 或邮箱登录并授权当前设备，完成后工具自动继续，不需要复制长期 token，也不会把 MCP 改成远程服务。

完成验证的新账号在 `hongrongyuan.bloome.im` 赠送 5 次研报额度，在 `finance.bloome.im` 赠送 1 次；已有账号余额不变。新 research workspace 的首次数据请求会先在对话中显示研究主题、费用和当前余额；用户明确确认后才开始检索。普通聊天、拒绝确认、创建或打开本地 workspace 都不扣费。同一 run 内后续搜索和精确读取不重复扣费，成功执行 `validate_research_workspace` 后关闭 run。额度不足时可前往 Bloome Finance 购买 20 篇、50 篇或包年无限篇套餐；包年有效期内单次费用为 0。

本地开发可用 `BLOOME_FINANCE_URL` 指向另一套 Finance 服务。生产切换时必须撤销旧共享 beta token，并让上游研究数据服务只接受 Finance 后端持有的内部密钥。外部域名及变更结论见 [`docs/external-domains.md`](docs/external-domains.md)。

## 使用

```text
研究 AI 推理需求对 NAND 价格周期的影响，并生成完整研报。
打开当前项目的 Bloome Research 工作台。
验证当前研报是否满足全部输出要求。
```

研究产物保存在当前项目的 `.bloome/research/` 下，不应提交到业务仓库。验证成功后，`report.html` 也会发布到用户私有的 Bloome Finance 账户，并返回 `/reports/<id>` 网页地址。

## 仓库结构

```text
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
.workbuddy-plugin/marketplace.json
plugins/bloome-finance-plugin/
├── .codex-plugin/plugin.json
├── .claude-plugin/plugin.json
├── .workbuddy-plugin/plugin.json
├── .mcp.json
├── plugin.config.json
├── skills/investment-research/
├── mcp/server.cjs
├── scripts/core.mjs
└── assets/
```

## 本地验证

```bash
cd plugins/bloome-finance-plugin
npm ci
npm run verify
npm run test:ui
claude plugin validate ../.. --strict
```

Codex 清单还应使用 `plugin-creator` 的 `validate_plugin.py` 检查。架构边界和新增宿主流程见 [`docs/architecture.md`](docs/architecture.md)。

## 分发边界

- 当前阶段：同一公开 GitHub 仓库同时作为 Codex、Claude Code 与 WorkBuddy marketplace。
- 正式阶段：托管公网 MCP 服务、接入 Bloome 账号体系，并提交 Codex Plugins Directory 审核。
- 插件只访问用户主动指定的研究工作区；报告文件保留在本地，并在验证成功后上传到用户私有的 Bloome Finance Storage。
