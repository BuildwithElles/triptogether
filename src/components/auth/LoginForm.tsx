'use client'

import React, { useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { loginSchema, type LoginFormData } from '../../lib/utils/validation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface LoginFormProps {
  onSuccess?: () => void
  redirectAfterLogin?: boolean
}

export function LoginForm({ onSuccess, redirectAfterLogin = true }: LoginFormProps) {
  const { signIn, loading, error: authError } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {}
      if (error.issues) {
        error.issues.forEach((issue: any) => {
          const path = issue.path.join('.')
          if (path) {
            fieldErrors[path] = issue.message
          }
        })
      }
      setErrors(fieldErrors)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await signIn(formData.email, formData.password)
      
      if (result.error) {
        setErrors({ general: result.error })
      } else {
        // Success
        if (onSuccess) {
          onSuccess()
        }
        // Navigation will be handled by useAuth hook if redirectAfterLogin is true
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = loading || isSubmitting

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your TripTogether account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General error message */}
          {(errors.general || authError) && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errors.general || authError}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="Enter your email"
              disabled={isLoading}
              className={errors.email ? 'border-red-500' : ''}
              data-testid="email-input"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="Enter your password"
              disabled={isLoading}
              className={errors.password ? 'border-red-500' : ''}
              data-testid="password-input"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            data-testid="login-button"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          {/* Forgot password link */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() => {
                // TODO: Implement forgot password functionality
                alert('Forgot password functionality will be implemented in a future task')
              }}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}