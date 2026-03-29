import { test, expect } from '@playwright/test';

test.describe('Wallet Flow', () => {
  test('should create a new wallet successfully', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // 1. Initial Auth Screen
    await expect(page.locator('h1')).toHaveText('TON Wallet');
    
    // 2. Click "Create New Wallet"
    await page.getByRole('button', { name: 'Create New Wallet' }).click();

    // 3. Ensure we are on the Recovery Phrase screen
    await expect(page.locator('h2')).toHaveText('Recovery Phrase');
    
    // 4. Fill passwords
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('test1234'); // master password
    await passwordInputs.nth(1).fill('test1234'); // confirm password
    
    // 5. Submit
    await page.getByRole('button', { name: 'Continue' }).click();

    // 6. Ensure we reach the Home screen
    await expect(page.locator('text=Total Balance')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();
  });
});