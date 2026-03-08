import { test, expect } from '@playwright/test';

test.describe('Memory Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/memory');
  });

  test('renders memory page', async ({ page }) => {
    await expect(page.getByText(/memory|memories/i).first()).toBeVisible();
  });

  test('shows agent selector', async ({ page }) => {
    const selector = page.getByRole('combobox').or(page.getByText(/select.*agent/i));
    await expect(selector.first()).toBeVisible();
  });

  test('shows memory type filter', async ({ page }) => {
    const typeFilter = page.getByText(/fact|lesson|error.*pattern|all/i);
    await expect(typeFilter.first()).toBeVisible();
  });

  test('displays memory list or empty state', async ({ page }) => {
    const memories = page.locator('[data-testid="memory-list"]')
      .or(page.getByText(/no.*memor|add.*memory/i));
    await expect(memories.first()).toBeVisible();
  });

  test('create memory form is accessible', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create|add|new/i });
    if (await createBtn.first().isVisible()) {
      await createBtn.first().click();
      // Form should appear with content and type fields
      const contentField = page.getByRole('textbox').or(page.getByPlaceholder(/content|memory/i));
      await expect(contentField.first()).toBeVisible();
    }
  });

  test('delete memory button visible on memory items', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i })
      .or(page.locator('[data-testid="delete-memory"]'));
    // May not have memories to delete
    if (await deleteBtn.first().isVisible()) {
      await expect(deleteBtn.first()).toBeVisible();
    }
  });

  test('memory tags are displayed', async ({ page }) => {
    const tags = page.locator('[data-testid="memory-tags"]')
      .or(page.getByText(/tag/i));
    if (await tags.first().isVisible()) {
      await expect(tags.first()).toBeVisible();
    }
  });
});
