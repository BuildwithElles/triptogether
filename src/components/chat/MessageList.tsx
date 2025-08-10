'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ChatMessageSkeleton, ListSkeleton } from '@/components/common/SkeletonComponents';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Reply, 
  Download,
  Image as ImageIcon,
  File as FileIcon,
  Check,
  CheckCheck,
  MessageCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onEditMessage: (messageId: string, content: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onReplyToMessage: (message: Message) => void;
  getDisplayName: (user: { id: string; email: string } | null) => string;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  onReplyToMessage,
  getDisplayName,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldScrollToBottom]);

  // Handle scroll behavior - only auto-scroll if user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldScrollToBottom(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Format message timestamp
  const formatMessageTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  }, []);

  // Handle edit message
  const handleEditSubmit = useCallback(async (messageId: string) => {
    if (!editContent.trim() || editContent === messages.find(m => m.id === messageId)?.content) {
      setEditingMessageId(null);
      setEditContent('');
      return;
    }

    try {
      await onEditMessage(messageId, editContent.trim());
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, [editContent, messages, onEditMessage]);

  // Start editing a message
  const startEditing = useCallback((message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
    setEditContent('');
  }, []);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  // Format date header
  const formatDateHeader = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  }, []);

  // Render file attachment
  const renderFileAttachment = useCallback((message: Message) => {
    if (!message.file_url) return null;

    const isImage = message.message_type === 'image';
    
    return (
      <div className="mt-2">
        {isImage ? (
          <div className="relative max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.file_url}
              alt="Shared image"
              className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.file_url!, '_blank')}
            />
          </div>
        ) : (
          <Card className="p-3 bg-muted/50 max-w-sm">
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.file_url.split('/').pop() || 'File attachment'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(message.file_url!, '_blank')}
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }, []);

  // Render individual message
  const renderMessage = useCallback((message: Message) => {
    const isOwnMessage = message.user_id === currentUserId;
    const isEditing = editingMessageId === message.id;
    const isEdited = message.updated_at !== message.created_at;

    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {getDisplayName(message.user)?.charAt(0) || '?'}
            </span>
          </div>
        </div>

        {/* Message content */}
        <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* User name and timestamp */}
          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-sm font-medium text-foreground">
              {getDisplayName(message.user)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.created_at)}
              {isEdited && (
                <span className="ml-1 italic">(edited)</span>
              )}
            </span>
          </div>

          {/* Reply indicator */}
          {message.reply_to_message && (
            <Card className={`p-2 mb-2 bg-muted/30 border-l-2 border-l-muted-foreground max-w-full ${
              isOwnMessage ? 'ml-8' : 'mr-8'
            }`}>
              <div className="text-xs text-muted-foreground mb-1">
                Replying to {getDisplayName(message.reply_to_message.user)}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {message.reply_to_message.content}
              </p>
            </Card>
          )}

          {/* Message bubble */}
          <Card className={`p-3 relative group ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground ml-8' 
              : 'bg-background mr-8'
          }`}>
            {/* Message content */}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] text-sm"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditSubmit(message.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                
                {/* File attachment */}
                {renderFileAttachment(message)}

                {/* Message actions */}
                <div className={`absolute top-2 ${isOwnMessage ? 'left-2' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isOwnMessage ? 'start' : 'end'}>
                      <DropdownMenuItem onClick={() => onReplyToMessage(message)}>
                        <Reply className="h-3 w-3 mr-2" />
                        Reply
                      </DropdownMenuItem>
                      
                      {isOwnMessage && (
                        <>
                          <DropdownMenuItem onClick={() => startEditing(message)}>
                            <Edit2 className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Message</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this message? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteMessage(message.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    );
  }, [
    currentUserId,
    editingMessageId,
    editContent,
    formatMessageTime,
    getDisplayName,
    renderFileAttachment,
    handleEditSubmit,
    cancelEditing,
    startEditing,
    onReplyToMessage,
    onDeleteMessage
  ]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <ListSkeleton 
          itemCount={8}
          renderItem={() => <ChatMessageSkeleton />}
        />
      </div>
    );
  }

  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="No messages yet"
          description="Start the conversation by sending the first message!"
          icon={MessageCircle}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Load more button */}
      {hasMore && (
        <div className="p-4 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Loading more messages...
              </>
            ) : (
              'Load more messages'
            )}
          </Button>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center justify-center mb-4">
              <Badge variant="secondary" className="text-xs">
                {formatDateHeader(date)}
              </Badge>
            </div>

            {/* Messages for this date */}
            <div className="space-y-4">
              {dateMessages.map(renderMessage)}
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!shouldScrollToBottom && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShouldScrollToBottom(true);
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-full h-10 w-10 p-0 shadow-lg"
          >
            ↓
          </Button>
        </div>
      )}
    </div>
  );
}