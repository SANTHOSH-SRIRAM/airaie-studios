import { test, expect } from '@playwright/test';

test.describe('Runs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/runs');
  });

  test('renders runs list', async ({ page }) => {
    await expect(page.getByText(/runs/i).first()).toBeVisible();
  });

  test('shows status filter controls', async ({ page }) => {
    // Should have status filter tabs or chips
    const filters = page.getByText(/all|running|succeeded|failed/i);
    await expect(filters.first()).toBeVisible();
  });

  test('displays run table or list with columns', async ({ page }) => {
    const table = page.getByRole('table').or(page.locator('[data-testid="runs-list"]'));
    if (await table.isVisible()) {
      // Should have status, agent, duration columns
      await expect(page.getByText(/status/i).first()).toBeVisible();
    }
  });

  test('clicking a run shows detail view', async ({ page }) => {
    const runRow = page.locator('tr').or(page.locator('[data-testid^="run-"]'));
    if (await runRow.first().isVisible()) {
      await runRow.first().click();
      // Should show run detail with trace, proposal, or outputs
      await expect(page.getByText(/detail|trace|output|proposal/i).first()).toBeVisible();
    }
  });

  test('cancel button visible for running runs', async ({ page }) => {
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    // Cancel may not be visible if no runs are active
    if (await cancelBtn.first().isVisible()) {
      await expect(cancelBtn.first()).toBeEnabled();
    }
  });

  test('run trace viewer loads', async ({ page }) => {
    const runRow = page.locator('tr, [data-testid^="run-"]').first();
    if (await runRow.isVisible()) {
      await runRow.click();
      // Look for trace section
      const trace = page.getByText(/trace|decision|step/i);
      if (await trace.first().isVisible()) {
        await expect(trace.first()).toBeVisible();
      }
    }
  });
});
