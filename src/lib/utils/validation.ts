/**
 * Form validation utilities for TripTogether application
 * 
 * This file contains validation functions and schemas for forms throughout the app,
 * including authentication forms, trip forms, and other user input validation.
 */

import { z } from 'zod'

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must be less than 100 characters')

// Name validation schema
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

// Signup form validation schema
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Trip validation schemas (for future use)
export const tripTitleSchema = z
  .string()
  .min(3, 'Trip title must be at least 3 characters long')
  .max(100, 'Trip title must be less than 100 characters')

export const tripDescriptionSchema = z
  .string()
  .max(500, 'Trip description must be less than 500 characters')
  .optional()

export const tripDestinationSchema = z
  .string()
  .min(2, 'Destination must be at least 2 characters long')
  .max(100, 'Destination must be less than 100 characters')

// Reset password validation schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
})

// Change password validation schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
})

// Profile update validation schema
export const profileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
})

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>

// Validation helper functions
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  try {
    emailSchema.parse(email)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0]?.message }
    }
    return { isValid: false, error: 'Invalid email' }
  }
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  try {
    passwordSchema.parse(password)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0]?.message }
    }
    return { isValid: false, error: 'Invalid password' }
  }
}

export function validateName(name: string): { isValid: boolean; error?: string } {
  try {
    nameSchema.parse(name)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0]?.message }
    }
    return { isValid: false, error: 'Invalid name' }
  }
}

// Generic form validation helper
export function validateForm<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { isValid: boolean; data?: T; errors?: Record<string, string> } {
  try {
    const validatedData = schema.parse(data)
    return { isValid: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        if (path) {
          errors[path] = issue.message
        }
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

// Password strength checker
export function getPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include at least one uppercase letter')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include at least one lowercase letter')
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Include at least one number')
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('Include at least one special character')
  }

  return { score, feedback }
}

// Common validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long',
  PASSWORDS_DONT_MATCH: "Passwords don't match",
  NAME_TOO_SHORT: 'Name must be at least 2 characters long',
  NAME_INVALID_CHARS: 'Name can only contain letters, spaces, hyphens, and apostrophes',
  FIELD_TOO_LONG: 'This field is too long',
} as const
