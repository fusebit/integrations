---
to: "<%= `src/${name.toLowerCase()}/${name.toLowerCase()}-connector/package.json` %>"
---
{
  "name": "@fusebit-int/<%= name.toLowerCase() %>-connector",
  "version": "<%= h.currentVersion %>",
  "description": "<%= h.capitalize(name) %> Connector",
  "keywords": ["Fusebit", "<%= h.capitalize(name) %>"],
  "author": "Fusebit, Inc",
  "homepage": "https://fusebit.io",
  "license": "SEE LICENSE IN LICENSE",
  "main": "libc/index.js",
  "files": ["libc/**/*.js", "libc/**/*.d.ts", "libc/**/*.json"],
  "repository": {
    "type": "git",
    "url": "git@github.com:fusebit/integrations.git"
  },
  "engines": {
    "node": ">=14"
  },
  "scripts": {
    "test": "jest --config=./jest.config.ts",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand --config=./jest.config.ts",
    "tsc:version": "tsc --version",
    "build": "tsc -b --pretty",
    "dev": "tsc --watch --pretty",
    "lint:check": "eslint . --ext .ts --color --ignore-path ../../../.eslintignore",
    "lint:fix": "eslint . --ext .ts --color --fix --ignore-path ../../../.eslintignore"
  },
  "bugs": {
    "url": "https://github.com/fusebit/integrations/issues"
  },
  "dependencies": {
    <% if(connector.tokenUrl ){ -%>
    "@fusebit-int/oauth-connector": ">=<%= h.currentVersion %>",
    <% } -%>
    <% if(!connector.tokenUrl){ -%>
    "@fusebit-int/privatekey-connector": ">=<%= h.currentVersion %>",
    <% } -%>
    "superagent": "6.1.0"
  },
  "devDependencies": {
    <% if(includeWebhooks || generateTypes){ -%>
    "@fusebit-int/<%= name.toLowerCase() %>-types": ">=<%= h.currentVersion %>",
    <% } -%>
    "@fusebit-int/framework": ">=<%= h.currentVersion %>",
    "@types/superagent": "^4.1.12",
    "@typescript-eslint/eslint-plugin": "^4.31.0",
    "@typescript-eslint/parser": "^4.31.0",
    "eslint": "^7.32.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-import": "^2.24.2",
    "eslint-plugin-security": "^1.4.0",
    "jest": "^27.2.4",
    "ts-jest": "^27.0.5",
    "typescript": "~4.4.3"
  },
  "peerDependencies": {
    "@fusebit-int/framework": "*"
  }
}
