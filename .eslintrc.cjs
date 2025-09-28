module.exports = {
  root: true,
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.base.json"],
    tsconfigRootDir: __dirname
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["dist", "node_modules"],
  env: {
    es2022: true,
    node: true
  },
  rules: {}
};
