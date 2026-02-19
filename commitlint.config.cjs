const path = require("node:path");

const conventionalConfigPath = require.resolve("@commitlint/config-conventional", {
  paths: [path.join(__dirname, "apps/web")],
});

/** @type {import("@commitlint/types").UserConfig} */
module.exports = {
  extends: [conventionalConfigPath],
  helpUrl: "https://www.conventionalcommits.org/ko/v1.0.0/",
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci"],
    ],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 100],
    "scope-case": [2, "always", ["lower-case"]],
  },
};
