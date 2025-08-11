import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';
const breakpoints = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

type Task = { 
  id: number; 
  description: string; 
  status: 'pending'|'in-progress'|'done'|'blocked'; 
  note?: string;
  priority?: 'high'|'medium'|'low';
};

test('Review TripTogether app and generate test-status.md', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];
  const performanceIssues: string[] = [];

  // Capture console errors and network failures
  page.on('console', msg => { 
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('requestfailed', req => {
    requestFailures.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  console.log(`🔍 Testing TripTogether at ${BASE}`);

  // Navigate to home page
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  
  // Inject axe for accessibility testing
  // Run accessibility scan (desktop for comprehensive results)
  await page.setViewportSize({ width: 1440, height: 900 });
  const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();

  console.log(`♿ Accessibility: ${axeResults.violations.length} violations, ${axeResults.passes.length} passes`);

  // Test responsiveness and capture screenshots
  const overflowFindings: string[] = [];
  const screenshotPaths: string[] = [];

  for (const bp of breakpoints) {
    console.log(`📱 Testing ${bp.name} (${bp.width}x${bp.height})`);
    
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.waitForTimeout(500); // Allow layout to settle
    
    // Check for horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    if (scrollWidth > clientWidth + 5) { // 5px tolerance
      overflowFindings.push(`Horizontal overflow at ${bp.name} (${bp.width}px): scroll=${scrollWidth}, client=${clientWidth}`);
    }

    // Check if primary sections are visible
    const headerVisible = await page.locator('header, [role="banner"]').isVisible();
    const mainVisible = await page.locator('main, [role="main"]').isVisible();
    
    if (!headerVisible) {
      performanceIssues.push(`Header not visible at ${bp.name}`);
    }
    if (!mainVisible) {
      performanceIssues.push(`Main content not visible at ${bp.name}`);
    }

    // Take screenshot
    const screenshotPath = `./playwright-report/${bp.name}-${Date.now()}.png`;
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      animations: 'disabled'
    });
    screenshotPaths.push(screenshotPath);
  }

  // Test key user flows
  console.log('🔄 Testing key user flows...');
  
  // Test navigation to login
  try {
    await page.goto(BASE + '/login');
    await page.waitForLoadState('networkidle');
    const loginFormExists = await page.locator('form').count() > 0;
    if (!loginFormExists) {
      performanceIssues.push('Login page missing form element');
    }
  } catch (error) {
    performanceIssues.push(`Login page navigation failed: ${error}`);
  }

  // Test navigation to signup
  try {
    await page.goto(BASE + '/signup');
    await page.waitForLoadState('networkidle');
    const signupFormExists = await page.locator('form').count() > 0;
    if (!signupFormExists) {
      performanceIssues.push('Signup page missing form element');
    }
  } catch (error) {
    performanceIssues.push(`Signup page navigation failed: ${error}`);
  }

  // Build tasks from findings
  let taskId = 1;
  const tasks: Task[] = [];

  // Console errors (high priority)
  for (const error of consoleErrors) {
    tasks.push({
      id: taskId++,
      status: 'pending',
      priority: 'high',
      description: `Fix console error on load: "${error.slice(0, 150)}${error.length > 150 ? '...' : ''}"`
    });
  }

  // Network failures (high priority)
  for (const failure of requestFailures) {
    tasks.push({
      id: taskId++,
      status: 'pending',
      priority: 'high',
      description: `Resolve failing network request: ${failure.slice(0, 150)}${failure.length > 150 ? '...' : ''}`
    });
  }

  // Accessibility violations (medium to high priority)
  for (const violation of axeResults.violations) {
    const nodeCount = violation.nodes?.length ?? 0;
    const priority = violation.impact === 'critical' || violation.impact === 'serious' ? 'high' : 'medium';
    
    tasks.push({
      id: taskId++,
      status: 'pending',
      priority,
      description: `A11y: ${violation.id} – ${violation.help} (${nodeCount} nodes affected). ${violation.description?.slice(0, 100) || 'Fix accessibility issue'}`
    });
  }

  // Layout overflow issues (medium priority)
  for (const overflow of overflowFindings) {
    tasks.push({
      id: taskId++,
      status: 'pending',
      priority: 'medium',
      description: `Layout: ${overflow}. Identify and fix container causing horizontal scroll.`
    });
  }

  // Performance and functionality issues (medium priority)
  for (const issue of performanceIssues) {
    tasks.push({
      id: taskId++,
      status: 'pending',
      priority: 'medium',
      description: `UI/UX: ${issue}. Ensure proper element structure and visibility.`
    });
  }

  // Add default verification task if no issues found
  if (tasks.length === 0) {
    tasks.push({
      id: taskId++,
      status: 'pending',
      priority: 'low',
      description: 'Verify no regressions across 390/768/1440px breakpoints and add smoke tests for key user flows.'
    });
  }

  // Sort tasks by priority (high -> medium -> low)
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']);

  // Generate test-status.md
  const today = new Date().toISOString().slice(0, 10);
  const currentTask = tasks[0];
  const nextTask = tasks[1] ?? tasks[0];

  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
  const lowPriorityTasks = tasks.filter(t => t.priority === 'low');

  const statusContent = `# Testing and Bug Fixing Status

## Current Progress
- **Phase**: Polish
- **Current Task**: #${currentTask.id} - ${currentTask.description}
- **Last Successful Task**: #35 (Performance Optimizations)
- **Next Task**: #${nextTask.id}

## Task Status

### ✅ Completed
- Task #34: Implement Automated E2E Testing - 2025-01-15
- Task #35: Final Bug Fixes and Performance Optimizations - 2025-01-15

### 🔄 In Progress
- Task #${currentTask.id}: ${currentTask.description} - Started ${today}

### ⏳ Pending

#### 🔴 High Priority (${highPriorityTasks.length} tasks)
${highPriorityTasks.slice(0, 5).map(t => `- Task #${t.id}: ${t.description}`).join('\n') || '- (none)'}
${highPriorityTasks.length > 5 ? `- ... and ${highPriorityTasks.length - 5} more high priority tasks` : ''}

#### 🟡 Medium Priority (${mediumPriorityTasks.length} tasks)
${mediumPriorityTasks.slice(0, 5).map(t => `- Task #${t.id}: ${t.description}`).join('\n') || '- (none)'}
${mediumPriorityTasks.length > 5 ? `- ... and ${mediumPriorityTasks.length - 5} more medium priority tasks` : ''}

#### 🟢 Low Priority (${lowPriorityTasks.length} tasks)
${lowPriorityTasks.slice(0, 3).map(t => `- Task #${t.id}: ${t.description}`).join('\n') || '- (none)'}

### ❌ Failed/Blocked
- (none currently)

## Test Results Summary

### Accessibility (axe-core)
- **Violations**: ${axeResults.violations.length}
- **Passes**: ${axeResults.passes.length}
- **Incomplete**: ${axeResults.incomplete.length}

### Console & Network
- **Console Errors**: ${consoleErrors.length}
- **Network Failures**: ${requestFailures.length}

### Responsive Design
- **Breakpoints Tested**: 390px, 768px, 1440px
- **Overflow Issues**: ${overflowFindings.length}
- **Screenshots**: ${screenshotPaths.length} captured

## Notes
- Automated testing completed on ${today}
- Base URL tested: ${BASE}
- Screenshots saved to: ./playwright-report/
- Total tasks identified: ${tasks.length}
- Priority distribution: ${highPriorityTasks.length} high, ${mediumPriorityTasks.length} medium, ${lowPriorityTasks.length} low

## Next Steps
1. Address high priority console errors and network failures first
2. Fix critical accessibility violations (WCAG 2.1 AA compliance)
3. Resolve layout overflow issues for mobile responsiveness
4. Verify fixes don't introduce regressions
5. Re-run automated testing to confirm resolution

---
*Generated automatically by Playwright test suite on ${today}*
`;

  // Write the status file
  const statusPath = path.join(process.cwd(), 'test-status.md');
  fs.writeFileSync(statusPath, statusContent, 'utf8');
  
  console.log(`✅ Generated ${statusPath}`);
  console.log(`📊 Summary: ${tasks.length} tasks (${highPriorityTasks.length} high, ${mediumPriorityTasks.length} medium, ${lowPriorityTasks.length} low priority)`);
  console.log(`📸 Screenshots: ${screenshotPaths.join(', ')}`);

  await context.close();

  // Test passes - we're generating a report, not asserting failures
  expect(tasks).toBeDefined();
  expect(statusPath).toBeTruthy();
});
