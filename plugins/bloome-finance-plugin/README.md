# Bloome Finance Plugin

Cross-runtime, expert-led investment research for Codex, Claude Code, and Tencent WorkBuddy. Expert and firsthand evidence carries more decision weight than institutional research reports.

- Codex, Claude Code, or WorkBuddy is the reasoning runtime; no separate model key is required.
- The first corpus call opens Bloome Finance in the browser for Google or email sign-in and local-device authorization. No copied API token is required.
- Each new research workspace returns a quote before charging. Explicit user confirmation starts the run and uses one account credit, or no credit during active annual unlimited access; successful workspace validation closes that run.
- The shared MCP server provides the same research and validation tools in every host.
- Codex renders the native PiP/fullscreen workbench. Claude Code and WorkBuddy return progress, evidence, artifacts, and `reportPath` without injecting the complete HTML report into model context.
- Bloome styling applies to the optional workbench only.
- `skills/investment-research/assets/template.html` remains the final report's single-page visual source of truth. Evidence disposition, decision logic, and the evidence ledger remain separate Markdown/JSON workspace artifacts.
- `skills/investment-visualization/` owns editorial chart selection, annotation, uncertainty, responsive composition, and screenshot-based visual review; those judgments are not encoded as validator regex.

Runtime manifests are generated from `plugin.config.json`; do not edit `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, or either marketplace by hand.

## Verify

```bash
npm run verify
npm run test:ui
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .
claude plugin validate ../.. --strict
```

## Try in any host

```text
研究 AI 推理需求对 NAND 价格周期的影响，并生成完整研报。
打开当前项目的 Bloome Research 工作台。
验证当前研报是否满足全部输出要求。
```

Use `npm run generate:manifests` after release metadata changes. See the repository's `docs/architecture.md` for extension boundaries and the release flow.
