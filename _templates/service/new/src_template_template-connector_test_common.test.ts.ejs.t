---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-connector/test/common.test.ts
---
import connector from '../libc';
import { commonConnectorTests } from '../../../../test';

commonConnectorTests(connector);
