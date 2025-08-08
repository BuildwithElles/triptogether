/**
 * Application constants and configuration
 * These values are derived from environment variables and provide type-safe access
 */

// App Configuration
export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'TripTogether',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  description: 'Collaborative trip planning made easy',
} as const;

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB default
  allowedFileTypes: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
  maxFilesPerUpload: 10,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
} as const;

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
} as const;

// Database Table Names
export const TABLES = {
  trips: 'trips',
  tripUsers: 'trip_users',
  inviteTokens: 'invite_tokens',
  itineraryItems: 'itinerary_items',
  budgetItems: 'budget_items',
  budgetSplits: 'budget_splits',
  packingItems: 'packing_items',
  outfits: 'outfits',
  messages: 'messages',
  photos: 'photos',
} as const;

// Storage Bucket Names
export const STORAGE_BUCKETS = {
  tripPhotos: 'trip-photos',
  userAvatars: 'user-avatars',
  outfitImages: 'outfit-images',
} as const;

// User Roles
export const USER_ROLES = {
  admin: 'admin',
  guest: 'guest',
} as const;

// RSVP Status
export const RSVP_STATUS = {
  pending: 'pending',
  accepted: 'accepted',
  declined: 'declined',
} as const;

// Trip Categories
export const TRIP_CATEGORIES = {
  vacation: 'vacation',
  business: 'business',
  adventure: 'adventure',
  family: 'family',
  friends: 'friends',
  solo: 'solo',
} as const;

// Itinerary Categories
export const ITINERARY_CATEGORIES = {
  activity: 'activity',
  accommodation: 'accommodation',
  transport: 'transport',
  dining: 'dining',
  sightseeing: 'sightseeing',
  meeting: 'meeting',
} as const;

// Budget Categories
export const BUDGET_CATEGORIES = {
  accommodation: 'accommodation',
  transport: 'transport',
  food: 'food',
  activities: 'activities',
  shopping: 'shopping',
  general: 'general',
} as const;

// Packing Categories
export const PACKING_CATEGORIES = {
  clothes: 'clothes',
  toiletries: 'toiletries',
  electronics: 'electronics',
  documents: 'documents',
  medications: 'medications',
  general: 'general',
} as const;

// Split Types for Budget
export const SPLIT_TYPES = {
  equal: 'equal',
  custom: 'custom',
  percentage: 'percentage',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  text: 'text',
  image: 'image',
  file: 'file',
} as const;

// Validation Constants
export const VALIDATION = {
  minPasswordLength: 8,
  maxTripTitleLength: 255,
  maxDescriptionLength: 1000,
  maxMessageLength: 2000,
  minTripDuration: 1, // days
  maxTripDuration: 365, // days
} as const;

// Date Formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  datetime: 'MMM dd, yyyy HH:mm',
  time: 'HH:mm',
} as const;

// Currency Configuration
export const CURRENCY_CONFIG = {
  default: 'USD',
  supported: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
} as const;