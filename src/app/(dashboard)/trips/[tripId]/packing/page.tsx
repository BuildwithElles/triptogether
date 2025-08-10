import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PackingPageClient } from './PackingPageClient'

interface PackingPageProps {
  params: {
    tripId: string
  }
}

export default function PackingPage({ params }: PackingPageProps) {
  return (
    <ProtectedRoute>
      <PackingPageClient tripId={params.tripId} />
    </ProtectedRoute>
  )
}
