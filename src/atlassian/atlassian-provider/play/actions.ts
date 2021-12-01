import { Page } from '@playwright/test';

import { Constants } from '@fusebit-int/play';

export const doOAuthLogin = async (page: Page) => {
  await page.click('[placeholder="Enter email"]');
  await page.fill('[placeholder="Enter email"]', Constants.OAUTH_USERNAME);
  await page.click('button:has-text("Continue")');
  await page.click('[placeholder="Enter password"]');
  await page.fill('[placeholder="Enter password"]', Constants.OAUTH_PASSWORD);
  await page.click('button:has-text("Log in")');

  await Promise.race([
    page.waitForSelector('text=Choose a site'),
    page.waitForSelector('button:has-text("Accept")'),
    page.waitForEvent('close'),
  ]);

  if (page.isClosed()) {
    return;
  }

  if (await page.isVisible('text=Choose a site')) {
    await page.click('text=Choose a site');
    await page.click('#react-select-2-option-0');
  }

  if (await page.isVisible('button:has-text("Accept")')) {
    // Accept the permissions page
    await page.click('button:has-text("Accept")');
  } else {
    throw 'Accept Button Not Found';
  }
};
