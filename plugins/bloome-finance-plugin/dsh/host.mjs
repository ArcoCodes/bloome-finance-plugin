import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { approvedAnswer, parameterProperties } from "./schema.mjs";

const require = createRequire(import.meta.url);
const { callTool, toolDefinitions } = require("../mcp/server.cjs");
const skillPath = fileURLToPath(new URL("../skills/investment-research/SKILL.md", import.meta.url));
const skillContent = `${readFileSync(skillPath, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "")}

## DeepSeek Harness research panel

Call \`open_research_workspace\` immediately after creating the workspace, then after saving the plan, completing evidence modules, freezing evidence, completing chapters, rendering, and validation. These local snapshots initialize the native panel; its live Tool-event fold updates activity between snapshots.
`;

export const name = "bloome-finance";
export const inject = ["skills", "tools", "userQuestions"];

function titleFor(definition, args) {
  const workspace = typeof args.workspace === "string" ? args.workspace : undefined;
  return {
    card: "generic",
    title: definition.title,
    kind: definition.name.includes("search") ? "search" : definition.name.includes("get_") ? "read" : "execute",
    ...(workspace ? { rawInput: workspace, locations: [{ path: workspace }] } : {}),
  };
}

function resultSummary(definition, result) {
  if (result.isError || !result.meta || typeof result.meta !== "object" || Array.isArray(result.meta)) {
    return result.content;
  }
  const value = result.meta;
  const count = [value.results, value.items, value.chunks, value.evidence].find(Array.isArray)?.length;
  const details = [
    typeof value.topic === "string" ? value.topic : undefined,
    Number.isFinite(value.progress) ? `${value.progress}% complete` : undefined,
    count !== undefined ? `${count} items` : undefined,
    typeof value.reportPath === "string" ? value.reportPath : undefined,
    typeof value.reportUrl === "string" ? value.reportUrl : undefined,
    value.cancelled === true ? "Cancelled without starting the research run" : undefined,
    value.confirmed === true ? "Research run approved" : undefined,
  ].filter(Boolean);
  return details.length > 0
    ? [{ type: "text", text: details.join("\n") }]
    : result.content;
}

async function executeTool(ctx, definition, args, exec) {
  if (definition.name === "confirm_research_run") {
    const answer = await ctx.userQuestions.ask({
      questions: [{
        id: "bloome-finance-charge",
        header: "Bloome Finance",
        question: "Approve this quoted research run?",
        detail: `Workspace: ${args.workspace}\n\nThe quote shown by the preceding Bloome research call is bound to confirmation ${args.confirmationId}. Approval may consume the displayed credit amount.`,
        options: [
          { label: "Approve", description: "Start the quoted research run." },
          { label: "Cancel", description: "Do not start or charge this run." },
        ],
      }],
      ...(exec.agent ? { agent: exec.agent } : {}),
      signal: exec.signal,
    });
    if (!approvedAnswer(answer, "bloome-finance-charge")) {
      return { confirmed: false, cancelled: true };
    }
  }
  const result = await callTool(definition.name, args, "claude-code", { signal: exec.signal });
  if (definition.name !== "open_research_workspace" || !Array.isArray(result.modules)) return result;
  return {
    ...result,
    modules: result.modules.map(module => ({
      ...module,
      status: existsSync(join(args.workspace, "modules", `${module.id}.md`)) ? "completed" : "pending",
    })),
  };
}

export function apply(ctx) {
  ctx.effect(() => ctx.skills.register({
    name: "investment-research-agent",
    description: "Run staged, evidence-backed investment research with Bloome Finance tools and open the native research workspace before retrieval.",
    content: skillContent,
    source: "runtime",
    path: skillPath,
    resourceBase: { kind: "directory", path: dirname(skillPath) },
  }), "bloome-finance: investment research skill");

  for (const definition of toolDefinitions("claude-code")) {
    ctx.tools.register(defineTool({
      name: definition.name,
      description: definition.description,
      parameters: parameterProperties(definition.inputSchema),
      output: {
        schema: { type: "json" },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }],
        presentationMeta: (_args, value) => value,
      },
      execute: (args, exec) => executeTool(ctx, definition, args, exec),
      presentCall: args => titleFor(definition, args),
      presentResult: (_args, result) => ({
        card: "generic",
        title: result.isError ? `${definition.title} failed` : `${definition.title} complete`,
        content: resultSummary(definition, result),
      }),
    }));
  }
}
