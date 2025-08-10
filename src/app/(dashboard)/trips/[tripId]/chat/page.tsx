import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ChatRoom } from '@/components/chat/ChatRoom';

interface ChatPageProps {
  params: {
    tripId: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-4rem)] p-4">
        <ChatRoom tripId={params.tripId} />
      </div>
    </ProtectedRoute>
  );
}