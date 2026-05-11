import { estimate as runEstimate } from "./estimate.js";
import type {
  BriefFlags,
  ProjectType,
  ReadinessDecision,
  ReadinessReport,
} from "../types.js";

const VERSION = "0.1.0";

// ─── Fuzzy point detection ────────────────────────────────────────────────────

function detectFuzzyPoints(text: string, flags: BriefFlags): string[] {
  const t = text.toLowerCase();
  const points: string[] = [];

  if (/build everything|complete (app|platform)|full platform|all (features|functionality)|and everything|everything needed/.test(t))
    points.push("Scope too broad — no MVP boundary defined");

  // AI mentioned but no technical specifics (from text OR flag)
  const mentionsAI = flags.ai || /\b(ai agent|ai-powered|llm|copilot|automation agent)\b/.test(t);
  if (mentionsAI && !/\b(embedding|vector|rag|fine-?tun|model|openai|anthropic|claude|gpt|inference)\b/.test(t))
    points.push("AI features mentioned without technical specification");

  if (!/auth|login|sign-?in|sign-?up|oauth|sso|jwt|session|password/.test(t))
    points.push("Auth flow undefined");

  if (!/database|schema|table|model|entity|postgres|mysql|supabase|mongodb|redis|sqlite/.test(t))
    points.push("Data model not described");

  // Multiple surfaces — include real-time (with hyphen) as a surface
  const mentionsRealtime = flags.realtime || /real-?time|live (update|tracking|chat)|websocket/.test(t);
  const surfaceCount = [
    /mobile|ios|android|expo|react native/.test(t),
    /web|browser|desktop|next\.?js|nuxt|astro/.test(t),
    /admin|back.?office|backoffice/.test(t),
    mentionsRealtime,
  ].filter(Boolean).length;
  if (surfaceCount >= 3)
    points.push("Multiple surfaces (mobile, web, admin, real-time) with no phasing plan");

  if (!/deploy|hosting|vercel|fly\.io|aws|gcp|azure|vps|server|cloud|railway|render/.test(t))
    points.push("Deployment target not specified");

  if (!flags.stack && !/next\.?js|react|vue|angular|svelte|nuxt|astro|expo|node|django|rails|laravel|fastapi|express/.test(t))
    points.push("Tech stack not specified");

  // Payments from text OR flag
  const mentionsPayments = flags.payments || /payment|checkout|billing|subscription/.test(t);
  if (mentionsPayments && !/stripe|paystack|flutterwave|wave|orange money|mtn|moov|mobile money|settlement|webhook|refund|payout|checkout|provider/.test(t))
    points.push("Payment method and flow vague — no provider or settlement flow described");

  if (!/role|user|customer|merchant|admin|courier|client|seller|buyer|operator|manager/.test(t))
    points.push("User roles and permissions undefined");

  if (!/mvp|phase|milestone|v1\b|version 1|first version|launch|scope/.test(t))
    points.push("No MVP scope defined — risk of scope creep during build");

  return points;
}

// ─── Questions to clarify ─────────────────────────────────────────────────────

function generateQuestions(points: string[], flags: BriefFlags): string[] {
  const questions: string[] = [];

  if (points.some(p => p.includes("Scope")))
    questions.push("What is the minimum set of features required for launch?");

  if (points.some(p => p.includes("Auth")))
    questions.push("How will users authenticate? (email/password, OAuth, SMS OTP?)");

  if (flags.payments || points.some(p => p.includes("Payment")))
    questions.push("Which payment methods are required for MVP? (Stripe, Paystack, Mobile Money?)");

  if (points.some(p => p.includes("User roles")))
    questions.push("What are the exact user roles and their core permissions?");

  if (points.some(p => p.includes("Deployment")))
    questions.push("What is the deployment target? (Vercel, Fly.io, self-hosted?)");

  if (flags.mobile || points.some(p => p.includes("Multiple surfaces")))
    questions.push("Is mobile required at launch, or can it ship in a second phase?");

  if (points.some(p => p.includes("Data model")))
    questions.push("What are the core entities and their relationships? (e.g. Order, User, Product)");

  if (points.some(p => p.includes("Tech stack")))
    questions.push("What is the tech stack? (Frontend, backend, database, hosting?)");

  if (flags.realtime || points.some(p => p.includes("realtime")))
    questions.push("Is real-time required at MVP or is polling acceptable for phase 1?");

  if (points.some(p => p.includes("MVP")))
    questions.push("What is the hard launch date or milestone that defines the MVP scope?");

  return questions.slice(0, 7);
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function generateRecommendations(points: string[], flags: BriefFlags): string[] {
  const recs: string[] = [
    "Write a one-page brief with: roles, core flows, stack, and deployment target.",
    "Define user roles and permissions before asking Claude Code to build.",
  ];

  if (flags.payments || points.some(p => p.includes("Payment")))
    recs.push("Clarify payment provider, settlement flow, and error handling before build.");

  if (flags.mobile && (flags.payments || flags.ai || flags.realtime))
    recs.push("Consider shipping a web MVP first — mobile adds 30%+ token cost.");

  if (flags.realtime)
    recs.push("Build the real-time layer on top of a validated CRUD foundation, not from day one.");

  if (points.some(p => p.includes("Scope")))
    recs.push("Define a hard MVP scope. List what is NOT in v1 as explicitly as what is.");

  recs.push("Keep CLAUDE.md short, project-specific, and under 80 lines.");
  recs.push("Enable prompt caching — it can cut your token bill by up to 90% on repeated context.");

  return recs.slice(0, 7);
}

// ─── Suggested build strategy ─────────────────────────────────────────────────

function suggestedBuildStrategy(flags: BriefFlags, projectType: ProjectType): string[] {
  const strategy: string[] = [
    "Phase 1 — Data model and auth (no UI)",
    "Phase 2 — Core API and business logic",
    "Phase 3 — Web frontend (primary surface)",
  ];

  if (projectType === "marketplace") strategy.push("Phase 4 — Multi-role access and routing");
  if (flags.payments) strategy.push(`Phase ${strategy.length + 1} — Payments integration in isolation`);
  if (flags.realtime) strategy.push(`Phase ${strategy.length + 1} — Real-time layer on validated CRUD`);
  if (flags.mobile) strategy.push(`Phase ${strategy.length + 1} — Mobile app (shared business logic)`);
  strategy.push(`Phase ${strategy.length + 1} — Admin dashboard and reporting`);

  return strategy;
}

// ─── Decision ─────────────────────────────────────────────────────────────────

function computeDecision(
  score: number,
  fuzzyPoints: string[],
  flags: BriefFlags
): { decision: ReadinessDecision; buildDecision: string } {
  const hasCriticalRisk =
    (flags.payments && fuzzyPoints.some(p => p.includes("Payment"))) ||
    fuzzyPoints.some(p => p.includes("Scope too broad")) ||
    fuzzyPoints.some(p => p.includes("User roles"));

  let decision: ReadinessDecision;
  if (score >= 75 && !hasCriticalRisk) {
    decision = "Ready to build";
  } else if (score >= 55 || !hasCriticalRisk) {
    decision = "Needs clarification";
  } else {
    decision = "Not ready yet";
  }

  const buildDecision =
    decision === "Ready to build"
      ? "You can start with the MVP build. Follow the suggested phase order to stay within budget."
      : decision === "Needs clarification"
        ? fuzzyPoints.length > 0
          ? `Clarify ${fuzzyPoints.slice(0, 2).map(p => p.split("—")[0].trim().toLowerCase()).join(" and ")} before starting the full build.`
          : "Refine your brief before starting — the scope is unclear."
        : "Do not start the full build yet. Define scope, roles, and critical flows first.";

  return { decision, buildDecision };
}

// ─── Token waste risk ─────────────────────────────────────────────────────────

function tokenWasteRisk(score: number, fuzzyPointsCount: number): "Low" | "Medium" | "High" {
  if (score >= 70 && fuzzyPointsCount <= 2) return "Low";
  if (score >= 50 && fuzzyPointsCount <= 4) return "Medium";
  return "High";
}

// ─── Main engine ──────────────────────────────────────────────────────────────

export function readiness({ text, flags }: { text: string; flags: BriefFlags }): ReadinessReport {
  const estimateResult = runEstimate({ text, flags });
  const { costReadinessScore, confidence, projectType } = estimateResult;

  const fuzzyPoints = detectFuzzyPoints(text, flags);
  const { decision, buildDecision } = computeDecision(costReadinessScore.score, fuzzyPoints, flags);

  return {
    decision,
    buildDecision,
    costReadinessScore,
    confidence,
    tokenWasteRisk: tokenWasteRisk(costReadinessScore.score, fuzzyPoints.length),
    fuzzyPoints,
    questionsToClarity: generateQuestions(fuzzyPoints, flags),
    recommendations: generateRecommendations(fuzzyPoints, flags),
    suggestedBuildStrategy: suggestedBuildStrategy(flags, projectType),
    disclaimer: "This readiness check is heuristic. CostPassport does not review your code or team capabilities.",
    meta: {
      generated_at: new Date().toISOString(),
      costpassport_version: VERSION,
    },
  };
}
