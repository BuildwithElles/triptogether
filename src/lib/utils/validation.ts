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

// Trip validation schemas
export const tripTitleSchema = z
  .string()
  .min(3, 'Trip title must be at least 3 characters long')
  .max(200, 'Trip title must be less than 200 characters')

export const tripDescriptionSchema = z
  .string()
  .max(500, 'Trip description must be less than 500 characters')
  .optional()

export const tripDestinationSchema = z
  .string()
  .min(2, 'Destination must be at least 2 characters long')
  .max(200, 'Destination must be less than 200 characters')

// Trip creation form validation schema
export const createTripSchema = z.object({
  title: tripTitleSchema,
  description: tripDescriptionSchema,
  destination: tripDestinationSchema,
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budgetTotal: z.string().optional(),
  maxMembers: z.string().optional(),
  isPublic: z.boolean(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  }
  return true;
}, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
}).refine((data) => {
  if (data.budgetTotal && data.budgetTotal.trim()) {
    const budget = Number(data.budgetTotal);
    return !isNaN(budget) && budget >= 0;
  }
  return true;
}, {
  message: 'Budget must be a positive number',
  path: ['budgetTotal'],
}).refine((data) => {
  if (data.maxMembers && data.maxMembers.trim()) {
    const maxMembers = Number(data.maxMembers);
    return !isNaN(maxMembers) && maxMembers >= 1 && maxMembers <= 100;
  }
  return true;
}, {
  message: 'Max members must be between 1 and 100',
  path: ['maxMembers'],
})

// Itinerary validation schemas
export const itineraryItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  location: z.string().max(255, 'Location must be less than 255 characters').optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
})

// Budget/Expense validation schemas
export const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount is too large'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  category: z.string().min(1, 'Category is required'),
  split_type: z.enum(['equal', 'custom', 'percentage']),
  is_paid: z.boolean(),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  paid_by: z.string().optional(),
})

// Packing list validation schemas
export const packingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Item name too long'),
  category: z.enum(['clothing', 'toiletries', 'electronics', 'documents', 'medication', 'accessories', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(999, 'Quantity too large'),
  notes: z.string().max(500, 'Notes too long').optional(),
})

// Chat message validation schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  replyTo: z.string().optional(),
})

// Outfit validation schemas
export const clothingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Item name too long'),
  type: z.enum(['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory']),
  color: z.string().max(50, 'Color name too long').optional(),
  brand: z.string().max(100, 'Brand name too long').optional(),
  notes: z.string().max(200, 'Notes too long').optional(),
})

export const outfitSchema = z.object({
  name: z.string().min(1, 'Outfit name is required').max(100, 'Outfit name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  occasion: z.string().min(1, 'Occasion is required'),
  weather: z.string().optional(),
  date_planned: z.string().optional(),
  image_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  clothing_items: z.array(clothingItemSchema).optional(),
})

// Photo/Gallery validation schemas
export const photoUploadSchema = z.object({
  caption: z.string().max(500, 'Caption too long').optional(),
  album: z.string().max(100, 'Album name too long').optional(),
})

// File validation schema
export const fileValidationSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string().refine((type) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(type);
  }, 'File type not supported'),
})

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
export type CreateTripFormData = z.infer<typeof createTripSchema>
export type ItineraryItemFormData = z.infer<typeof itineraryItemSchema>
export type ExpenseFormData = z.infer<typeof expenseSchema>
export type PackingItemFormData = z.infer<typeof packingItemSchema>
export type MessageFormData = z.infer<typeof messageSchema>
export type ClothingItemFormData = z.infer<typeof clothingItemSchema>
export type OutfitFormData = z.infer<typeof outfitSchema>
export type PhotoUploadFormData = z.infer<typeof photoUploadSchema>
export type FileValidationData = z.infer<typeof fileValidationSchema>

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
