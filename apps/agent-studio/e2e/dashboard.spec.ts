import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders dashboard with agent cards', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Dashboard should show agent summary cards or list
    await expect(page.locator('[data-testid="dashboard"]').or(page.getByText(/dashboard/i).first())).toBeVisible();
  });

  test('sidebar navigation is visible', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible();
    // Check key nav items exist
    await expect(page.getByText(/builder/i).first()).toBeVisible();
    await expect(page.getByText(/runs/i).first()).toBeVisible();
    await expect(page.getByText(/approvals/i).first()).toBeVisible();
  });

  test('navigates to builder from sidebar', async ({ page }) => {
    await page.getByText(/builder/i).first().click();
    await expect(page).toHaveURL(/\/builder/);
  });

  test('navigates to runs from sidebar', async ({ page }) => {
    await page.getByText(/runs/i).first().click();
    await expect(page).toHaveURL(/\/runs/);
  });

  test('navigates to analytics from sidebar', async ({ page }) => {
    await page.getByText(/analytics/i).first().click();
    await expect(page).toHaveURL(/\/analytics/);
  });
});
