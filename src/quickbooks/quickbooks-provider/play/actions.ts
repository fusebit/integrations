import { Page } from '@playwright/test';
import { generateTotpToken } from '@fusebit-int/play';

const { OAUTH_USERNAME, OAUTH_PASSWORD, MFA_SECRET } = process.env;

export async function authenticate(page: Page) {
  // Perform the login
  await page.fill('input[type="email"]', OAUTH_USERNAME);
  await page.fill('input[name="Password"]', OAUTH_PASSWORD);
  await page.click('button[name="SignIn"]');

  // Do 2FA
  const authenticatorToken = generateTotpToken(MFA_SECRET);
  await page.fill('[data-testid="VerifySoftTokenInput"]', authenticatorToken);
  await page.click('[data-testid="VerifySoftTokenSubmitButton"]');

  // Accept the permissions page
  await Promise.race([page.click('button:has-text("Connect")'), page.waitForNavigation({ url: /.*oauthTest/ })]);
  if (!page.url().match(/.*oauthTest/)) {
    await page.waitForNavigation({ url: /.*oauthTest/ });
  }
}
