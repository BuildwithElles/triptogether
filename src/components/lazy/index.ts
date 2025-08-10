/**
 * Lazy-loaded components for performance optimization
 */

import { lazy } from 'react';

// Trip feature components - lazy loaded for better performance
export const LazyOutfitPlanner = lazy(() => 
  import('@/components/outfits/OutfitPlanner').then(module => ({ default: module.OutfitPlanner }))
);

export const LazyPhotoGallery = lazy(() => 
  import('@/components/gallery/PhotoGallery').then(module => ({ default: module.PhotoGallery }))
);

export const LazyChatRoom = lazy(() => 
  import('@/components/chat/ChatRoom').then(module => ({ default: module.ChatRoom }))
);

export const LazyBudgetTracker = lazy(() => 
  import('@/components/budget/BudgetTracker').then(module => ({ default: module.BudgetTracker }))
);

export const LazyPackingList = lazy(() => 
  import('@/components/packing/PackingList').then(module => ({ default: module.PackingList }))
);

// Admin components - lazy loaded since they're used less frequently
export const LazyInviteLink = lazy(() => 
  import('@/components/trip/InviteLink').then(module => ({ default: module.InviteLink }))
);

// Form components - lazy loaded for better initial page load
export const LazyAddItineraryItem = lazy(() => 
  import('@/components/itinerary/AddItineraryItem').then(module => ({ default: module.AddItineraryItem }))
);

export const LazyAddExpense = lazy(() => 
  import('@/components/budget/AddExpense').then(module => ({ default: module.AddExpense }))
);

export const LazyAddPackingItem = lazy(() => 
  import('@/components/packing/AddPackingItem').then(module => ({ default: module.AddPackingItem }))
);

export const LazyAddOutfit = lazy(() => 
  import('@/components/outfits/AddOutfit').then(module => ({ default: module.AddOutfit }))
);

export const LazyPhotoUpload = lazy(() => 
  import('@/components/gallery/PhotoUpload').then(module => ({ default: module.PhotoUpload }))
);
