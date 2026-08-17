import React, { useEffect, useState, useSyncExternalStore } from "react";

const TOOL = "open_research_workspace";
const panels = new Map();
const panelListeners = new Set();
let panelRevision = 0;

function updatePanel(sessionId, panel, open) {
  if (panel === null) panels.delete(sessionId);
  else panels.set(sessionId, { ...panel, open: open ?? panels.get(sessionId)?.open ?? true });
  panelRevision += 1;
  for (const listener of panelListeners) listener();
}

function setPanelOpen(sessionId, open) {
  const panel = panels.get(sessionId);
  if (panel) updatePanel(sessionId, panel, open);
}

function subscribePanels(listener) {
  panelListeners.add(listener);
  return () => panelListeners.delete(listener);
}

function callIdFromResult(event) {
  return event.data.message?.source?.callId;
}

const researchDefinition = {
  kind: "bloome-research",
  target: "chat",
  match(event) {
    if (event.type === "tool/call" && event.data.name === TOOL) {
      return { id: String(event.data.callId), role: "start" };
    }
    if (event.type === "tool/result") {
      const callId = callIdFromResult(event);
      return callId ? { id: String(callId), role: "update" } : null;
    }
    return null;
  },
  start(_context, match) {
    let args = {};
    try { args = JSON.parse(match.event.data.arguments); } catch {}
    return { workspace: args.workspace, status: "loading" };
  },
  update(context, match) {
    if (match.event.type !== "tool/result") return context.state;
    const block = match.event.data.message?.content?.[0];
    return {
      ...context.state,
      status: block?.isError ? "failed" : "ready",
      result: match.event.data.meta,
    };
  },
  buildViewNode(context) {
    if (!context.start) return null;
    return {
      key: context.key,
      kind: "bloome-research",
      id: context.id,
      target: "chat",
      anchorSeq: context.start.event.seq,
      location: context.start.location,
      visibility: "visible",
      data: context.state,
    };
  },
};

const styles = {
  root: { border: "1px solid color-mix(in srgb, currentColor 16%, transparent)", borderRadius: 12, overflow: "hidden", background: "color-mix(in srgb, currentColor 3%, transparent)" },
  button: { width: "100%", border: 0, background: "transparent", color: "inherit", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer" },
  mark: { width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "#ef5b2a", color: "white", fontWeight: 800 },
  title: { fontWeight: 650, flex: 1 },
  muted: { opacity: 0.62, fontSize: 12 },
  body: { borderTop: "1px solid color-mix(in srgb, currentColor 12%, transparent)", padding: "14px 16px", display: "grid", gap: 12 },
  progress: { height: 5, borderRadius: 9, overflow: "hidden", background: "color-mix(in srgb, currentColor 12%, transparent)" },
  bar: { height: "100%", background: "#ef5b2a", borderRadius: 9 },
  stats: { display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13 },
  path: { fontFamily: "ui-monospace, monospace", fontSize: 12, opacity: 0.72, overflowWrap: "anywhere" },
  drawer: { position: "fixed", zIndex: 30, pointerEvents: "auto", top: 76, right: 20, bottom: 20, width: "min(368px, calc(100vw - 40px))", overflow: "auto", border: "1px solid color-mix(in srgb, currentColor 12%, transparent)", borderRadius: 12, background: "Canvas", color: "CanvasText", boxShadow: "0 12px 36px rgba(0,0,0,.14)" },
  drawerHeader: { position: "sticky", top: 0, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid color-mix(in srgb, currentColor 10%, transparent)", background: "Canvas", zIndex: 1 },
  drawerMark: { width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "#ef5b2a", color: "white", fontSize: 12, fontWeight: 800 },
  launcher: { position: "fixed", zIndex: 30, pointerEvents: "auto", right: 18, top: 116, display: "flex", alignItems: "center", gap: 8, border: "1px solid color-mix(in srgb, currentColor 14%, transparent)", borderRadius: 10, padding: "8px 10px", background: "Canvas", color: "CanvasText", boxShadow: "0 8px 24px rgba(0,0,0,.12)", cursor: "pointer" },
  close: { width: 28, height: 28, border: 0, borderRadius: 7, background: "transparent", color: "inherit", fontSize: 20, lineHeight: 1, cursor: "pointer" },
  panel: { padding: "16px", display: "grid", gap: 20 },
  panelSection: { display: "grid", gap: 8 },
  panelLabel: { fontSize: 12, fontWeight: 650, opacity: .58 },
  panelValue: { fontSize: 13, lineHeight: 1.55, overflowWrap: "anywhere" },
  hero: { display: "grid", gap: 10, padding: 14, borderRadius: 10, background: "color-mix(in srgb, #ef5b2a 7%, transparent)" },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  metric: { padding: "10px 8px", borderRadius: 9, textAlign: "center", background: "color-mix(in srgb, currentColor 5%, transparent)" },
  metricValue: { display: "block", fontSize: 17, fontWeight: 700 },
  judgment: { maxHeight: 116, overflow: "auto", paddingRight: 4 },
  openPanel: { justifySelf: "start", border: "1px solid color-mix(in srgb, currentColor 18%, transparent)", borderRadius: 8, padding: "7px 10px", background: "transparent", color: "inherit", cursor: "pointer" },
  moduleList: { display: "grid", borderTop: "1px solid color-mix(in srgb, currentColor 9%, transparent)" },
  module: { display: "grid", gridTemplateColumns: "20px 1fr", gap: 8, alignItems: "center", minHeight: 36, borderBottom: "1px solid color-mix(in srgb, currentColor 9%, transparent)", fontSize: 13 },
  moduleDot: { width: 16, height: 16, borderRadius: "50%", display: "grid", placeItems: "center", color: "white", fontSize: 10 },
};

function ResearchCard({ node, sessionId }) {
  const [open, setOpen] = useState(node.data.status !== "ready");
  const result = node.data.result && typeof node.data.result === "object" ? node.data.result : {};
  const progress = Number.isFinite(result.progress) ? result.progress : 0;
  const evidenceCount = Array.isArray(result.evidence) ? result.evidence.length : 0;
  const artifactCount = Array.isArray(result.artifacts) ? result.artifacts.length : 0;
  const status = node.data.status === "loading" ? "Loading" : node.data.status === "failed" ? "Failed" : result.status || "Ready";
  const panel = {
    title: result.topic || "Bloome Finance Research",
    data: { workspace: node.data.workspace, ...result, status, progress, evidenceCount, artifactCount },
  };
  useEffect(() => {
    if (node.data.status === "ready") updatePanel(sessionId, panel);
  }, [sessionId, node.data.status, node.data.result]);
  return (
    <section style={styles.root} data-bloome-research={status}>
      <button type="button" style={styles.button} onClick={() => setOpen(value => !value)} aria-expanded={open}>
        <span style={styles.mark}>B</span>
        <span style={styles.title}>{result.topic || "Bloome Finance Research"}</span>
        <span style={styles.muted}>{status} · {progress}% {open ? "▾" : "▸"}</span>
      </button>
      {open && <div style={styles.body}>
        <div style={styles.progress}><div style={{ ...styles.bar, width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
        <div style={styles.stats}>
          <span><strong>{evidenceCount}</strong> evidence items</span>
          <span><strong>{artifactCount}</strong> artifacts</span>
          <span><strong>{result.chapterCount || 0}</strong> chapters</span>
        </div>
        {result.judgment && <div>{result.judgment}</div>}
        <div style={styles.path}>{result.reportPath || result.workspace || node.data.workspace}</div>
        <button type="button" style={styles.openPanel} onClick={() => updatePanel(sessionId, panel, true)}>Open research panel</button>
      </div>}
    </section>
  );
}

function activityFrom(snapshot, modules) {
  if (!snapshot) return { label: null, modules };
  const running = snapshot.runningCalls || [];
  const settled = (snapshot.nodes || []).filter(node => node.kind === "tool-result" && node.call);
  const completedArgs = settled.filter(node => !node.isError && ["write", "edit"].includes(node.call.name)).map(node => node.call.argsRaw).join("\n");
  const activeArgs = running.map(call => call.argsRaw).join("\n");
  const liveModules = modules.map(module => ({
    ...module,
    status: completedArgs.includes(`modules/${module.id}.md`) ? "completed"
      : activeArgs.includes(module.id) ? "running" : module.status,
  }));
  const active = running.at(-1);
  if (active) {
    const label = active.name.startsWith("research_") ? "Searching research sources"
      : active.name === "subagent" ? "Running research modules"
      : active.name === "render_research_report" ? "Rendering report"
      : active.name === "validate_research_workspace" ? "Validating report"
      : ["write", "edit"].includes(active.name) ? "Writing research artifacts"
      : null;
    if (label) return { label, modules: liveModules };
  }
  const failed = settled.findLast(node => node.isError && (node.call.name.startsWith("research_") || ["subagent", "render_research_report", "validate_research_workspace"].includes(node.call.name)));
  return { label: failed ? `${failed.call.name} failed` : null, modules: liveModules };
}

const EMPTY_SESSION_SOURCE = { getSnapshot: () => null, subscribe: () => () => {} };

function ResearchDrawer({ useSessions, sessions }) {
  useSyncExternalStore(subscribePanels, () => panelRevision);
  const sessionId = useSessions(state => state.current);
  const source = (sessionId === undefined ? undefined : sessions.binding(sessionId)?.session) || EMPTY_SESSION_SOURCE;
  const snapshot = useSyncExternalStore(source.subscribe, source.getSnapshot);
  const panel = panels.get(sessionId);
  if (!panel) return null;
  if (panel.open === false) return <button type="button" style={styles.launcher} onClick={() => setPanelOpen(sessionId, true)}><span style={styles.drawerMark}>B</span><strong>Research</strong></button>;
  const { title, data: result } = panel;
  const baseModules = Array.isArray(result.modules) ? result.modules : [];
  const activity = activityFrom(snapshot, baseModules);
  const modules = activity.modules;
  const completed = modules.filter(module => module.status === "completed").length;
  const progress = Math.max(0, Math.min(100, result.progress || 0));
  return <aside style={styles.drawer} aria-label="Bloome research panel">
    <header style={styles.drawerHeader}>
      <span style={styles.drawerMark}>B</span>
      <strong style={styles.title}>Research workspace</strong>
      <button type="button" style={styles.close} aria-label="Close research panel" onClick={() => setPanelOpen(sessionId, false)}>×</button>
    </header>
    <div style={styles.panel}>
      <section style={styles.hero}>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{title}</div>
        <div style={styles.progress}><div style={{ ...styles.bar, width: `${progress}%` }} /></div>
        <div style={styles.muted}>{activity.label || result.status || "Ready"} · {progress}% complete</div>
      </section>
      <section style={styles.metricGrid}>
        <div style={styles.metric}><strong style={styles.metricValue}>{result.evidenceCount || 0}</strong><span style={styles.muted}>Evidence</span></div>
        <div style={styles.metric}><strong style={styles.metricValue}>{result.artifactCount || 0}</strong><span style={styles.muted}>Artifacts</span></div>
        <div style={styles.metric}><strong style={styles.metricValue}>{result.chapterCount || 0}</strong><span style={styles.muted}>Chapters</span></div>
      </section>
      {modules.length > 0 && <section style={styles.panelSection}>
        <div style={styles.panelLabel}>Plan progress · {completed}/{modules.length}</div>
        <div style={styles.moduleList}>{modules.map(module => <div key={module.id} style={styles.module} title={module.question}>
          <span style={{ ...styles.moduleDot, background: module.status === "completed" ? "#22a06b" : module.status === "running" ? "#ef5b2a" : "#b8b8b8" }}>{module.status === "completed" ? "✓" : module.status === "running" ? "•" : ""}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{module.id}</span>
        </div>)}</div>
      </section>}
      {result.judgment && <section style={styles.panelSection}><div style={styles.panelLabel}>Current judgment</div><div style={{ ...styles.panelValue, ...styles.judgment }}>{result.judgment}</div></section>}
      <section style={styles.panelSection}><div style={styles.panelLabel}>Report</div><div style={styles.path}>{result.reportPath || result.workspace || "Not available"}</div></section>
    </div>
  </aside>;
}

export const inject = ["conversationEvents", "sessions", "slots"];

export function apply(ctx) {
  ctx.conversationEvents.register(researchDefinition);
  ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
    name: "conversation.chat.node",
    key: "bloome-research",
  }, ResearchCard));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "bloome-research",
  }, props => <ResearchDrawer {...props} sessions={ctx.sessions} />));
}
