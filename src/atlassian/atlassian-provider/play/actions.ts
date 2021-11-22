import { Page } from '@playwright/test';

import { Constants } from '@fusebit-int/play';

export const doOAuthLogin = async (page: Page) => {
  await page.click('[placeholder="Enter email"]');
  await page.fill('[placeholder="Enter email"]', Constants.OAUTH_USERNAME);
  await page.click('button:has-text("Continue")');
  await page.click('[placeholder="Enter password"]');
  await page.fill('[placeholder="Enter password"]', Constants.OAUTH_PASSWORD);
  await page.click('button:has-text("Log in")');

  try {
    await page.waitForLoadState('networkidle');
  } catch (err) {
    // Throws an error if the page closes, but we don't care.
  }

  if (!page.isClosed()) {
    if (await page.$('text=Choose a site')) {
      await page.click('text=Choose a site');
      await page.click('#react-select-2-option-0');
    }

    if (await page.$('button:has-text("Accept")')) {
      // Accept the permissions page
      await page.click('button:has-text("Accept")');
    }
  }
};
