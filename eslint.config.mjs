import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Disable overly strict rule that flags legitimate hydration patterns
      // (loading from localStorage on mount is a valid React pattern)
      "react-hooks/set-state-in-effect": "off",
      // Disable for recursive callback patterns in demo playback
      "react-hooks/immutability": "off",
      // Disable for third-party libraries like @tanstack/react-virtual
      "react-hooks/incompatible-library": "off",
    },
  },
]);

export default eslintConfig;
