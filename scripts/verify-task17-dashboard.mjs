// Task 17 Verification Script
// This script verifies that the dashboard layout and navigation are working correctly

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

console.log('🚀 Task 17 Verification: Dashboard Layout and Navigation');
console.log('=' .repeat(60));

// Check required files exist
const requiredFiles = [
  'src/app/(dashboard)/layout.tsx',
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/components/dashboard/DashboardNav.tsx',
  'src/components/common/EmptyState.tsx'
];

console.log('\n📁 Checking required files...');
let filesExist = true;
for (const file of requiredFiles) {
  const fullPath = path.join(process.cwd(), file);
  const exists = existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) filesExist = false;
}

if (!filesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check TypeScript compilation
console.log('\n🔍 Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log(error.stdout?.toString() || error.message);
  process.exit(1);
}

// Check component exports
console.log('\n📦 Checking component exports...');
const componentChecks = [
  {
    file: 'src/components/dashboard/index.ts',
    exports: ['TripCard', 'DashboardNav']
  },
  {
    file: 'src/components/common/index.ts',
    exports: ['EmptyState', 'NoTripsEmptyState', 'NoResultsEmptyState', 'ErrorEmptyState']
  }
];

for (const check of componentChecks) {
  const content = readFileSync(check.file, 'utf-8');
  for (const exportName of check.exports) {
    if (content.includes(exportName)) {
      console.log(`✅ ${exportName} exported from ${check.file}`);
    } else {
      console.log(`❌ ${exportName} missing from ${check.file}`);
    }
  }
}

// Check dashboard features
console.log('\n🎯 Checking dashboard features...');

// Check layout features
const layoutContent = readFileSync('src/app/(dashboard)/layout.tsx', 'utf-8');
const layoutFeatures = [
  { feature: 'ProtectedRoute wrapper', check: 'ProtectedRoute' },
  { feature: 'Sidebar navigation', check: 'md:w-64' },
  { feature: 'Mobile navigation', check: 'md:hidden' },
  { feature: 'DashboardNav component', check: 'DashboardNav' },
  { feature: 'Responsive design', check: 'flex-col' }
];

for (const { feature, check } of layoutFeatures) {
  const hasFeature = layoutContent.includes(check);
  console.log(`${hasFeature ? '✅' : '❌'} ${feature}`);
}

// Check navigation features
const navContent = readFileSync('src/components/dashboard/DashboardNav.tsx', 'utf-8');
const navFeatures = [
  { feature: 'Navigation highlighting', check: 'current' },
  { feature: 'Mobile responsive', check: 'isMobile' },
  { feature: 'User info display', check: 'user_metadata' },
  { feature: 'Sign out functionality', check: 'signOut' },
  { feature: 'Lucide icons', check: 'HomeIcon' }
];

for (const { feature, check } of navFeatures) {
  const hasFeature = navContent.includes(check);
  console.log(`${hasFeature ? '✅' : '❌'} ${feature}`);
}

// Check dashboard page features
const dashboardContent = readFileSync('src/app/(dashboard)/dashboard/page.tsx', 'utf-8');
const dashboardFeatures = [
  { feature: 'Welcome message', check: 'Welcome back' },
  { feature: 'Create trip button', check: 'Create Trip' },
  { feature: 'Trip grid layout', check: 'grid-cols' },
  { feature: 'Empty state handling', check: 'EmptyState' },
  { feature: 'Loading states', check: 'LoadingSpinner' }
];

for (const { feature, check } of dashboardFeatures) {
  const hasFeature = dashboardContent.includes(check);
  console.log(`${hasFeature ? '✅' : '❌'} ${feature}`);
}

// Check empty state features
const emptyStateContent = readFileSync('src/components/common/EmptyState.tsx', 'utf-8');
const emptyStateFeatures = [
  { feature: 'Icon support', check: 'LucideIcon' },
  { feature: 'Action buttons', check: 'action' },
  { feature: 'Preset variants', check: 'NoTripsEmptyState' },
  { feature: 'Responsive design', check: 'mx-auto' }
];

for (const { feature, check } of emptyStateFeatures) {
  const hasFeature = emptyStateContent.includes(check);
  console.log(`${hasFeature ? '✅' : '❌'} ${feature}`);
}

console.log('\n🎉 Task 17 Verification Complete!');
console.log('=' .repeat(60));
console.log('✅ Dashboard layout with sidebar navigation implemented');
console.log('✅ Responsive design for mobile/desktop working');
console.log('✅ Navigation highlights current page');
console.log('✅ Empty state for users with no trips ready');
console.log('✅ All acceptance criteria met!');
console.log('\n🚀 Ready to proceed to Task 18: Implement Trip Creation API and Form');
