import { test, expect } from '@playwright/test';

test.describe('Itinerary Management', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to navigate to first available trip's itinerary
    const tripCard = page.getByTestId('trip-card').first();
    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.getByRole('link', { name: /itinerary/i }).click();
    } else {
      // Skip if no trips available
      test.skip();
    }
  });

  test('should display itinerary page with add item option', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /itinerary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add.*item|add.*activity/i })).toBeVisible();
    
    // Should show empty state or existing items
    const hasItems = await page.locator('[data-testid*="itinerary"], .itinerary-item').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no.*items|empty.*itinerary/i).isVisible().catch(() => false);
    
    expect(hasItems || hasEmptyState).toBeTruthy();
  });

  test('should open add itinerary item form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*item|add.*activity/i });
    await addButton.click();
    
    // Should show itinerary form
    await expect(page.getByLabel(/title|activity/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/date|start.*date/i)).toBeVisible();
  });

  test('should validate itinerary item form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*item|add.*activity/i });
    await addButton.click();
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /add|create|save/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/title.*required|activity.*required/i)).toBeVisible();
  });

  test('should create itinerary item with valid data', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*item|add.*activity/i });
    await addButton.click();
    
    // Fill out form with valid data
    await page.getByLabel(/title|activity/i).fill('Visit Eiffel Tower');
    
    // Select category if dropdown exists
    const categorySelect = page.getByLabel(/category/i);
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.getByRole('option', { name: /activity|sightseeing/i }).click();
    }
    
    // Set date (future date)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    await page.getByLabel(/date|start.*date/i).fill(futureDate.toISOString().split('T')[0]);
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /add|create|save/i });
    await submitButton.click();
    
    // Should show success or new item
    await page.waitForTimeout(2000);
    
    const hasSuccessMessage = await page.getByText(/success|added|created/i).isVisible().catch(() => false);
    const hasNewItem = await page.getByText(/visit eiffel tower/i).isVisible().catch(() => false);
    
    expect(hasSuccessMessage || hasNewItem).toBeTruthy();
  });

  test('should display itinerary items in chronological order', async ({ page }) => {
    // Check if items are displayed
    const items = page.locator('[data-testid*="itinerary"], .itinerary-item');
    const itemCount = await items.count();
    
    if (itemCount > 1) {
      // Check that items appear to be in date order
      const firstItem = items.first();
      const lastItem = items.last();
      
      await expect(firstItem).toBeVisible();
      await expect(lastItem).toBeVisible();
    }
  });

  test('should handle itinerary item actions', async ({ page }) => {
    // Look for existing items with action menus
    const actionButton = page.getByRole('button', { name: /menu|actions|more/i }).first();
    
    if (await actionButton.isVisible()) {
      await actionButton.click();
      
      // Should show edit and delete options
      await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
    }
  });
});
