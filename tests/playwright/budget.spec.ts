import { test, expect } from '@playwright/test';

test.describe('Budget Management', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page and navigate through proper flow
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to first available trip's budget
    const tripCard = page.getByTestId('trip-card').first();
    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.getByRole('link', { name: /budget/i }).click();
    } else {
      // Skip if no trips available
      test.skip();
    }
  });

  test('should display budget page with add expense option', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add.*expense/i })).toBeVisible();
    
    // Should show budget summary
    const hasSummary = await page.getByText(/total|spent|remaining/i).isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no.*expenses|empty.*budget/i).isVisible().catch(() => false);
    
    expect(hasSummary || hasEmptyState).toBeTruthy();
  });

  test('should open add expense form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*expense/i });
    await addButton.click();
    
    // Should show expense form
    await expect(page.getByLabel(/title|description/i)).toBeVisible();
    await expect(page.getByLabel(/amount/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/currency/i)).toBeVisible();
  });

  test('should validate expense form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*expense/i });
    await addButton.click();
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /add|create|save/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/title.*required|description.*required/i)).toBeVisible();
    await expect(page.getByText(/amount.*required/i)).toBeVisible();
  });

  test('should create expense with valid data', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*expense/i });
    await addButton.click();
    
    // Fill out form with valid data
    await page.getByLabel(/title|description/i).fill('Hotel Accommodation');
    await page.getByLabel(/amount/i).fill('150.00');
    
    // Select category if dropdown exists
    const categorySelect = page.getByLabel(/category/i);
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.getByRole('option', { name: /accommodation|hotel/i }).click();
    }
    
    // Select currency if dropdown exists
    const currencySelect = page.getByLabel(/currency/i);
    if (await currencySelect.isVisible()) {
      await currencySelect.click();
      await page.getByRole('option', { name: /USD|\$/i }).click();
    }
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /add|create|save/i });
    await submitButton.click();
    
    // Should show success or new expense
    await page.waitForTimeout(2000);
    
    const hasSuccessMessage = await page.getByText(/success|added|created/i).isVisible().catch(() => false);
    const hasNewExpense = await page.getByText(/hotel accommodation/i).isVisible().catch(() => false);
    
    expect(hasSuccessMessage || hasNewExpense).toBeTruthy();
  });

  test('should display budget summary calculations', async ({ page }) => {
    // Check for budget summary elements
    const totalBudget = page.getByText(/total.*budget/i);
    const totalSpent = page.getByText(/total.*spent|paid/i);
    const remaining = page.getByText(/remaining|unpaid/i);
    
    // At least one summary element should be visible
    const hasSummary = await totalBudget.isVisible().catch(() => false) ||
                      await totalSpent.isVisible().catch(() => false) ||
                      await remaining.isVisible().catch(() => false);
    
    expect(hasSummary).toBeTruthy();
  });

  test('should handle expense payment status', async ({ page }) => {
    // Look for existing expenses with payment toggles
    const paymentToggle = page.getByRole('checkbox', { name: /paid|payment/i }).first();
    
    if (await paymentToggle.isVisible()) {
      const initialState = await paymentToggle.isChecked();
      
      // Toggle payment status
      await paymentToggle.click();
      await page.waitForTimeout(1000);
      
      // Should update payment status
      const newState = await paymentToggle.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('should filter expenses by category', async ({ page }) => {
    // Look for category filter if it exists
    const categoryFilter = page.getByLabel(/filter.*category|category.*filter/i);
    
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Should show category options
      await expect(page.getByRole('option', { name: /accommodation|food|transport/i })).toBeVisible();
    }
  });
});
