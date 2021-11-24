import { Constants, generateTotpToken } from '@fusebit-int/play';
import { Page } from '@playwright/test';

export interface IAuthenticateOptions {
  targetUrl: string;
  page: Page;
}

const { MFA_SECRET, HUBSPOT_TEST_USER_ACCOUNT } = process.env;

export async function authenticate({ page, targetUrl }: IAuthenticateOptions) {
  await page.goto(targetUrl);
  await page.click('input[type="email"]');
  await page.click('input[type="email"]');
  await page.fill('input[type="email"]', Constants.OAUTH_USERNAME);
  await page.click('input[type="password"]');
  await page.fill('input[type="password"]', Constants.OAUTH_PASSWORD);
  await Promise.all([page.waitForNavigation(), page.click('[data-test-id="password-login-button"]')]);
  // Ensure you have MFA enabled in order to bypass code verification email
  const authenticatorToken = generateTotpToken(MFA_SECRET);
  await page.fill('input[type="text"]', authenticatorToken);
  await Promise.all([page.waitForNavigation(), page.click('button:has-text("Log in")')]);
  await page.click(`text=${HUBSPOT_TEST_USER_ACCOUNT} >> div`);
  await Promise.all([page.waitForNavigation(), page.click('button:has-text("Choose Account")')]);
}
