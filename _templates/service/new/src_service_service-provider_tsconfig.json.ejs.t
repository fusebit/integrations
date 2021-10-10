---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/tsconfig.json
---
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "module": "CommonJS", "outDir": "libc" },
  "include": ["src"]
}
