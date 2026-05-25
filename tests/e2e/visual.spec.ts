import { expect, test, type Page } from '@playwright/test';
import { MOCK_ARTWORK_URL } from '../../src/mocks/fixtures';

const MOCK_ARTWORK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#9fc4d3"/>
  <circle cx="132" cy="132" r="92" fill="none" stroke="#71909a" stroke-width="3"/>
  <path d="M65 184 L120 154 L182 205 L102 222 Z" fill="#243947"/>
  <path d="M80 167 C116 176 175 169 232 132" fill="none" stroke="#243947" stroke-width="8" stroke-linecap="round"/>
  <text x="150" y="92" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff">Mock Sleeve</text>
  <circle cx="118" cy="168" r="18" fill="#c7b8de"/>
  <circle cx="146" cy="164" r="18" fill="#ef3838"/>
  <circle cx="174" cy="158" r="18" fill="#32d67d"/>
  <circle cx="204" cy="150" r="18" fill="#d842a5"/>
</svg>`;

async function mockArtwork(page: Page) {
  await page.route(MOCK_ARTWORK_URL, route =>
    route.fulfill({
      contentType: 'image/svg+xml',
      headers: { 'access-control-allow-origin': '*' },
      body: MOCK_ARTWORK_SVG,
    })
  );
}

test.describe('Visual regression - mock mode', () => {
  test('full scene with mock track', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockArtwork(page);
    await page.goto('/?mock=1');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const context = canvas.getContext('2d');
      if (!context) return false;
      const labelPixel = context.getImageData(canvas.width / 2, canvas.height * 0.42, 1, 1).data;
      return labelPixel[2] > labelPixel[0] && labelPixel[3] > 0;
    });
    await expect(page).toHaveScreenshot('scene-mock-track.png', { maxDiffPixelRatio: 0.02 });
  });

  test('login screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('VinylVision')).toBeVisible();
    await expect(page).toHaveScreenshot('login.png', { maxDiffPixelRatio: 0.02 });
  });

  test('clean mode keeps Spotify attribution visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mockArtwork(page);
    await page.goto('/?mock=1');
    await page.getByText('Mock Anthem').first().waitFor({ state: 'visible' });
    await page.keyboard.press('f');
    await expect(page.locator('.fixed.bottom-6.left-6')).toHaveClass(/opacity-0/);
    await expect(page.getByText('Listen on Spotify').last()).toBeVisible();
  });
});
