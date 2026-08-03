# Cross-runtime architecture

Bloome Finance Plugin uses one research implementation and treats each AI host as a delivery adapter.

```text
plugin.config.json                 canonical identity and release metadata
        │
        ├── .codex-plugin/plugin.json       generated Codex adapter
        ├── .claude-plugin/plugin.json      generated Claude Code adapter
        ├── .workbuddy-plugin/plugin.json   generated WorkBuddy adapter
        ├── .agents/plugins/marketplace.json
        ├── .claude-plugin/marketplace.json
        └── .workbuddy-plugin/marketplace.json

skills/investment-research/       shared workflow and report contract
mcp/server.cjs                    shared MCP protocol and research tools
mcp/finance-client.cjs            local device auth, research run, and Finance gateway client
.mcp.json                         portable launcher for all hosts
assets/workbench.html             optional Codex MCP App presentation
```

## Boundaries

- `plugin.config.json` is the only editable source for identity, version, component paths, marketplace identity, and Codex presentation metadata. Run `npm run generate:manifests` after changing it. CI runs `npm run check:manifests` to reject drift.
- `skills/`, `scripts/core.mjs`, and the research/validation tools are host-neutral. Host names may appear only where behavior genuinely differs.
- `mcp/server.cjs` selects a small runtime profile. Codex receives MCP App resource metadata and inline report HTML. Claude Code and WorkBuddy receive the same research state plus `reportPath`, without injecting a large HTML document into model context.
- `mcp/finance-client.cjs` keeps MCP local while delegating identity, entitlements, run lifecycle, research-data access, and private report publishing to Bloome Finance. Successful validation uploads `report.html` through a presigned Storage URL and closes the run.
- `.mcp.json` uses `CODEBUDDY_PLUGIN_ROOT` for WorkBuddy, `CLAUDE_PLUGIN_ROOT` for Claude Code, and the plugin process working directory otherwise. This keeps one MCP server declaration and avoids duplicated tool configuration.
- The report template and evidence contracts remain byte-for-byte protected by tests.

## Adding another host

1. Add a manifest renderer to `scripts/generate-runtime-manifests.mjs` and a target marketplace only if the host needs one.
2. Add a runtime profile in `mcp/server.cjs` only for presentation or transport differences. Do not fork research, evidence, or validation logic.
3. Add identity, launch, tool-list, and workspace-output contract tests in `test/platforms.test.mjs` and `test/server.test.mjs`.
4. Document host installation and any real capability difference. Never promise the Codex MCP App panel on a host that cannot render it.

## Release flow

1. Change `version` and other shared metadata in `plugin.config.json`.
2. Run `npm run generate:manifests`.
3. Run `npm run verify` and `npm run test:ui`.
4. Run the native validators: Codex `validate_plugin.py`, `claude plugin validate`, and WorkBuddy `/plugin-validate`.
5. Publish the same repository revision to both marketplaces.
