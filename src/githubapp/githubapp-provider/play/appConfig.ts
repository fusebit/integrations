import { expect } from '@playwright/test';

export const { OAUTH_USERNAME, OAUTH_PASSWORD } = process.env;

export async function revokeAuthorization(page): Promise<void> {
  // Go to https://github.com/
  await page.goto('https://github.com/');
  // Click canvas
  await page.click('canvas', {
    position: {
      x: 668,
      y: 164,
    },
  });
  // Click text=Sign in
  await page.click('text=Sign in');
  await expect(page).toHaveURL('https://github.com/login');
  // Click input[name="login"]
  await page.click('input[name="login"]');
  // Fill input[name="login"]
  await page.fill('input[name="login"]', OAUTH_USERNAME);
  // Click input[name="password"]
  await page.click('input[name="password"]');
  // Fill input[name="password"]
  await page.fill('input[name="password"]', OAUTH_PASSWORD);
  // Click input:has-text("Sign in")
  await page.click('input:has-text("Sign in")');
  await expect(page).toHaveURL('https://github.com/');
  // Click [aria-label="View profile and more"]
  await page.click('[aria-label="View profile and more"]');
  // Click a[role="menuitem"]:has-text("Settings")
  await page.click('a[role="menuitem"]:has-text("Settings")');
  await expect(page).toHaveURL('https://github.com/settings/profile');
  // Click text=Applications
  await Promise.all([
    page.waitForNavigation(/*{ url: 'https://github.com/settings/installations' }*/),
    page.click('text=Applications'),
  ]);
  // Click text=Authorized GitHub Apps
  await page.click('text=Authorized GitHub Apps');
  await expect(page).toHaveURL('https://github.com/settings/apps/authorizations');
  const applicationIsNotAuthorized = await page.isVisible('text=No authorized applications');
  if (!applicationIsNotAuthorized) {
    // Click text=Revoke Are you sure you want to revoke authorization? Fusebit Test-App will no l >> summary[role="button"]
    await page.click(
      'text=Revoke Are you sure you want to revoke authorization? Fusebit Test-App will no l >> summary[role="button"]'
    );
    // Click [aria-label="Are you sure you want to revoke authorization?"] >> text=I understand, revoke access
    await page.click(
      '[aria-label="Are you sure you want to revoke authorization?"] >> text=I understand, revoke access'
    );
  }

  // Click [aria-label="View profile and more"]
  await page.click('[aria-label="View profile and more"]');
  // Click button[role="menuitem"]:has-text("Sign out")
  await page.click('button[role="menuitem"]:has-text("Sign out")');
  await expect(page).toHaveURL('https://github.com/');
}
