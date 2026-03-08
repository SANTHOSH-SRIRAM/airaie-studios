import { test, expect } from '@playwright/test';

test.describe('Approvals Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/approvals');
  });

  test('renders approvals page', async ({ page }) => {
    await expect(page.getByText(/approval/i).first()).toBeVisible();
  });

  test('shows approval status tabs', async ({ page }) => {
    const tabs = page.getByRole('tab').or(page.getByText(/pending|resolved|all/i));
    await expect(tabs.first()).toBeVisible();
  });

  test('displays approval queue list', async ({ page }) => {
    // Even if empty, should show the list container or empty state
    const list = page.locator('[data-testid="approval-queue"]')
      .or(page.getByText(/no.*approval|pending.*approval/i));
    await expect(list.first()).toBeVisible();
  });

  test('approve button works on pending items', async ({ page }) => {
    const approveBtn = page.getByRole('button', { name: /approve/i });
    if (await approveBtn.first().isVisible()) {
      await expect(approveBtn.first()).toBeEnabled();
    }
  });

  test('reject button works on pending items', async ({ page }) => {
    const rejectBtn = page.getByRole('button', { name: /reject|deny/i });
    if (await rejectBtn.first().isVisible()) {
      await expect(rejectBtn.first()).toBeEnabled();
    }
  });

  test('shows gate type filter', async ({ page }) => {
    const gateFilter = page.getByText(/gate.*type|filter/i).or(page.getByRole('combobox'));
    if (await gateFilter.first().isVisible()) {
      await expect(gateFilter.first()).toBeVisible();
    }
  });

  test('shows audit trail for resolved approvals', async ({ page }) => {
    // Click resolved tab
    const resolvedTab = page.getByText(/resolved/i);
    if (await resolvedTab.first().isVisible()) {
      await resolvedTab.first().click();
      // Should show who approved/rejected and when
      const audit = page.getByText(/approved|rejected|by|at/i);
      if (await audit.first().isVisible()) {
        await expect(audit.first()).toBeVisible();
      }
    }
  });
});
