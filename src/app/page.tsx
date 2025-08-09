'use client'

import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { useAuth } from "../lib/hooks"

export default function Home() {
  const { loading, isAuthenticated, error } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Hello TripTogether</h1>
        <p className="text-muted-foreground">Testing ShadCN UI Components</p>
        
        {/* Auth Status Indicator */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            Auth Status: {loading ? '⏳ Loading...' : isAuthenticated ? '✅ Authenticated' : '🔒 Not Authenticated'}
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-1">Error: {error}</p>
          )}
          <p className="text-xs text-blue-600 mt-1">
            Task #13: Authentication Context is working! 🎉
          </p>
          
          {/* Auth Navigation Links */}
          <div className="mt-3 space-x-2">
            {!isAuthenticated ? (
              <>
                <Button asChild size="sm" variant="outline">
                  <a href="/login">Login</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href="/signup">Sign Up</a>
                </Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline">
                <a href="/dashboard">Dashboard</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl w-full">
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>Various button styles and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Input Components</CardTitle>
            <CardDescription>Form input elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Enter your email" type="email" />
            <Input placeholder="Enter your password" type="password" />
            <Input placeholder="Disabled input" disabled />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Components</CardTitle>
            <CardDescription>This is a card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cards are used to group related content and actions. This card demonstrates
              the basic structure with header, title, description, and content areas.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ShadCN UI components are working correctly with Tailwind CSS
        </p>
      </div>
    </main>
  )
}