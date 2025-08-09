'use client'

import { useAuth } from '../../lib/hooks'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

export default function AuthTest() {
  const {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    getUserDisplayName,
    getUserEmail,
    signOut
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading authentication state...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Authentication Context Test</h1>
        <p className="text-muted-foreground">Testing Task #13 - Auth Context and Hooks</p>
      </div>

      <div className="grid gap-6 max-w-4xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Authentication State</CardTitle>
            <CardDescription>Current auth state from useAuth hook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
              </div>
              <div>
                <strong>User ID:</strong> {user?.id || 'None'}
              </div>
              <div>
                <strong>Email:</strong> {getUserEmail() || 'None'}
              </div>
              <div>
                <strong>Display Name:</strong> {getUserDisplayName()}
              </div>
              <div>
                <strong>Session:</strong> {session ? '✅ Active' : '❌ None'}
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Actions</CardTitle>
            <CardDescription>Test auth methods from useAuth hook</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-green-600">
                  ✅ User is authenticated! Auth context is working correctly.
                </p>
                <Button 
                  onClick={signOut}
                  variant="outline"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-blue-600">
                  ℹ️ User is not authenticated. The auth context is ready for login/signup.
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline" disabled>
                    Login (Form not created yet)
                  </Button>
                  <Button variant="outline" disabled>
                    Signup (Form not created yet)
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Data</CardTitle>
            <CardDescription>Raw user and session data from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong className="block mb-2">User Object:</strong>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                  {user ? JSON.stringify(user, null, 2) : 'null'}
                </pre>
              </div>
              <div>
                <strong className="block mb-2">Session Object:</strong>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                  {session ? JSON.stringify(session, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Authentication Context is successfully integrated and working!
        </p>
      </div>
    </main>
  )
}
