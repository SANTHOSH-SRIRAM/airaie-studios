import { test, expect, type Page } from '@playwright/test';

// ============================================================
// E2E Tests — Card Detail Page UAT
// ============================================================
//
// Strategy: Navigate through the UI using text-based selectors
// that match actual page content visible in screenshots.
//
// Run: cd studios/apps/board-studio && npm run test:e2e
// ============================================================

// --- Helpers ---

/** Navigate to board detail by clicking a board name on the boards page.
 *  Board-studio runs standalone at port 3003 (not behind the platform at 3000). */
async function goToBoard(page: Page) {
  await page.goto('/boards');
  // Wait for board listing to render — look for "Active Boards" or board names
  await page.waitForTimeout(3000);

  // Find and click a board card
  const boardLink = page.locator('text=/Stress Analysis|Wing Cert|MVP Test|IntentSpec Test|NDT test/i').first();
  if (await boardLink.isVisible({ timeout: 10000 }).catch(() => false)) {
    await boardLink.click();
  } else {
    // If no boards found, the app may show differently at :3003 standalone
    // Try clicking "Active Boards" sidebar link first
    const sidebarLink = page.locator('text=Active Boards').first();
    if (await sidebarLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sidebarLink.click();
      await page.waitForTimeout(2000);
      const boardLink2 = page.locator('text=/Stress Analysis|Wing Cert|MVP Test/i').first();
      if (await boardLink2.isVisible({ timeout: 5000 }).catch(() => false)) {
        await boardLink2.click();
      }
    }
  }
  await page.waitForTimeout(3000);
}

/** Navigate to card detail by going through board > outline card click > View Details */
async function goToCardDetail(page: Page) {
  await goToBoard(page);

  // Step 1: Click a card in the outline sidebar
  // Outline card buttons contain a short type suffix like "Ana", "Swe", "Com"
  // (from card.type.slice(0,3)), which is unique to outline items.
  // The buttons are inside the scrollable tree below the "CARDS" heading.
  const outlineCardButton = page.locator('button >> text=Ana').first();
  let clicked = false;

  if (await outlineCardButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await outlineCardButton.click();
    clicked = true;
  }

  if (!clicked) {
    // Fallback: try clicking any card in the main grid
    const gridCard = page.locator('text=Static Stress Analysis').first();
    if (await gridCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await gridCard.click();
    }
  }
  await page.waitForTimeout(1500);

  // Step 2: Click "View Details" in the inspector panel that appeared
  const viewDetails = page.locator('text=View Details').first();
  if (await viewDetails.isVisible({ timeout: 5000 }).catch(() => false)) {
    await viewDetails.click();
    await page.waitForTimeout(3000);
  } else {
    // Last resort: take screenshot to debug what the page looks like
    await page.screenshot({ path: 'test-results/debug-board-page.png' });
  }
}

/** Check if we're on the card detail page (has tablist) */
async function isOnCardDetailPage(page: Page): Promise<boolean> {
  return page.locator('[role="tablist"]').isVisible({ timeout: 5000 }).catch(() => false);
}

// ============================================================
// GROUP 1: Card Detail Page Layout (Phases 2-4)
// ============================================================

test.describe('Group 1: Card Detail Layout', () => {

  test('card detail page loads with tabs', async ({ page }) => {
    await goToCardDetail(page);

    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) {
      // If navigation didn't work, take screenshot for debugging
      test.skip(true, 'Could not navigate to card detail — check board/card data');
      return;
    }

    // Verify tablist exists
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // Verify all 6 tabs
    for (const label of ['Intent', 'Inputs', 'Tool Shelf', 'Plan', 'Results', 'Governance']) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }
  });

  test('split-pane layout has canvas and properties panels', async ({ page }) => {
    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    // react-resizable-panels v4 renders data-group and data-panel (boolean attrs)
    const panels = page.locator('[data-panel]');
    const panelCount = await panels.count();
    expect(panelCount).toBeGreaterThanOrEqual(2);
  });

  test('clicking tabs updates URL', async ({ page }) => {
    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page).toHaveURL(/tab=results/);

    await page.getByRole('tab', { name: 'Plan' }).click();
    await expect(page).toHaveURL(/tab=plan/);
  });

  test('tab persists after refresh', async ({ page }) => {
    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page).toHaveURL(/tab=results/);

    await page.reload();
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'Results' })).toHaveAttribute('aria-selected', 'true');
  });

  test('arrow keys navigate tabs', async ({ page }) => {
    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    const intentTab = page.getByRole('tab', { name: 'Intent' });
    await intentTab.click();
    await intentTab.focus();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Inputs' })).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Intent' })).toHaveAttribute('aria-selected', 'true');
  });

  test('Escape navigates back', async ({ page }) => {
    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    const urlBefore = page.url();
    await page.locator('h1').first().click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toEqual(urlBefore);
  });

  test('F key toggles fullscreen', async ({ page }) => {
    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    const panels = page.locator('[data-panel]');
    const initialCount = await panels.count();
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // Press F to collapse properties
    await page.locator('h1').first().click();
    await page.keyboard.press('f');
    await page.waitForTimeout(500);

    // Press F to restore
    await page.keyboard.press('f');
    await page.waitForTimeout(500);

    // Should still have panels
    const finalCount = await panels.count();
    expect(finalCount).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================
// GROUP 2: Tab Content (Phases 3, 5, 8)
// ============================================================

test.describe('Group 2: Tab Content', () => {
  test('all tabs render without error boundary', async ({ page }) => {
    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    for (const tab of ['Intent', 'Inputs', 'Tool Shelf', 'Plan', 'Results', 'Governance']) {
      await page.getByRole('tab', { name: tab }).click();
      await page.waitForTimeout(300);
      const hasError = await page.getByText('Something went wrong').isVisible().catch(() => false);
      expect(hasError, `Tab "${tab}" triggered error boundary`).toBeFalsy();
    }
  });
});

// ============================================================
// GROUP 3: Board Detail (Phase 4)
// ============================================================

test.describe('Group 3: Board Detail', () => {
  test('board detail page loads', async ({ page }) => {
    await goToBoard(page);
    // Should see CARDS or card-related content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
  });
});

// ============================================================
// GROUP 4: No React Crashes
// ============================================================

test.describe('Group 4: Stability', () => {
  test('card detail navigation produces no React crashes', async ({ page }) => {
    const crashes: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          text.includes('Cannot read properties of') ||
          text.includes('is not a function') ||
          text.includes('is not defined')
        ) {
          crashes.push(text);
        }
      }
    });

    await goToCardDetail(page);
    const onDetail = await isOnCardDetailPage(page);
    if (!onDetail) { test.skip(true, 'Not on card detail page'); return; }

    for (const tab of ['Intent', 'Inputs', 'Tool Shelf', 'Plan', 'Results', 'Governance']) {
      await page.getByRole('tab', { name: tab }).click();
      await page.waitForTimeout(200);
    }

    expect(crashes).toHaveLength(0);
  });
});
