import { ProtectedRoute, TripProtectedRoute, AdminRoute } from '@/components/auth';
import { LoadingState, Skeleton } from '@/components/common';

export default function ProtectedRouteTestPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Protected Route Components Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Basic Protected Route Example */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Basic Protected Route</h2>
          <p className="text-gray-600">This content requires authentication:</p>
          <ProtectedRoute>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">✅ You are authenticated! This content is protected.</p>
            </div>
          </ProtectedRoute>
        </div>

        {/* Loading States Examples */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Loading States</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-2">Loading State Component:</p>
              <LoadingState message="Checking permissions..." size="md" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Skeleton Placeholders:</p>
              <div className="space-y-2">
                <Skeleton width="100%" height="20px" variant="text" />
                <Skeleton width="80%" height="20px" variant="text" />
                <Skeleton width="60%" height="20px" variant="text" />
              </div>
            </div>
          </div>
        </div>

        {/* Trip Protected Route Example */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Trip Protected Route</h2>
          <p className="text-gray-600">Example with a test trip ID:</p>
          <TripProtectedRoute tripId="test-trip-id" requireRole="member">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800">✅ You have access to this trip!</p>
            </div>
          </TripProtectedRoute>
        </div>

        {/* Admin Route Example */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Admin Route</h2>
          <p className="text-gray-600">This content requires admin privileges:</p>
          <AdminRoute>
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <p className="text-purple-800">✅ You have admin access!</p>
            </div>
          </AdminRoute>
        </div>

        {/* Permissions Information */}
        <div className="border rounded-lg p-6 space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800">How Protected Routes Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">ProtectedRoute</h3>
              <p className="text-gray-600">Basic authentication protection. Redirects to login if not authenticated.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">TripProtectedRoute</h3>
              <p className="text-gray-600">Checks trip membership and role. Ensures user has access to specific trip data.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">AdminRoute</h3>
              <p className="text-gray-600">Requires admin privileges. Can be customized with different admin checks.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
