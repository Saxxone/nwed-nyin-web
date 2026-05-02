import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import globals from "globals";

export default [
  {
    ignores: [
      ".nuxt/**",
      ".output/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
    ],
  },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-useless-assignment": "off",
      "no-useless-catch": "off",
      "vue/attribute-hyphenation": "off",
      "vue/attributes-order": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",
      "vue/require-default-prop": "off",
      "vue/require-v-for-key": "warn",
      "vue/valid-template-root": "warn",
      "vue/valid-v-for": "warn",
    },
  },
  {
    files: ["**/*.{js,ts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: typescriptParser,
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  prettier,
];
