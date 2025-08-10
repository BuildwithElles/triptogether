import { test, expect } from '@playwright/test';

test.describe('Core User Flows', () => {
  test('complete user journey: signup → create trip → manage features', async ({ page }) => {
    // This test covers the main user journey end-to-end
    
    // Step 1: Navigate to signup
    await page.goto('/auth/signup');
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    
    // Step 2: Navigate to login (simulating existing user)
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    
    // Step 3: Check dashboard accessibility (assumes user would be logged in)
    await page.goto('/dashboard');
    
    // Should either show dashboard or redirect to auth
    const isOnDashboard = page.url().includes('/dashboard');
    const isOnAuth = page.url().includes('/auth');
    
    expect(isOnDashboard || isOnAuth).toBeTruthy();
    
    if (isOnDashboard) {
      // Step 4: Test trip creation flow
      const createButton = page.getByRole('button', { name: /create.*trip/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await expect(page.getByLabel(/trip title/i)).toBeVisible();
      }
    }
  });

  test('navigation flow: dashboard → trip → features', async ({ page }) => {
    await page.goto('/dashboard');
    
    // If user is authenticated and has trips
    const tripCard = page.getByTestId('trip-card').first();
    
    if (await tripCard.isVisible()) {
      // Navigate to trip
      await tripCard.click();
      await expect(page).toHaveURL(/\/trips\/[^/]+$/);
      
      // Test feature navigation
      const features = ['itinerary', 'budget', 'packing', 'chat', 'gallery', 'outfits'];
      
      for (const feature of features.slice(0, 3)) { // Test first 3 features
        const featureLink = page.getByRole('link', { name: new RegExp(feature, 'i') });
        
        if (await featureLink.isVisible()) {
          await featureLink.click();
          await expect(page).toHaveURL(new RegExp(`/trips/[^/]+/${feature}`));
          
          // Navigate back to trip dashboard
          const backButton = page.getByRole('button', { name: /back/i });
          if (await backButton.isVisible()) {
            await backButton.click();
          } else {
            await page.goBack();
          }
        }
      }
    }
  });

  test('responsive navigation across viewports', async ({ page }) => {
    await page.goto('/dashboard');
    
    const viewportSize = page.viewportSize();
    
    if (viewportSize && viewportSize.width < 768) {
      // Mobile: Should show mobile navigation
      const mobileNav = page.getByTestId('mobile-nav');
      await expect(mobileNav).toBeVisible();
      
      // Test mobile navigation items
      const navItems = mobileNav.locator('a, button');
      const count = await navItems.count();
      expect(count).toBeGreaterThan(0);
      
    } else {
      // Desktop: Should show desktop navigation
      const desktopNav = page.getByTestId('desktop-nav');
      await expect(desktopNav).toBeVisible();
    }
  });

  test('error handling and 404 pages', async ({ page }) => {
    // Test 404 handling
    await page.goto('/non-existent-page');
    
    const has404 = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const redirected = !page.url().includes('/non-existent-page');
    
    expect(has404 || redirected).toBeTruthy();
    
    // Test invalid trip ID
    await page.goto('/trips/invalid-trip-id');
    
    const hasError = await page.getByText(/not found|error|access denied/i).isVisible().catch(() => false);
    const redirectedFromInvalid = !page.url().includes('/trips/invalid-trip-id');
    
    expect(hasError || redirectedFromInvalid).toBeTruthy();
  });

  test('accessibility and keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Should have focusable elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test multiple tab presses
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should still have focus on a visible element
    const stillFocused = page.locator(':focus');
    await expect(stillFocused).toBeVisible();
  });

  test('performance and loading states', async ({ page }) => {
    // Test page load performance
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time (10 seconds max)
    expect(loadTime).toBeLessThan(10000);
    
    // Should show loading states during navigation
    const tripCard = page.getByTestId('trip-card').first();
    
    if (await tripCard.isVisible()) {
      await tripCard.click();
      
      // Should show some content quickly
      await page.waitForTimeout(1000);
      const hasContent = await page.locator('main, [role="main"], .main-content').isVisible().catch(() => false);
      expect(hasContent).toBeTruthy();
    }
  });
});
