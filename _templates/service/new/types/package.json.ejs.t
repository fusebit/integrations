---
to: "<%= (includeWebhooks || generateTypes) ? `src/${name.toLowerCase()}/${name.toLowerCase()}-types/package.json` : null %>"
---
{
  "name": "@fusebit-int/<%= name.toLowerCase() %>-types",
  "version": "<%= h.currentVersion %>",
  "description": "<%= h.capitalize(name) %> provider",
  "keywords": ["Fusebit", "<%= h.capitalize(name) %>"],
  "author": "Fusebit, Inc",
  "homepage": "https://fusebit.io",
  "license": "SEE LICENSE IN LICENSE",
  "main": "libc/index.js",
  "files": ["libc/*.js", "libc/*.d.ts"],
  "repository": {
    "type": "git",
    "url": "git@github.com:fusebit/integrations.git"
  },
  "engines": {
    "node": ">=14"
  },
  "scripts": {
    "tsc:version": "tsc --version",
    "build": "tsc -b --pretty",
    "dev": "tsc --watch --pretty",
    "lint:check": "eslint . --ext .ts --color --ignore-path ../../../.eslintignore",
    "lint:fix": "eslint . --ext .ts --color --fix --ignore-path ../../../.eslintignore"
  },
  "bugs": {
    "url": "https://github.com/fusebit/integrations/issues"
  },
  "devDependencies": {
    "@types/node": "^16.9.2",
    "@types/request": "^2.48.7",
    "@typescript-eslint/eslint-plugin": "^4.31.0",
    "@typescript-eslint/parser": "^4.31.0",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-import": "^2.24.2",
    "eslint-plugin-security": "^1.4.0",
    "jest": "^27.2.4",
    "typescript": "~4.4.3"
  }
}
