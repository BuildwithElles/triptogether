import { test, expect } from '@playwright/test';

test.describe('Trip Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes user is logged in)
    await page.goto('/dashboard');
  });

  test('should display dashboard with trip creation option', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create.*trip/i })).toBeVisible();
    
    // Should show empty state or existing trips
    const hasTrips = await page.getByTestId('trip-card').isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no trips yet/i).isVisible().catch(() => false);
    
    expect(hasTrips || hasEmptyState).toBeTruthy();
  });

  test('should open trip creation form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create.*trip/i });
    await createButton.click();
    
    // Should show trip creation form
    await expect(page.getByLabel(/trip title/i)).toBeVisible();
    await expect(page.getByLabel(/destination/i)).toBeVisible();
    await expect(page.getByLabel(/start date/i)).toBeVisible();
    await expect(page.getByLabel(/end date/i)).toBeVisible();
  });

  test('should validate trip creation form', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create.*trip/i });
    await createButton.click();
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /create trip/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/title.*required/i)).toBeVisible();
    await expect(page.getByText(/destination.*required/i)).toBeVisible();
  });

  test('should create trip with valid data', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create.*trip/i });
    await createButton.click();
    
    // Fill out form with valid data
    await page.getByLabel(/trip title/i).fill('Test Trip to Paris');
    await page.getByLabel(/destination/i).fill('Paris, France');
    
    // Set dates (future dates)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 37);
    
    await page.getByLabel(/start date/i).fill(startDate.toISOString().split('T')[0]);
    await page.getByLabel(/end date/i).fill(endDate.toISOString().split('T')[0]);
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /create trip/i });
    await submitButton.click();
    
    // Should either show success message or redirect to trip
    await page.waitForTimeout(3000); // Wait for creation
    
    // Check for success indicators
    const hasSuccessMessage = await page.getByText(/success|created/i).isVisible().catch(() => false);
    const hasNewTrip = await page.getByText(/test trip to paris/i).isVisible().catch(() => false);
    const isOnTripPage = page.url().includes('/trips/');
    
    expect(hasSuccessMessage || hasNewTrip || isOnTripPage).toBeTruthy();
  });

  test('should navigate to individual trip page', async ({ page }) => {
    // Look for existing trip cards
    const tripCard = page.getByTestId('trip-card').first();
    
    if (await tripCard.isVisible()) {
      await tripCard.click();
      
      // Should navigate to trip page
      await expect(page).toHaveURL(/\/trips\/[^/]+$/);
      
      // Should show trip features
      await expect(page.getByText(/itinerary|budget|packing|chat|gallery|outfits/i)).toBeVisible();
    }
  });

  test('should display trip features navigation', async ({ page }) => {
    // Try to navigate to a trip page directly or via dashboard
    const tripCard = page.getByTestId('trip-card').first();
    
    if (await tripCard.isVisible()) {
      await tripCard.click();
      
      // Should show all feature cards
      const features = ['itinerary', 'budget', 'packing', 'chat', 'gallery', 'outfits'];
      
      for (const feature of features) {
        const featureCard = page.getByRole('link', { name: new RegExp(feature, 'i') });
        await expect(featureCard).toBeVisible();
      }
    }
  });

  test('should handle trip access permissions', async ({ page }) => {
    // Try to access a non-existent trip
    await page.goto('/trips/non-existent-trip-id');
    
    // Should show 404 or access denied
    const has404 = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const hasAccessDenied = await page.getByText(/access denied|unauthorized/i).isVisible().catch(() => false);
    const redirectedToDashboard = page.url().includes('/dashboard');
    
    expect(has404 || hasAccessDenied || redirectedToDashboard).toBeTruthy();
  });
});
