import { expect } from '@playwright/test';
export const { OAUTH_APP_USERNAME, OAUTH_APP_PASSWORD, APP_ID, PD_TENANT_ID } = process.env;

export async function revokeAuthorization(page): Promise<void> {
  // Go to https://dev-fusebit-test-app-pd.pagerduty.com/developer/apps/${APP_ID}
  await page.goto(`https://${PD_TENANT_ID}.pagerduty.com/developer/apps/${APP_ID}`);
  // Go to https://${PD_TENANT_ID}.pagerduty.com/sign_in?user_return_to=%2Fdeveloper%2Fapps%2F${APP_ID}
  await page.goto(`https://${PD_TENANT_ID}.pagerduty.com/sign_in?user_return_to=%2Fdeveloper%2Fapps%2F${APP_ID}`);
  // Click input[name="user[email]"]
  await page.click('input[name="user[email]"]');
  // Fill input[name="user[email]"]
  await page.fill('input[name="user[email]"]', OAUTH_APP_USERNAME);
  // Click text=Password
  await page.click('text=Password');
  // Fill input[name="user[password]"]
  await page.fill('input[name="user[password]"]', OAUTH_APP_PASSWORD);
  // Click input:has-text("Sign In")
  await page.click('input:has-text("Sign In")');
  await expect(page).toHaveURL(`https://${PD_TENANT_ID}.pagerduty.com/developer/apps/${APP_ID}`);
  // Click text=Manage
  await page.click('text=Manage');
  await expect(page).toHaveURL(`https://${PD_TENANT_ID}.pagerduty.com/developer/apps/${APP_ID}/editOAuth`);
  // Click text=Revoke all tokens
  await page.click('text=Revoke all tokens');
  // Click text=Yes, revoke all tokens
  await page.click('text=Yes, revoke all tokens');
}
