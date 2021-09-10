module.exports = {
    "parser": '@typescript-eslint/parser',
    "env": {
      "browser": false,
      "commonjs": true,
      "es6": true,
      "node": true,
    },
    "plugins": ['@typescript-eslint'],
    "extends": [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier'
    ],
    "rules": {
        // enable additional rules
        "indent": "off",
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": "off",
        "@typescript-eslint/semi": ["error"],
  
        // override configuration set by extending "eslint:recommended"
        "no-empty": "warn",
        "no-cond-assign": ["error", "always"],
  
        // disable rules from base configurations
         "for-direction": "off",
         "max-lines": "off",
         "array-type": "off",
         "new-parens": "error",
         "no-caller": "error",
         "no-bitwise": "error",
         "no-cond-assign": "error",
         "no-multiple-empty-lines": "off",
         "sort-keys": "off",
         "no-console":"warn",
         "@typescript-eslint/no-explicit-any": "off",
         "@typescript-eslint/explicit-module-boundary-types": "off",
         "@typescript-eslint/no-unused-vars": "warn",
         "@typescript-eslint/ban-types": "off",
         "@typescript-eslint/prefer-namespace-keyword": "off",
         "@typescript-eslint/no-namespace": "off",
         "@typescript-eslint/no-empty-interface": "off",
         "no-async-promise-executor": "off",
         "no-constant-condition": "off",
         "@typescript-eslint/no-var-requires": "off",
         "@typescript-eslint/no-non-null-assertion": "off",
         "@typescript-eslint/no-empty-function": "warn",
         "no-useless-catch": "warn"
    }
  }