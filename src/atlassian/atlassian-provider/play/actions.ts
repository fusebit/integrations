import { Page } from '@playwright/test';

import { Constants } from '@fusebit-int/play';

export const doOAuthLogin = async (page: Page) => {
  await page.click('[placeholder="Enter email"]');
  await page.fill('[placeholder="Enter email"]', Constants.OAUTH_USERNAME);
  await page.click('button:has-text("Continue")');
  await page.click('[placeholder="Enter password"]');
  await page.fill('[placeholder="Enter password"]', Constants.OAUTH_PASSWORD);
  page.click('button:has-text("Log in")');
  await Promise.all([page.waitForNavigation(), page.click('button:has-text("Log in")')]);
};
