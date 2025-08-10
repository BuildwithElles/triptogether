'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useChat } from '@/lib/hooks/useChat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MessageCircle, Users, Wifi, WifiOff } from 'lucide-react';
import { uploadTripPhoto } from '@/lib/utils/storage';

interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'location';
  file_url?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  reply_to?: string | null;
  user: {
    id: string;
    email: string;
  } | null;
  reply_to_message?: {
    id: string;
    content: string;
    user: {
      id: string;
      email: string;
    } | null;
  } | null;
}

interface ChatRoomProps {
  tripId: string;
  tripTitle?: string;
  memberCount?: number;
}

export function ChatRoom({ tripId, tripTitle, memberCount }: ChatRoomProps) {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const {
    messages,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
    loadMoreMessages,
    getDisplayName,
  } = useChat(tripId, {
    limit: 50,
    enableRealtime: true,
  });

  // Handle sending text message
  const handleSendMessage = useCallback(async (content: string, replyTo?: string) => {
    try {
      await createMessage({
        content,
        message_type: 'text',
        reply_to: replyTo,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [createMessage]);

  // Handle sending file
  const handleSendFile = useCallback(async (file: File, content: string) => {
    try {
      // Upload file to storage
      const uploadResult = await uploadTripPhoto(file, tripId, user.id);
      
      if (!uploadResult.success || !uploadResult.fileUrl) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }
      
      const fileUrl = uploadResult.fileUrl;
      
      // Determine message type based on file
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      
      // Create message with file
      await createMessage({
        content: content || `Shared ${messageType === 'image' ? 'an image' : 'a file'}: ${file.name}`,
        message_type: messageType,
        file_url: fileUrl,
      });
    } catch (error) {
      console.error('Error sending file:', error);
      throw error;
    }
  }, [createMessage, tripId, user.id]);

  // Handle editing message
  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await updateMessage(messageId, { content });
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }, [updateMessage]);

  // Handle deleting message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [deleteMessage]);

  // Handle reply to message
  const handleReplyToMessage = useCallback((message: Message) => {
    setReplyingTo(message);
  }, []);

  // Cancel reply
  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Monitor online status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  if (!user) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground">Please log in to access chat</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <p className="text-destructive">Failed to load chat</p>
            <p className="text-sm text-muted-foreground">
              {error.message || 'An error occurred while loading messages'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat header */}
      <CardHeader className="pb-3">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg truncate">
              {tripTitle ? `${tripTitle} Chat` : 'Trip Chat'}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Online status */}
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs text-muted-foreground hidden xs:inline">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Member count */}
            {memberCount && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">
                  {memberCount}
                </Badge>
              </div>
            )}

            {/* Message count */}
            <Badge variant="outline" className="text-xs">
              {total} messages
            </Badge>
          </div>
        </div>

        {/* Connection status warning */}
        {!isOnline && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              <WifiOff className="h-3 w-3 mr-1" />
              You&apos;re offline. Messages will sync when connection is restored.
            </Badge>
          </div>
        )}
      </CardHeader>

      {/* Chat content */}
      <CardContent className="flex-1 flex flex-col p-0 relative">
        {/* Messages list */}
        <MessageList
          messages={messages}
          currentUserId={user.id}
          isLoading={isLoading}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMoreMessages}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReplyToMessage={handleReplyToMessage}
          getDisplayName={getDisplayName}
        />

        {/* Message input */}
        <div className="border-t p-3 sm:p-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            disabled={!isOnline}
            placeholder={isOnline ? 'Type your message...' : 'You&apos;re offline. Connect to send messages.'}
            enableFileUpload={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}