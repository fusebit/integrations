---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/package.json
---
{
  "name": "@fusebit-int/<%= name.toLowerCase() %>-connector",
  "version": "6.0.0",
  "description": "Fusebit <%= h.capitalize(name) %> connector",
  "keywords": ["Fusebit", "<%= h.capitalize(name) %>"],
  "author": "Fusebit, Inc",
  "homepage": "https://fusebit.io",
  "license": "SEE LICENSE IN LICENSE",
  "main": "libc/index.js",
  "files": ["libc/**/*.js", "libc/**/*.d.ts", "libc/**/*.json"],
  "repository": {
    "type": "git",
    "url": "git@github.com:fusebit/packages.git"
  },
  "engines": {
    "node": ">=14"
  },
  "scripts": {
    "test": "jest --config=../../../jest.config.ts",
    "tsc:version": "tsc --version",
    "build": "tsc -b --pretty",
    "dev": "tsc --watch --pretty",
    "lint:check": "eslint . --ext .ts --color --ignore-path ../../../.eslintignore",
    "lint:fix": "eslint . --ext .ts --color --fix --ignore-path ../../../.eslintignore"
  },
  "bugs": {
    "url": "https://github.com/fusebit/packages/issues"
  },
  "dependencies": {
    "@fusebit-int/oauth-connector": "^6.0.0",
    "superagent": "6.1.0"
  },
  "devDependencies": {
    "@fusebit-int/framework": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^4.31.0",
    "@typescript-eslint/parser": "^4.31.0",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-import": "^2.24.2",
    "eslint-plugin-security": "^1.4.0",
    "jest": "^27.2.4",
    "typescript": "^3.8.0"
  },
  "peerDependencies": {
    "@fusebit-int/framework": "*"
  }
}
