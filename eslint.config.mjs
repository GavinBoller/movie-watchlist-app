// eslint.config.mjs
import eslint from '@eslint/js';
import nextPlugin from 'eslint-config-next';

export default [
  // Base ESLint recommended rules
  eslint.configs.recommended,

  // Next.js specific rules (this includes React, a11y, etc.)
  // The 'recommended' config from eslint-config-next is an array, so we spread it.
  // This replaces `extends: "next"` and `extends: "next/core-web-vitals"`
  ...nextPlugin.configs.recommended,

  // Your custom rules and overrides
  {
    rules: {
      // Rules from your old .eslintrc.json
      'no-undef': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed with modern Next.js, but kept for consistency with old config

      // You can add other custom rules here if needed
    },
  },
];
