import { expect, test } from '@playwright/test';

test.describe('OAuth flow (mocked)', () => {
  test('login button redirects to Spotify authorize', async ({ page }) => {
    await page.goto('/');
    const navigation = page.waitForRequest(request =>
      request.url().startsWith('https://accounts.spotify.com/authorize')
    );
    await page.getByRole('button', { name: /connect spotify/i }).click();
    const request = await navigation;
    const url = new URL(request.url());
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('scope')).toBe('user-read-currently-playing');
  });

  test('callback with denied error returns to login', async ({ page }) => {
    await page.goto('/callback?error=access_denied');
    await expect(page.getByText(/denied/i)).toBeVisible();
  });

  test('callback with missing state shows error', async ({ page }) => {
    await page.goto('/callback?code=abc');
    await expect(page.getByText(/missing|state/i)).toBeVisible();
  });
});
