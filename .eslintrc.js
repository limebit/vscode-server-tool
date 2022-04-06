module.exports = {
  extends: [
    "eslint-config-kentcdodds",
    "eslint-config-kentcdodds/jest",
    "eslint-config-kentcdodds/jsx-a11y",
    "eslint-config-kentcdodds/react",
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-base-to-string": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-throw-literal": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
  },
};
