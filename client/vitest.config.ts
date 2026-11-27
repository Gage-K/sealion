import { defineConfig } from "vitest/config";

// Sync/CRDT tests are pure logic — no DOM — so the node environment is enough.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
