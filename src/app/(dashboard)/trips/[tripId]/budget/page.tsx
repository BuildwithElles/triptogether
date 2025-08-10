import { BudgetTracker } from '@/components/budget/BudgetTracker';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface BudgetPageProps {
  params: {
    tripId: string;
  };
}

export default function BudgetPage({ params }: BudgetPageProps) {
  const { tripId } = params;

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-3 sm:px-4 py-4 lg:py-6 max-w-6xl">
        <div className="mb-4 lg:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Budget & Expenses</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track trip expenses and manage budget splitting with your travel companions
          </p>
        </div>
        
        <BudgetTracker tripId={tripId} />
      </div>
    </ProtectedRoute>
  );
}
