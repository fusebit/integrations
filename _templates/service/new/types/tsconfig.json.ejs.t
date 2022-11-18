---
to: "<%= (includeWebhooks || generateTypes) ? `src/${name.toLowerCase()}/${name.toLowerCase()}-types/tsconfig.json` : null %>"
---
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": { "rootDir": "src", "module": "CommonJS", "outDir": "libc" },
  "include": ["src"]
}
