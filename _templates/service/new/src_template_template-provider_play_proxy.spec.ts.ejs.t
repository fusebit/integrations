---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/play/proxy.spec.ts
---
import { test } from '@playwright/test';

import { IAccount, getAccount, Utilities } from '@fusebit-int/play';

import { authenticate } from './actions';
let account: IAccount;

test.beforeAll(async () => {
  account = getAccount();
});

test('Proxy: <%= name.toLowerCase() %>', async ({ page }) => {
  // TODO: update the 'some message' param with the message Daisy will get on the
  // log console on our portal/editor when clicking the run button.
  await Utilities.runProxyTest(account, page, '<%= name.toLowerCase() %>', authenticate, 'some message');
}, 180000);