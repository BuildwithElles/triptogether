'use client';

import useSWR from 'swr';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Database } from '@/lib/types/database';

type Message = Database['public']['Tables']['messages']['Row'] & {
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
};

type CreateMessageData = {
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system' | 'location';
  file_url?: string;
  reply_to?: string;
};

type UpdateMessageData = {
  content: string;
};

interface ChatResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

interface UseChatOptions {
  limit?: number;
  enableRealtime?: boolean;
}

export function useChat(tripId: string, options: UseChatOptions = {}) {
  const { user } = useAuth();
  const { limit = 50, enableRealtime = true } = options;
  const [offset, setOffset] = useState(0);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch messages with SWR
  const { data, error, isLoading, mutate } = useSWR<ChatResponse>(
    user ? `/api/trips/${tripId}/chat?limit=${limit}&offset=${offset}` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Update all messages when new data arrives
  useEffect(() => {
    if (data?.messages) {
      if (offset === 0) {
        // Fresh load - replace all messages
        setAllMessages(data.messages.reverse()); // Reverse to show newest at bottom
      } else {
        // Loading more - prepend older messages
        setAllMessages(prev => [...data.messages.reverse(), ...prev]);
      }
    }
  }, [data, offset]);

  // Set up realtime subscription
  useEffect(() => {
    if (!enableRealtime || !user || !tripId) return;

    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `trip_id=eq.${tripId}`,
        },
        async (payload) => {
          // Fetch the complete message with user info
          const { data: newMessage, error } = await supabase
            .from('messages')
            .select(`
              *,
              user:user_id (
                id,
                email
              ),
              reply_to_message:reply_to (
                id,
                content,
                user:user_id (
                  id,
                  email
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && newMessage) {
            setAllMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `trip_id=eq.${tripId}`,
        },
        async (payload) => {
          // Fetch the updated message with user info
          const { data: updatedMessage, error } = await supabase
            .from('messages')
            .select(`
              *,
              user:user_id (
                id,
                email
              ),
              reply_to_message:reply_to (
                id,
                content,
                user:user_id (
                  id,
                  email
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && updatedMessage) {
            setAllMessages(prev =>
              prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          setAllMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, user, enableRealtime]);

  // Create a new message with optimistic updates
  const createMessage = useCallback(async (messageData: CreateMessageData) => {
    if (!user) throw new Error('Authentication required');

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      trip_id: tripId,
      user_id: user.id,
      content: messageData.content,
      message_type: messageData.message_type || 'text',
      reply_to: messageData.reply_to || null,
      attachments: messageData.file_url ? [{ file_url: messageData.file_url }] : [],
      is_edited: false,
      edited_at: null,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email || ''
      },
      reply_to_message: null
    };

    try {
      // Optimistically add message to local state
      setAllMessages(prev => [...prev, optimisticMessage]);

      const response = await fetch(`/api/trips/${tripId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const newMessage = await response.json();
      
      // Replace optimistic message with real message
      setAllMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id ? newMessage : msg
        )
      );
      
      return newMessage;

    } catch (error) {
      console.error('Error creating message:', error);
      
      // Remove optimistic message on error
      setAllMessages(prev => 
        prev.filter(msg => msg.id !== optimisticMessage.id)
      );
      
      throw error;
    }
  }, [tripId, user]);

  // Update a message
  const updateMessage = useCallback(async (messageId: string, messageData: UpdateMessageData) => {
    if (!user) throw new Error('Authentication required');

    try {
      const response = await fetch(`/api/trips/${tripId}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update message');
      }

      const updatedMessage = await response.json();
      
      // Update local state optimistically
      setAllMessages(prev =>
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );

      return updatedMessage;

    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  }, [tripId, user]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user) throw new Error('Authentication required');

    try {
      const response = await fetch(`/api/trips/${tripId}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete message');
      }

      // Remove from local state optimistically
      setAllMessages(prev => prev.filter(msg => msg.id !== messageId));

      return true;

    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [tripId, user]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!data?.hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const newOffset = allMessages.length;
      const response = await fetch(`/api/trips/${tripId}/chat?limit=${limit}&offset=${newOffset}`);
      
      if (!response.ok) {
        throw new Error('Failed to load more messages');
      }

      const olderMessages: ChatResponse = await response.json();
      
      if (olderMessages.messages.length > 0) {
        setAllMessages(prev => [...olderMessages.messages.reverse(), ...prev]);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [tripId, limit, allMessages.length, data?.hasMore, isLoadingMore]);

  // Refresh messages
  const refreshMessages = useCallback(() => {
    setOffset(0);
    setAllMessages([]);
    mutate();
  }, [mutate]);

  // Get display name for a user
  const getDisplayName = useCallback((user: { id: string; email: string } | null) => {
    if (!user) return 'Unknown User';
    
    // Extract name from email (before @) as fallback
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }, []);

  return {
    // Data
    messages: allMessages,
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    
    // Loading states
    isLoading: isLoading && offset === 0,
    isLoadingMore,
    error,
    
    // Actions
    createMessage,
    updateMessage,
    deleteMessage,
    loadMoreMessages,
    refreshMessages,
    
    // Utilities
    getDisplayName,
  };
}