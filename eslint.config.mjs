import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // Separate Remotion package: checked with its own `npm run lint`.
    "marketing-reel/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
