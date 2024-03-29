import { Page } from '@playwright/test';

const { OAUTH_USERNAME, OAUTH_PASSWORD } = process.env;

export async function authenticate(page: Page): Promise<Boolean | undefined> {
  await page.fill('input[name="email"]', OAUTH_USERNAME);
  await page.fill('input[name="password"]', OAUTH_PASSWORD);
  await page.click('button[name="submit-button"]');
  await Promise.race([
    page.waitForSelector('text=Human verification'),
    page.waitForSelector('text=Approve'),
    page.waitForEvent('close'),
    page.waitForURL(/.*oauthTest/),
  ]);

  // Check if the page is closed before doing anything else
  if (page.isClosed()) {
    return;
  }

  // Did the oauthTest page load?
  if (page.url().match(/.*oauthTest/)) {
    return;
  }

  // Is there an app approval button visible?
  if (await page.isVisible('text=Approve')) {
    page.click('text=Approve');
    return;
  }

  // Did it get blocked by a captcha?
  if (page.waitForSelector('text=Human verification')) {
    console.log('WARNING: Blocked by Captcha');
    return true;
  }
}
