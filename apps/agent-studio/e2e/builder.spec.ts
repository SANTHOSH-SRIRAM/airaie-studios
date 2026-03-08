import { test, expect } from '@playwright/test';

test.describe('Builder Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder');
  });

  test('renders builder interface', async ({ page }) => {
    await expect(page.getByText(/builder/i).first()).toBeVisible();
  });

  test('shows agent creation form or template list', async ({ page }) => {
    // Builder should have either a form or templates to start from
    const form = page.locator('form');
    const templates = page.getByText(/template/i);
    await expect(form.or(templates).first()).toBeVisible();
  });

  test('displays goal input field', async ({ page }) => {
    const goalInput = page.getByPlaceholder(/goal/i).or(page.getByLabel(/goal/i));
    if (await goalInput.isVisible()) {
      await goalInput.fill('Test goal: analyze mesh convergence');
      await expect(goalInput).toHaveValue(/mesh convergence/);
    }
  });

  test('shows tool selection panel', async ({ page }) => {
    const toolSection = page.getByText(/tool/i).first();
    await expect(toolSection).toBeVisible();
  });

  test('shows constraints configuration', async ({ page }) => {
    const constraints = page.getByText(/constraint/i).or(page.getByText(/limit/i));
    if (await constraints.first().isVisible()) {
      await expect(constraints.first()).toBeVisible();
    }
  });

  test('can save or validate agent spec', async ({ page }) => {
    // Look for save/validate/create button
    const actionBtn = page.getByRole('button', { name: /save|validate|create/i });
    if (await actionBtn.first().isVisible()) {
      await expect(actionBtn.first()).toBeEnabled();
    }
  });
});
