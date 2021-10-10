---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/tsconfig.json
---
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "module": "CommonJS", "outDir": "libc" },
  "include": ["src", "src/**/*.json"]
}
