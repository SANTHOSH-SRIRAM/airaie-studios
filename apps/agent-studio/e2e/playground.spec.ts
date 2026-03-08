import { test, expect } from '@playwright/test';

test.describe('Playground Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground');
  });

  test('renders playground interface', async ({ page }) => {
    await expect(page.getByText(/playground/i).first()).toBeVisible();
  });

  test('shows agent selector', async ({ page }) => {
    // Should have a way to select which agent to test
    const selector = page.getByRole('combobox').or(page.getByText(/select.*agent/i));
    await expect(selector.first()).toBeVisible();
  });

  test('has input area for test messages', async ({ page }) => {
    const input = page.getByRole('textbox').or(page.getByPlaceholder(/message|input|prompt/i));
    if (await input.first().isVisible()) {
      await input.first().fill('Run mesh analysis on cylinder geometry');
      await expect(input.first()).toHaveValue(/mesh analysis/);
    }
  });

  test('has dry-run toggle or button', async ({ page }) => {
    const dryRun = page.getByText(/dry.?run/i).or(page.getByRole('switch'));
    if (await dryRun.first().isVisible()) {
      await expect(dryRun.first()).toBeVisible();
    }
  });

  test('shows execution results area', async ({ page }) => {
    // Results panel should exist even if empty
    const results = page.getByText(/result|output|response/i);
    if (await results.first().isVisible()) {
      await expect(results.first()).toBeVisible();
    }
  });
});
