import { NextResponse } from 'next/server';
import { testServerConnection, testAdminConnection } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Test both regular server connection and admin connection
    const serverConnected = await testServerConnection();
    const adminConnected = await testAdminConnection();

    return NextResponse.json({
      success: true,
      connections: {
        server: serverConnected,
        admin: adminConnected
      },
      message: 'Supabase connection test completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connection test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
