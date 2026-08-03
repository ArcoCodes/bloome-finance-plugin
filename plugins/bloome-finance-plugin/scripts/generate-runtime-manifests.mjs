import assert from "node:assert/strict";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(pluginRoot, "../..");
const config = JSON.parse(await readFile(path.join(pluginRoot, "plugin.config.json"), "utf8"));
const check = process.argv.includes("--check");

function validateConfig(value) {
  assert.equal(value.schemaVersion, 1, "unsupported plugin.config.json schemaVersion");
  assert.match(value.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "plugin name must be kebab-case");
  assert.match(value.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/, "version must be semver");
  assert.ok(value.displayName?.trim(), "displayName is required");
  assert.ok(value.description?.trim(), "description is required");
  assert.ok(value.author?.name?.trim(), "author.name is required");
  assert.ok(value.repository?.startsWith("https://"), "repository must be an HTTPS URL");
  assert.equal(value.components?.mcpServers, "./.mcp.json", "both hosts must share the root MCP declaration");
  assert.ok(Array.isArray(value.codex?.defaultPrompt) && value.codex.defaultPrompt.length <= 3, "Codex supports at most three default prompts");
  for (const prompt of value.codex.defaultPrompt) assert.ok(prompt.length <= 128, "each Codex default prompt must be at most 128 characters");
}

validateConfig(config);

const codexManifest = {
  name: config.name,
  version: config.version,
  description: config.description,
  author: config.author,
  repository: config.repository,
  keywords: config.keywords,
  skills: config.components.skills,
  interface: {
    displayName: config.displayName,
    shortDescription: config.codex.shortDescription,
    longDescription: config.codex.longDescription,
    developerName: config.author.name,
    category: config.marketplace.category,
    capabilities: config.codex.capabilities,
    defaultPrompt: config.codex.defaultPrompt,
    brandColor: config.codex.brandColor,
    composerIcon: config.codex.composerIcon,
    logo: config.codex.logo,
    logoDark: config.codex.logoDark,
    screenshots: config.codex.screenshots,
  },
  mcpServers: config.components.mcpServers,
};

const claudeManifest = {
  $schema: "https://json.schemastore.org/claude-code-plugin-manifest.json",
  name: config.name,
  displayName: config.displayName,
  version: config.version,
  description: config.description,
  author: config.author,
  repository: config.repository,
  keywords: config.keywords,
  skills: config.components.skills,
  mcpServers: config.components.mcpServers,
};

const codexMarketplace = {
  name: config.marketplace.name,
  interface: { displayName: config.marketplace.displayName },
  plugins: [{
    name: config.name,
    source: { source: "local", path: `./plugins/${config.name}` },
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    category: config.marketplace.category,
  }],
};

const claudeMarketplace = {
  $schema: "https://json.schemastore.org/claude-code-marketplace.json",
  name: config.marketplace.name,
  description: "Bloome plugins for evidence-first investment research.",
  owner: config.author,
  plugins: [{
    name: config.name,
    source: `./plugins/${config.name}`,
    description: config.description,
    version: config.version,
    author: config.author,
    repository: config.repository,
    keywords: config.keywords,
    category: config.marketplace.category,
  }],
};

const outputs = new Map([
  [path.join(pluginRoot, ".codex-plugin", "plugin.json"), codexManifest],
  [path.join(pluginRoot, ".claude-plugin", "plugin.json"), claudeManifest],
  [path.join(repositoryRoot, ".agents", "plugins", "marketplace.json"), codexMarketplace],
  [path.join(repositoryRoot, ".claude-plugin", "marketplace.json"), claudeMarketplace],
]);

for (const [target, value] of outputs) {
  const expected = `${JSON.stringify(value, null, 2)}\n`;
  if (check) {
    const actual = await readFile(target, "utf8");
    assert.equal(actual, expected, `${path.relative(repositoryRoot, target)} is stale; run npm run generate:manifests`);
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, expected);
  }
}

for (const asset of [config.codex.composerIcon, config.codex.logo, config.codex.logoDark, ...config.codex.screenshots]) {
  await access(path.resolve(pluginRoot, asset));
}

process.stdout.write(`${check ? "Verified" : "Generated"} ${outputs.size} runtime manifests from plugin.config.json\n`);
