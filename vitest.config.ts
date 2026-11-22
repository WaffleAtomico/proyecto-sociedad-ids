import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "text-summary", "lcov", "json-summary", "html"],
      include: [
        "src/app/api/**/*.ts",
        "src/controllers/**/*.ts",
        "src/services/**/*.ts",
        "src/repositories/**/*.ts",
        "src/middlewares/**/*.ts",
        "src/dtos/**/*.ts",
        "src/utils/jwt_generator.ts",
      ],
      exclude: ["src/**/*.d.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
});
