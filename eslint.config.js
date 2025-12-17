const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    files: ["**/*"],
    ignores: [
      "dist/*",
      ".expo/*",
      ".expo/**",
      "**/.expo/**",
      "**/.expo/types/**",
      "**/.expo/types/router.d.ts",
      "**/*.d.ts",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  ...expoConfig,
  {
    files: ["**/*"],
    ignores: [
      "dist/*",
      ".expo/*",
      ".expo/**",
      "**/.expo/**",
      "**/.expo/types/**",
      "**/.expo/types/router.d.ts",
      "**/*.d.ts",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
]);
