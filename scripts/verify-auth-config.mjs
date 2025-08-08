#!/usr/bin/env node

/**
 * Task 12 Verification Script
 * 
 * Verifies that Supabase Auth Configuration is properly set up
 * Tests auth routes, configuration, and error handling
 */

import { promises as fs } from 'fs'
import path from 'path'

const WORKSPACE_ROOT = process.cwd()

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function readFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`)
  }
}

// Test 1: Verify auth configuration file
async function testAuthConfig() {
  logInfo('Testing auth configuration...')
  
  const configPath = path.join(WORKSPACE_ROOT, 'src/lib/auth/config.ts')
  
  if (!await fileExists(configPath)) {
    logError('Auth config file not found: src/lib/auth/config.ts')
    return false
  }
  
  const content = await readFileContent(configPath)
  
  // Check for required exports
  const requiredExports = [
    'AUTH_CONFIG',
    'authOptions',
    'AuthState',
    'AuthAction',
    'validatePassword',
    'validateEmail',
    'getAuthErrorMessage'
  ]
  
  for (const exportName of requiredExports) {
    if (!content.includes(exportName)) {
      logError(`Missing required export: ${exportName}`)
      return false
    }
  }
  
  // Check for security configurations
  if (!content.includes('flowType: \'pkce\'')) {
    logError('PKCE flow not configured')
    return false
  }
  
  if (!content.includes('persistSession: true')) {
    logError('Session persistence not enabled')
    return false
  }
  
  logSuccess('Auth configuration properly set up')
  return true
}

// Test 2: Verify auth API routes
async function testAuthRoutes() {
  logInfo('Testing auth API routes...')
  
  const routes = [
    'src/app/api/auth/callback/route.ts',
    'src/app/api/auth/signup/route.ts', 
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/logout/route.ts'
  ]
  
  for (const route of routes) {
    const routePath = path.join(WORKSPACE_ROOT, route)
    
    if (!await fileExists(routePath)) {
      logError(`Auth route not found: ${route}`)
      return false
    }
    
    const content = await readFileContent(routePath)
    
    // Check for required elements
    if (!content.includes('createServerClient')) {
      logError(`${route} missing Supabase server client`)
      return false
    }
    
    if (!content.includes('NextResponse')) {
      logError(`${route} missing Next.js response handling`)
      return false
    }
    
    if (!content.includes('dynamic = \'force-dynamic\'')) {
      logError(`${route} missing dynamic rendering configuration`)
      return false
    }
  }
  
  logSuccess('All auth API routes properly configured')
  return true
}

// Test 3: Verify auth error pages  
async function testAuthPages() {
  logInfo('Testing auth error pages...')
  
  const pages = [
    'src/app/auth/error/page.tsx',
    'src/app/auth/confirm/page.tsx'
  ]
  
  for (const page of pages) {
    const pagePath = path.join(WORKSPACE_ROOT, page)
    
    if (!await fileExists(pagePath)) {
      logError(`Auth page not found: ${page}`)
      return false
    }
    
    const content = await readFileContent(pagePath)
    
    // Check for suspense boundary
    if (!content.includes('Suspense')) {
      logError(`${page} missing Suspense boundary`)
      return false
    }
    
    // Check for search params handling
    if (!content.includes('useSearchParams')) {
      logError(`${page} missing search params handling`)
      return false
    }
  }
  
  logSuccess('Auth error pages properly configured')
  return true
}

// Test 4: Verify auth module exports
async function testAuthExports() {
  logInfo('Testing auth module exports...')
  
  const indexPath = path.join(WORKSPACE_ROOT, 'src/lib/auth/index.ts')
  
  if (!await fileExists(indexPath)) {
    logError('Auth index file not found: src/lib/auth/index.ts')
    return false
  }
  
  const content = await readFileContent(indexPath)
  
  if (!content.includes('export * from \'./config\'')) {
    logError('Auth config not exported from index')
    return false
  }
  
  if (!content.includes('AuthState') || !content.includes('AuthAction')) {
    logError('Auth types not exported from index')
    return false
  }
  
  logSuccess('Auth module exports properly configured')
  return true
}

// Test 5: Test TypeScript compilation
async function testTypeScript() {
  logInfo('Testing TypeScript compilation...')
  
  try {
    const { execSync } = await import('child_process')
    execSync('npx tsc --noEmit', { 
      cwd: WORKSPACE_ROOT,
      stdio: 'pipe'
    })
    logSuccess('TypeScript compilation successful')
    return true
  } catch (error) {
    logError('TypeScript compilation failed')
    console.log(error.stdout?.toString())
    return false
  }
}

// Test 6: Verify environment variables setup
async function testEnvironmentSetup() {
  logInfo('Testing environment configuration...')
  
  const envPath = path.join(WORKSPACE_ROOT, '.env.local')
  
  if (!await fileExists(envPath)) {
    logError('Environment file not found: .env.local')
    return false
  }
  
  const content = await readFileContent(envPath)
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  for (const varName of requiredVars) {
    if (!content.includes(varName)) {
      logError(`Missing environment variable: ${varName}`)
      return false
    }
  }
  
  logSuccess('Environment variables properly configured')
  return true
}

// Main verification function
async function main() {
  log(`${colors.bold}Task 12 Verification: Supabase Auth Configuration${colors.reset}`)
  log('=' .repeat(60))
  
  const tests = [
    { name: 'Auth Configuration', fn: testAuthConfig },
    { name: 'Auth API Routes', fn: testAuthRoutes },
    { name: 'Auth Error Pages', fn: testAuthPages },
    { name: 'Auth Module Exports', fn: testAuthExports },
    { name: 'TypeScript Compilation', fn: testTypeScript },
    { name: 'Environment Setup', fn: testEnvironmentSetup }
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  for (const test of tests) {
    try {
      const passed = await test.fn()
      if (passed) {
        passedTests++
      }
    } catch (error) {
      logError(`Test "${test.name}" failed with error: ${error.message}`)
    }
    console.log() // Add spacing between tests
  }
  
  // Summary
  log('=' .repeat(60))
  log(`${colors.bold}VERIFICATION SUMMARY${colors.reset}`)
  log(`Tests passed: ${passedTests}/${totalTests}`)
  
  if (passedTests === totalTests) {
    logSuccess('✨ All tests passed! Task 12 implementation is complete and functional.')
    logInfo('Ready to proceed to Task 13: Create Authentication Context and Hooks')
  } else {
    logError(`❌ ${totalTests - passedTests} test(s) failed. Please fix the issues before proceeding.`)
    process.exit(1)
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  logError(`Unhandled error: ${error.message}`)
  process.exit(1)
})

// Run the verification
main().catch((error) => {
  logError(`Verification failed: ${error.message}`)
  process.exit(1)
})
