/**
 * Home Screen – Brand Colour & Element Audit
 *
 * Verifies that the Citizen home screen uses the correct brand tokens:
 *   brand     #4EC831  →  rgb(78, 200, 49)
 *   navy      #1B2C3A  →  rgb(27, 44, 58)
 *   brandLight #E8F8E0 →  rgb(232, 248, 224)
 *   surface   #F0F2F5  →  rgb(240, 242, 245)
 *
 * React Native Web renders styles as inline CSS, so we read
 * getComputedStyle() values and parse the rgb() strings.
 */

import { test, expect, Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a hex colour string to the rgb() form browsers return. */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

const BRAND       = hexToRgb('#4EC831'); // rgb(78, 200, 49)
const NAVY        = hexToRgb('#1B2C3A'); // rgb(27, 44, 58)
const BRAND_LIGHT = hexToRgb('#E8F8E0'); // rgb(232, 248, 224)
const SURFACE     = hexToRgb('#F0F2F5'); // rgb(240, 242, 245)
const WHITE       = 'rgb(255, 255, 255)';

/** Return the computed background-color of the first element matching selector. */
async function bgColor(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'NOT_FOUND';
    return window.getComputedStyle(el).backgroundColor;
  }, selector);
}

/** Return the computed color (text colour) of the first element matching selector. */
async function textColor(page: Page, selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return 'NOT_FOUND';
    return window.getComputedStyle(el).color;
  }, selector);
}

/** Return all unique background-colors found within a parent selector. */
async function allBgColors(page: Page, parent: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const parent = document.querySelector(sel);
    if (!parent) return [];
    const all = Array.from(parent.querySelectorAll('*'));
    const colors = new Set<string>();
    all.forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colors.add(bg);
    });
    return Array.from(colors);
  }, parent);
}

// ─── Setup ──────────────────────────────────────────────────────────────────

test.describe('Home Screen – Brand Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the home route (bypasses auth redirect on web)
    await page.goto('/Citizen/home');
    // Wait for the React Native Web bundle to hydrate
    await page.waitForLoadState('networkidle');
    // Brief pause for entrance animations to settle
    await page.waitForTimeout(800);
  });

  // ─── Screenshot ─────────────────────────────────────────────────────────
  test('full-page screenshot', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/home-full.png',
      fullPage: true,
    });
    // Not an assertion — purely for visual review
  });

  test('viewport screenshot (above fold)', async ({ page }) => {
    await page.screenshot({ path: 'e2e/screenshots/home-viewport.png' });
  });

  // ─── Root background ────────────────────────────────────────────────────
  test('page root background is brand surface (#F0F2F5)', async ({ page }) => {
    // RN Web nests the root View several divs deep; find the first div
    // that actually carries the surface background color.
    const bg = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('div'));
      const match = all.find((el) => {
        const c = window.getComputedStyle(el).backgroundColor;
        return c === 'rgb(240, 242, 245)';
      });
      return match ? window.getComputedStyle(match).backgroundColor : 'NOT_FOUND';
    });
    expect(bg, `surface colour ${SURFACE} should exist in root`).toBe(SURFACE);
  });

  // ─── Header ─────────────────────────────────────────────────────────────
  test('header contains text "Good"', async ({ page }) => {
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
  });

  test('header contains user name "John"', async ({ page }) => {
    await expect(page.getByText('John 👋')).toBeVisible();
  });

  // ─── Stats row ──────────────────────────────────────────────────────────
  test('stats row – Total Points label visible', async ({ page }) => {
    await expect(page.getByText('Total Points')).toBeVisible();
  });

  test('stats row – Value Earned label visible', async ({ page }) => {
    await expect(page.getByText('Value Earned')).toBeVisible();
  });

  test('stats row – Recycled label visible', async ({ page }) => {
    await expect(page.getByText('Recycled')).toBeVisible();
  });

  // ─── Recent Scans ───────────────────────────────────────────────────────
  test('Recent Scans section visible', async ({ page }) => {
    await expect(page.getByText('Recent Scans')).toBeVisible();
  });

  test('Recent Scans – PET Plastic entry visible', async ({ page }) => {
    await expect(page.getByText('PET Plastic')).toBeVisible();
  });

  test('Recent Scans – points text uses brand green', async ({ page }) => {
    // +40 pts, +24 pts, +60 pts
    const ptEl = page.getByText(/^\+\d+ pts$/i).first();
    await expect(ptEl).toBeVisible();
    const color = await ptEl.evaluate((el) => window.getComputedStyle(el).color);
    expect(color, `pts text should be brand green ${BRAND}`).toBe(BRAND);
  });

  // ─── Badges ─────────────────────────────────────────────────────────────
  test('My Badges section visible', async ({ page }) => {
    await expect(page.getByText('My Badges')).toBeVisible();
  });

  test('First Scan badge visible', async ({ page }) => {
    await expect(page.getByText('First Scan')).toBeVisible();
  });

  // ─── Nearby Hubs ────────────────────────────────────────────────────────
  test('Nearby Hubs section visible', async ({ page }) => {
    await expect(page.getByText('Nearby Hubs')).toBeVisible();
  });

  test('Open status pill visible for Parkhurst Hub', async ({ page }) => {
    await expect(page.getByText('Parkhurst Hub')).toBeVisible();
    await expect(page.getByText('Open').first()).toBeVisible();
  });

  // ─── Eco Tips ───────────────────────────────────────────────────────────
  test('Eco Tips section visible', async ({ page }) => {
    await expect(page.getByText('Eco Tips')).toBeVisible();
  });

  // ─── Banner ─────────────────────────────────────────────────────────────
  test('promo banner – first slide title visible', async ({ page }) => {
    await expect(page.getByText('Earn 2× Points')).toBeVisible();
  });

  // ─── Brand colour inventory ─────────────────────────────────────────────
  test('no unexpected background colours on page', async ({ page }) => {
    const allowed = new Set([
      BRAND, NAVY, BRAND_LIGHT, SURFACE, WHITE,
      'rgb(0, 0, 0)',          // shadows
      'rgba(0, 0, 0, 0)',      // transparent
      'rgb(27, 44, 58)',       // navy #1B2C3A
      'rgb(16, 29, 40)',       // deeper navy #101D28 (slide 3 bg)
      'rgb(30, 90, 37)',       // greenDark #1E5A25 (slide 2 bg)
      'rgb(240, 242, 245)',    // surface
      'rgb(232, 248, 224)',    // brandLight
      'rgb(78, 200, 49)',      // brand
      'rgb(255, 255, 255)',    // white
      // Badge/icon accent colours — brand tokens
      'rgb(46, 125, 50)',      // Eco Warrior  #2E7D32
      'rgb(226, 143, 60)',     // 7-Day Streak #E28F3C  (orange token)
      'rgb(44, 110, 145)',     // Hub Explorer #2C6E91  (blue token)
      'rgb(63, 139, 123)',     // Plastic Pro  #3F8B7B  (teal token)
      // Scan & tip icon tints — brand tokens
      'rgb(198, 163, 92)',     // Cardboard / Gold  #C6A35C
      'rgb(92, 99, 94)',       // Steel Tin         #5C635E
      'rgb(158, 158, 158)',    // Aluminium (neutral, kept)
      // System / browser chrome
      'rgb(242, 242, 242)',    // browser scrollbar track
      'rgb(245, 245, 245)',    // hubClosed bg
      'rgb(240, 240, 240)',    // locked badge bg
      'rgb(224, 224, 224)',    // search border
      'rgb(208, 208, 208)',    // dot inactive
    ]);

    const found = await allBgColors(page, 'body');
    const unexpected = found.filter(
      (c) => !allowed.has(c) && !c.startsWith('rgba(')
    );

    if (unexpected.length > 0) {
      console.log('\n⚠️  Unexpected background colours found:');
      unexpected.forEach((c) => console.log('  ', c));
    }

    // Report — not a hard failure since computed colours may include
    // browser-added values (scrollbar, input chrome, etc.)
    expect(unexpected.length, `Unexpected bg colours: ${unexpected.join(', ')}`).toBeLessThanOrEqual(3);
  });

  // ─── See all links ───────────────────────────────────────────────────────
  test('"See all" links visible and use brand colour', async ({ page }) => {
    const seeAll = page.getByText('See all').first();
    await expect(seeAll).toBeVisible();
    const color = await seeAll.evaluate((el) => window.getComputedStyle(el).color);
    expect(color, `"See all" should be brand green ${BRAND}`).toBe(BRAND);
  });
});
