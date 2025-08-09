'use client'

import React, { useState } from 'react'
import { useAuth } from '../../lib/hooks/useAuth'
import { signupSchema, type SignupFormData, getPasswordStrength } from '../../lib/utils/validation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

interface SignupFormProps {
  onSuccess?: () => void
  redirectAfterSignup?: boolean
}

export function SignupForm({ onSuccess, redirectAfterSignup = true }: SignupFormProps) {
  const { signUp, loading, error: authError } = useAuth()
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)

  const passwordStrength = getPasswordStrength(formData.password)

  const handleInputChange = (field: keyof SignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Show password strength when user starts typing password
    if (field === 'password') {
      setShowPasswordStrength(value.length > 0)
    }
  }

  const validateForm = (): boolean => {
    try {
      signupSchema.parse(formData)
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
      const result = await signUp(formData.email, formData.password, formData.name)
      
      if (result.error) {
        setErrors({ general: result.error })
      } else {
        // Success
        if (onSuccess) {
          onSuccess()
        }
        // Navigation will be handled by useAuth hook if redirectAfterSignup is true
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = loading || isSubmitting

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500'
    if (score <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Weak'
    if (score <= 3) return 'Medium'
    return 'Strong'
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Join TripTogether and start planning amazing trips
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

          {/* Name field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="Enter your full name"
              disabled={isLoading}
              className={errors.name ? 'border-red-500' : ''}
              data-testid="name-input"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

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
              placeholder="Create a password"
              disabled={isLoading}
              className={errors.password ? 'border-red-500' : ''}
              data-testid="password-input"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
            
            {/* Password strength indicator */}
            {showPasswordStrength && formData.password && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {getPasswordStrengthText(passwordStrength.score)}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <li key={index}>• {feedback}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              placeholder="Confirm your password"
              disabled={isLoading}
              className={errors.confirmPassword ? 'border-red-500' : ''}
              data-testid="confirm-password-input"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            data-testid="signup-button"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>

          {/* Terms notice */}
          <p className="text-xs text-gray-600 text-center">
            By creating an account, you agree to our{' '}
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => {
                // TODO: Show terms of service
                alert('Terms of service will be implemented in a future task')
              }}
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              className="text-blue-600 hover:underline"
              onClick={() => {
                // TODO: Show privacy policy
                alert('Privacy policy will be implemented in a future task')
              }}
            >
              Privacy Policy
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}