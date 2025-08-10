// Task 25 Implementation Test Script
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('🧪 Testing Task 25: Create Basic Packing List Feature');
console.log('=====================================================\n');

// Test 1: File existence
console.log('1. Checking file existence...');
const requiredFiles = [
  'src/app/(dashboard)/trips/[tripId]/packing/page.tsx',
  'src/app/api/trips/[tripId]/packing/route.ts',
  'src/components/packing/PackingList.tsx',
  'src/components/packing/AddPackingItem.tsx',
  'src/lib/hooks/usePacking.ts'
];

for (const file of requiredFiles) {
  try {
    await fs.access(file);
    console.log(`✅ ${file} exists`);
  } catch (error) {
    console.log(`❌ ${file} missing`);
  }
}

// Test 2: TypeScript compilation
console.log('\n2. Testing TypeScript compilation...');
try {
  const { stdout, stderr } = await execAsync('npx tsc --noEmit');
  if (stderr && !stderr.includes('warning')) {
    console.log('❌ TypeScript compilation errors:');
    console.log(stderr);
  } else {
    console.log('✅ TypeScript compilation successful');
  }
} catch (error) {
  console.log('❌ TypeScript compilation failed:', error.message);
}

// Test 3: Check for required exports
console.log('\n3. Checking component exports...');
try {
  const packingIndexContent = await fs.readFile('src/components/packing/index.ts', 'utf-8');
  if (packingIndexContent.includes('PackingList') && packingIndexContent.includes('AddPackingItem')) {
    console.log('✅ Packing components properly exported');
  } else {
    console.log('❌ Packing components export issues');
  }
} catch (error) {
  console.log('❌ Cannot read packing index file');
}

// Test 4: API route structure
console.log('\n4. Checking API route structure...');
try {
  const apiRouteContent = await fs.readFile('src/app/api/trips/[tripId]/packing/route.ts', 'utf-8');
  const hasGET = apiRouteContent.includes('export async function GET');
  const hasPOST = apiRouteContent.includes('export async function POST');
  const hasPUT = apiRouteContent.includes('export async function PUT');
  const hasDELETE = apiRouteContent.includes('export async function DELETE');
  
  if (hasGET && hasPOST && hasPUT && hasDELETE) {
    console.log('✅ API route has all CRUD methods');
  } else {
    console.log('❌ API route missing CRUD methods');
    console.log(`GET: ${hasGET}, POST: ${hasPOST}, PUT: ${hasPUT}, DELETE: ${hasDELETE}`);
  }
} catch (error) {
  console.log('❌ Cannot read API route file');
}

// Test 5: Hook functionality check
console.log('\n5. Checking usePacking hook...');
try {
  const hookContent = await fs.readFile('src/lib/hooks/usePacking.ts', 'utf-8');
  const hasCreateFunction = hookContent.includes('createPackingItem');
  const hasUpdateFunction = hookContent.includes('updatePackingItem');
  const hasDeleteFunction = hookContent.includes('deletePackingItem');
  const hasToggleFunction = hookContent.includes('togglePackedStatus');
  
  if (hasCreateFunction && hasUpdateFunction && hasDeleteFunction && hasToggleFunction) {
    console.log('✅ usePacking hook has all required functions');
  } else {
    console.log('❌ usePacking hook missing functions');
  }
} catch (error) {
  console.log('❌ Cannot read usePacking hook file');
}

console.log('\n📊 Task 25 Implementation Test Complete');
console.log('=======================================');
