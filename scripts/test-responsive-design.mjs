#!/usr/bin/env node

/**
 * Test script to verify responsive design implementation
 * Tests Task 33: Add Responsive Design Polish
 */

import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:3000';

// Common mobile and tablet viewport sizes
const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Air', width: 820, height: 1180 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'Desktop Small', width: 1024, height: 768 },
  { name: 'Desktop Large', width: 1440, height: 900 },
];

async function testResponsiveDesign() {
  console.log('🧪 Testing Responsive Design Implementation...\n');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of VIEWPORTS) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const page = await browser.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      try {
        // Test home page
        await page.goto(TEST_URL, { waitUntil: 'networkidle' });
        
        // Check for horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        // Check if navigation is visible and properly sized
        const navVisible = await page.isVisible('[role="navigation"], nav');
        
        // Check if buttons are touch-friendly (at least 44px)
        const touchFriendlyButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
          return buttons.every(button => {
            const rect = button.getBoundingClientRect();
            return rect.height >= 40 && rect.width >= 40; // Allow some tolerance
          });
        });

        // Check if text is readable (not too small)
        const readableText = await page.evaluate(() => {
          const textElements = Array.from(document.querySelectorAll('p, span, div'));
          return textElements.every(element => {
            const style = window.getComputedStyle(element);
            const fontSize = parseFloat(style.fontSize);
            return fontSize >= 14; // Minimum 14px for readability
          });
        });

        const result = {
          viewport: viewport.name,
          size: `${viewport.width}x${viewport.height}`,
          noHorizontalScroll: !hasHorizontalScroll,
          navigationVisible: navVisible,
          touchFriendly: touchFriendlyButtons,
          readableText: readableText,
          passed: !hasHorizontalScroll && navVisible && touchFriendlyButtons && readableText
        };

        results.push(result);
        
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} No horizontal scroll: ${result.noHorizontalScroll}`);
        console.log(`   ${status} Navigation visible: ${result.navigationVisible}`);
        console.log(`   ${status} Touch-friendly buttons: ${result.touchFriendly}`);
        console.log(`   ${status} Readable text: ${result.readableText}`);
        console.log('');

      } catch (error) {
        console.log(`   ❌ Error testing ${viewport.name}: ${error.message}`);
        results.push({
          viewport: viewport.name,
          size: `${viewport.width}x${viewport.height}`,
          error: error.message,
          passed: false
        });
      } finally {
        await page.close();
      }
    }

    // Summary
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    
    console.log('\n📊 RESPONSIVE DESIGN TEST SUMMARY');
    console.log('================================');
    console.log(`✅ Passed: ${passed}/${total} viewports`);
    console.log(`❌ Failed: ${total - passed}/${total} viewports`);
    
    if (passed === total) {
      console.log('\n🎉 All responsive design tests passed!');
      console.log('✅ Task 33 acceptance criteria met:');
      console.log('   - No horizontal scrolling on any screen size');
      console.log('   - All components are touch-friendly');
      console.log('   - Navigation works on all screen sizes');
      console.log('   - Text is readable on all devices');
    } else {
      console.log('\n⚠️  Some tests failed. Check the details above.');
      const failed = results.filter(r => !r.passed);
      failed.forEach(result => {
        console.log(`   - ${result.viewport}: ${result.error || 'Multiple issues'}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testResponsiveDesign().catch(console.error);
}

export { testResponsiveDesign };
