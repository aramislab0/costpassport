import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // JSON import attributes (with { type: "json" }) are handled by esbuild >= 0.14
    // No special resolver needed — vitest/esbuild strips the `with` clause transparently.
  },
});
