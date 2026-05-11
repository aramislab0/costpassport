import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

export interface ProjectSignals {
  hasClaudeMd: boolean;
  claudeMdLines: number;
  hasReadme: boolean;
  readmeLines: number;
  hasPackageJson: boolean;
  detectedStack: string | null;
  hasDocs: boolean;
  hasPrompts: boolean;
  hasLargeLogs: boolean;
  hasNodeModules: boolean;
  srcFileCount: number;
  hasGitignore: boolean;
  hasClaudeIgnore: boolean;
}

const EXCLUDED = new Set(["node_modules", "dist", "build", ".git", "coverage", ".next", ".turbo"]);

function countLines(filePath: string): number {
  try {
    return readFileSync(filePath, "utf8").split("\n").length;
  } catch {
    return 0;
  }
}

function dirExists(p: string): boolean {
  try {
    return existsSync(p) && statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function estimateSrcFiles(srcPath: string): number {
  if (!dirExists(srcPath)) return 0;
  try {
    return readdirSync(srcPath, { recursive: true })
      .filter(f => {
        const name = typeof f === "string" ? f : f.toString();
        return !EXCLUDED.has(name.split("/")[0]) && /\.(ts|js|tsx|jsx|py|go|rs)$/.test(name);
      }).length;
  } catch {
    return 0;
  }
}

function detectStack(packageJsonPath: string): string | null {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["next"]) return "Next.js";
    if (deps["expo"]) return "Expo / React Native";
    if (deps["nuxt"] || deps["nuxt3"]) return "Nuxt";
    if (deps["astro"]) return "Astro";
    if (deps["@sveltejs/kit"]) return "SvelteKit";
    if (deps["fastify"]) return "Fastify";
    if (deps["express"]) return "Express";
    return null;
  } catch {
    return null;
  }
}

function hasLargeLogDir(root: string): boolean {
  const logsPath = join(root, "logs");
  if (!dirExists(logsPath)) return false;
  try {
    const files = readdirSync(logsPath);
    return files.length > 5;
  } catch {
    return false;
  }
}

export function scanProject(projectPath: string): ProjectSignals {
  const claudeMdPath = join(projectPath, "CLAUDE.md");
  const readmePath = join(projectPath, "README.md");
  const pkgPath = join(projectPath, "package.json");

  const hasClaudeMd = existsSync(claudeMdPath);
  const hasReadme = existsSync(readmePath);
  const hasPackageJson = existsSync(pkgPath);

  return {
    hasClaudeMd,
    claudeMdLines: hasClaudeMd ? countLines(claudeMdPath) : 0,
    hasReadme,
    readmeLines: hasReadme ? countLines(readmePath) : 0,
    hasPackageJson,
    detectedStack: hasPackageJson ? detectStack(pkgPath) : null,
    hasDocs: dirExists(join(projectPath, "docs")),
    hasPrompts: dirExists(join(projectPath, "prompts")),
    hasLargeLogs: hasLargeLogDir(projectPath),
    hasNodeModules: dirExists(join(projectPath, "node_modules")),
    srcFileCount: estimateSrcFiles(join(projectPath, "src")),
    hasGitignore: existsSync(join(projectPath, ".gitignore")),
    hasClaudeIgnore: existsSync(join(projectPath, ".claudeignore")),
  };
}
