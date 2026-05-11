import { estimate as runEstimate } from "./estimate.js";
import { computeScore } from "../lib/score.js";
import { scanProject } from "../lib/project-scan.js";
import type { ProjectSignals } from "../lib/project-scan.js";
import type {
  BriefFlags,
  ContextDiet,
  CostReadinessScore,
  OptimizationPlan,
  TokenBloatRisk,
  TokenDoctorReport,
} from "../types.js";

const VERSION = "0.1.0";

// ─── Token leaks ──────────────────────────────────────────────────────────────

function detectBriefLeaks(text: string, flags: BriefFlags): string[] {
  const leaks: string[] = [];
  const t = text.toLowerCase();

  if (text.length > 0 && text.length < 200)
    leaks.push("Brief too short — vague input generates excessive clarification loops");

  if (/build everything|complete (app|platform)|full platform|all (features|functionality)|and everything|everything needed/.test(t))
    leaks.push("Scope too broad — risk of unbounded token consumption across features");

  if (text.length > 0 && !/mvp|phase|milestone|v1\b|out of scope|not in v1/.test(t))
    leaks.push("No MVP boundary — agent may implement all features instead of the minimal set");

  if (text.length > 0 && !/role|user|customer|merchant|admin|courier|client|seller|buyer/.test(t))
    leaks.push("Vague user roles — agent will make wrong assumptions or ask repeatedly");

  // Detect from text OR flags — brief text mentioning payments/realtime/AI without specifics is a leak
  const mentionsPayments = flags.payments || /payment|checkout|billing|subscription/.test(t);
  if (mentionsPayments && !/stripe|paystack|flutterwave|settlement|webhook|refund|provider/.test(t))
    leaks.push("Payments mentioned without flow — payment rework is the most expensive iteration type");

  const mentionsRealtime = flags.realtime || /real-?time|live (update|tracking|chat)|websocket/.test(t);
  if (mentionsRealtime && !/socket\.io|polling|supabase realtime|pusher|server-?sent/.test(t))
    leaks.push("Real-time mentioned without architecture — implementation rework doubles token cost");

  const mentionsAI = flags.ai || /\b(ai agent|ai-powered|llm|copilot|automation agent)\b/.test(t);
  if (mentionsAI && !/\b(embedding|vector|rag|fine-?tun|inference|openai|anthropic|claude|gpt)\b/.test(t))
    leaks.push("AI features requested without technical specification");

  // surfaces: include realtime as its own surface (chat, live tracking)
  const surfaceCount = [
    /mobile|ios|android|expo|react native/.test(t),
    /web|browser|next\.?js|nuxt|astro/.test(t),
    /admin|back.?office|backoffice/.test(t),
    mentionsRealtime,
  ].filter(Boolean).length;
  if (surfaceCount >= 3)
    leaks.push("Multiple surfaces (mobile, web, admin, real-time) in one lot — must be split into separate build phases");

  if (!flags.stack && text.length > 0 && !/next\.?js|react|vue|node|django|rails|supabase|fastapi|express/.test(t))
    leaks.push("No tech stack specified — agent will pick arbitrarily or ask repeatedly");

  if (flags.ai || mentionsAI || /\bopus\b/.test(t))
    leaks.push("Risk of Opus overuse — Sonnet handles 90% of coding tasks at 5× lower cost");

  return leaks.slice(0, 8);
}

function detectProjectLeaks(signals: ProjectSignals): string[] {
  const leaks: string[] = [];

  if (!signals.hasClaudeMd)
    leaks.push("No CLAUDE.md found — agent lacks project context and will re-ask every session");
  else if (signals.claudeMdLines > 80)
    leaks.push(`CLAUDE.md too long (${signals.claudeMdLines} lines) — keep under 80 to reduce repeated context cost`);

  if (!signals.hasReadme)
    leaks.push("No README found — missing project summary increases onboarding token cost per session");
  else if (signals.readmeLines > 300)
    leaks.push(`README very long (${signals.readmeLines} lines) — summarize key sections to avoid over-sending context`);

  if (signals.hasLargeLogs)
    leaks.push("Large log directory detected — logs sent to AI agents inflate context cost significantly");

  if (!signals.hasDocs && signals.srcFileCount > 20)
    leaks.push("No docs/ directory — undocumented large codebases cost more to navigate with an AI agent");

  if (signals.hasPrompts)
    leaks.push("prompts/ directory found — verify prompts are not duplicating CLAUDE.md instructions");

  if (!signals.hasClaudeIgnore)
    leaks.push("No .claudeignore — AI agent may send dist, logs, and node_modules as context");

  return leaks;
}

// ─── Token Bloat Risk ─────────────────────────────────────────────────────────

function computeBloatRisk(leakCount: number, signals: ProjectSignals | null): TokenBloatRisk {
  let score = leakCount;
  if (signals !== null) {
    if (signals.claudeMdLines > 80) score++;
    if (signals.hasLargeLogs) score++;
    if (!signals.hasClaudeMd) score++;
  }
  if (score >= 7) return "Critical";
  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

// ─── Context Diet ─────────────────────────────────────────────────────────────

function buildContextDiet(text: string, flags: BriefFlags, signals: ProjectSignals | null): ContextDiet {
  const t = text.toLowerCase();
  const diet: ContextDiet = { remove: [], compress: [], split: [], clarify: [], defer: [], isolate: [] };

  // remove
  diet.remove.push("Remove boilerplate comments — they waste tokens without adding value");
  if (signals?.hasLargeLogs)
    diet.remove.push("Remove or archive log files before sending project context to an AI agent");
  if (signals !== null && !signals.hasClaudeIgnore)
    diet.remove.push("Create .claudeignore to exclude dist/, logs/, node_modules/, and generated files");

  // compress
  diet.compress.push("Keep your project brief to 200–400 words covering roles, flows, stack, and deployment");
  if (signals?.hasClaudeMd && signals.claudeMdLines > 80)
    diet.compress.push(`Compress CLAUDE.md to under 80 lines — currently ~${signals.claudeMdLines} lines`);
  else if (!signals?.hasClaudeMd && signals !== null)
    diet.compress.push("Create a CLAUDE.md of 40–60 lines with project context, stack, and coding conventions");

  // split
  if (flags.mobile && (flags.payments || flags.realtime || flags.ai))
    diet.split.push("Split mobile app into a separate implementation lot after the web MVP ships");
  if (flags.payments)
    diet.split.push("Isolate payments into a dedicated lot — test end-to-end before integrating");
  if (flags.realtime)
    diet.split.push("Build real-time layer last, on top of a validated CRUD foundation");
  if (/admin|back.?office/.test(t))
    diet.split.push("Build admin dashboard last — it depends on all other domains being stable");
  if (!flags.payments && !flags.realtime && !flags.mobile)
    diet.split.push("Split build into phases: data model → API → frontend → integrations → polish");

  // clarify
  if (!/auth|login|sign-?in|oauth/.test(t))
    diet.clarify.push("Define auth flow before build: email/password, OAuth, or OTP");
  if (!/database|schema|model|entity|postgres|supabase/.test(t))
    diet.clarify.push("Sketch the core data model (5–10 entities) before starting");
  if (text.length > 0 && !/mvp|phase|out of scope/.test(t))
    diet.clarify.push("Define MVP boundary: list explicitly what is NOT in v1");
  if (flags.payments)
    diet.clarify.push("Document payment provider, settlement flow, and error cases before build");

  // defer
  if (/i18n|multi.?language|localization/.test(t) || flags.i18n)
    diet.defer.push("Defer multi-language support to a later phase — adds 200K+ tokens");
  if (/rating|review|loyalty|gamif/.test(t))
    diet.defer.push("Defer ratings, reviews, and loyalty programs to phase 2");
  if (/chat|messaging|inbox/.test(t))
    diet.defer.push("Defer in-app chat — real-time messaging is a complex sub-system");

  // isolate
  if (flags.ai)
    diet.isolate.push("Isolate AI/LLM features — prototype the prompt and API integration separately");
  if (flags.payments)
    diet.isolate.push("Isolate payment webhooks and reconciliation from the main application flow");
  if (flags.realtime)
    diet.isolate.push("Isolate real-time subscriptions from core business logic");

  return diet;
}

// ─── Optimization Plan ────────────────────────────────────────────────────────

function buildOptimizationPlan(flags: BriefFlags, signals: ProjectSignals | null, risk: TokenBloatRisk): OptimizationPlan {
  const immediate: string[] = [];
  const structural: string[] = [];
  const advanced: string[] = [];

  // Immediate (< 15 min)
  immediate.push("Define MVP scope in one sentence before any AI session");
  if (!signals?.hasClaudeMd && signals !== null)
    immediate.push("Create CLAUDE.md (40–60 lines) with project context, stack, and key rules");
  if (signals?.claudeMdLines && signals.claudeMdLines > 80)
    immediate.push("Trim CLAUDE.md to under 80 lines — move repeated instructions into project notes");
  if (flags.payments)
    immediate.push("Document payment provider and flow in a single short reference doc");
  immediate.push("Add deployment target to your brief or CLAUDE.md");

  // Structural
  structural.push("Split the build into phases with clear, testable boundaries");
  structural.push("Create PROJECT_STATE.md before each new AI session to restore context cheaply");
  if (flags.mobile)
    structural.push("Separate mobile app planning from web — different complexity, different token budget");
  structural.push("Use --brief to pass scoped context instead of piping full README to the agent");
  if (risk === "High" || risk === "Critical")
    structural.push("Run `costpassport before-you-build` before starting to identify the riskiest areas");

  // Advanced
  advanced.push("Enable prompt caching for stable system context — saves up to 90% on repeated inputs");
  advanced.push("Default to Sonnet 4.6; reserve Opus only for architecture decisions (max 3 per project)");
  advanced.push("Use Claude Code skills to scope sessions: one skill per domain, not one session for all");
  if (flags.ai)
    advanced.push("Run AI feature development in isolation with a dedicated context window");
  advanced.push("Configure .claudeignore to exclude dist, logs, node_modules, and generated files");

  return { immediateFixes: immediate.slice(0, 4), structuralFixes: structural.slice(0, 4), advancedFixes: advanced.slice(0, 4) };
}

// ─── Savings + action ────────────────────────────────────────────────────────

function estimateSavings(risk: TokenBloatRisk): { minPercent: number; maxPercent: number } {
  switch (risk) {
    case "Low":      return { minPercent: 10, maxPercent: 20 };
    case "Medium":   return { minPercent: 25, maxPercent: 40 };
    case "High":     return { minPercent: 40, maxPercent: 55 };
    case "Critical": return { minPercent: 50, maxPercent: 70 };
  }
}

function recommendedAction(risk: TokenBloatRisk): string {
  switch (risk) {
    case "Low":      return "Safe to continue. Enable prompt caching to further reduce costs.";
    case "Medium":   return "Compress project context before using Claude Code.";
    case "High":     return "Split the build into smaller lots and clarify scope before starting.";
    case "Critical": return "Clarify MVP scope before starting. Do not launch a full build yet.";
  }
}

// ─── Assumptions ────────────────────────────────────────────────────────────

function buildAssumptions(text: string, signals: ProjectSignals | null, flags: BriefFlags): string[] {
  const a: string[] = [];
  if (text.length === 0) a.push("No brief provided — analysis based on project structure only");
  if (!flags.stack) a.push("Tech stack inferred from brief or project scan");
  if (signals !== null) a.push(`Project scanned at path level only — source files not read`);
  a.push("Sonnet 4.6 as default model");
  a.push("Solo developer or small team using an AI coding agent");
  return a;
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export function tokenDoctor({
  text,
  flags,
  projectPath,
}: {
  text: string;
  flags: BriefFlags;
  projectPath?: string;
}): TokenDoctorReport {
  const signals = projectPath ? scanProject(projectPath) : null;

  // CostReadinessScore: derive from estimate if we have text, else use default
  let costReadinessScore: CostReadinessScore;
  if (text.length > 0) {
    const estimateResult = runEstimate({ text, flags });
    costReadinessScore = estimateResult.costReadinessScore;
  } else {
    // path-only mode: low confidence, no brief
    costReadinessScore = computeScore("low", "Standard", 4, flags);
  }

  const briefLeaks = detectBriefLeaks(text, flags);
  const projectLeaks = signals ? detectProjectLeaks(signals) : [];
  const mainTokenLeaks = [...briefLeaks, ...projectLeaks].slice(0, 8);

  const tokenBloatRisk = computeBloatRisk(mainTokenLeaks.length, signals);

  return {
    tokenBloatRisk,
    costReadinessScore,
    mainTokenLeaks,
    contextDiet: buildContextDiet(text, flags, signals),
    optimizationPlan: buildOptimizationPlan(flags, signals, tokenBloatRisk),
    estimatedSavingsPotential: estimateSavings(tokenBloatRisk),
    recommendedNextAction: recommendedAction(tokenBloatRisk),
    assumptions: buildAssumptions(text, signals, flags),
    disclaimer: "This diagnosis is heuristic. CostPassport does not read your source code. CostPassport runs locally — no project data leaves your machine.",
    meta: { generated_at: new Date().toISOString(), costpassport_version: VERSION },
  };
}
