import { expect, test } from '@playwright/test';

test.describe('Visual regression - mock mode', () => {
  test('full scene with mock track', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?mock=1');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const context = canvas.getContext('2d');
      if (!context) return false;
      const pixel = context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
      return pixel[3] > 0;
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
    await page.goto('/?mock=1');
    await page.getByText('Mock Anthem').first().waitFor({ state: 'visible' });
    await page.keyboard.press('f');
    await expect(page.locator('.fixed.bottom-6.left-6')).toHaveClass(/opacity-0/);
    await expect(page.getByText('Listen on Spotify').last()).toBeVisible();
  });
});
