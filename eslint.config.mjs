import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", ".next-dev/**", "next-env.d.ts"] },
  // React Compiler rules new in eslint-config-next 16; warnings until the flagged hooks are rewritten.
  { rules: { "react-hooks/refs": "warn", "react-hooks/set-state-in-effect": "warn" } },
];

export default eslintConfig;
