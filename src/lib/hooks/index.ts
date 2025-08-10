// Hooks barrel exports
export {
  useAuth,
  useAuthState,
  useAuthActions,
  useAuthNavigation,
  useAuthUser,
  type UseAuthReturn,
} from './useAuth'

export {
  useTrips,
  useCreateTrip,
} from './useTrips'

export {
  useItinerary,
  ITINERARY_CATEGORIES_LIST,
  type ItineraryCategory,
} from './useItinerary'

export {
  useBudget,
  type BudgetSummary,
  type BudgetResponse,
  type CreateBudgetItemData,
  type UpdateBudgetItemData,
  type TripMember,
} from './useBudget'

export {
  useChat,
} from './useChat'