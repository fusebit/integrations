## Executing PlayWright Tests Locally

1. Import PlayWright on.fusebit.io (in 1password) fusebit profile. Encoded profile export is in fuse profile field.

`echo ${fuse profile} | base64 -d | fuse profile import playwright`

2. run ./scripts/playtest/local.mjs on.fusebit.io playwright
