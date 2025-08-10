'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, X, Reply, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, replyTo?: string) => Promise<void>;
  onSendFile?: (file: File, content: string) => Promise<void>;
  replyingTo?: {
    id: string;
    content: string;
    user: {
      id: string;
      email: string;
    } | null;
  } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  enableFileUpload?: boolean;
}

export function MessageInput({
  onSendMessage,
  onSendFile,
  replyingTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 2000,
  enableFileUpload = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get display name for user
  const getDisplayName = useCallback((user: { id: string; email: string } | null) => {
    if (!user) return 'Unknown User';
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }, []);

  // Validate message content
  const validateMessage = useCallback((messageContent: string): { isValid: boolean; error?: string } => {
    if (!messageContent.trim() && !selectedFile) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    
    if (messageContent.length > maxLength) {
      return { isValid: false, error: `Message too long (${messageContent.length}/${maxLength} characters)` };
    }
    
    return { isValid: true };
  }, [maxLength, selectedFile]);

  // Handle sending message
  const handleSend = useCallback(async () => {
    if (isLoading) return;

    const validation = validateMessage(content);
    if (!validation.isValid) {
      // Show validation error - could be enhanced with toast notifications
      console.warn('Message validation failed:', validation.error);
      return;
    }

    setIsLoading(true);
    try {
      if (selectedFile && onSendFile) {
        // Send file with optional message
        await onSendFile(selectedFile, content.trim());
      } else {
        // Send text message
        await onSendMessage(content.trim(), replyingTo?.id);
      }
      
      // Clear form
      setContent('');
      setSelectedFile(null);
      onCancelReply?.();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Error handling will be managed by parent component
    } finally {
      setIsLoading(false);
    }
  }, [content, selectedFile, isLoading, onSendMessage, onSendFile, replyingTo?.id, onCancelReply, validateMessage]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type (images and common documents)
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'text/plain', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert('File type not supported. Please upload images, PDFs, or documents.');
        return;
      }

      setSelectedFile(file);
    }
  }, []);

  // Remove selected file
  const removeFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Auto-resize textarea
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setContent(value);
      
      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [maxLength]);

  const canSend = (content.trim() || selectedFile) && !isLoading && !disabled;
  const remainingChars = maxLength - content.length;

  return (
    <div className="space-y-2">
      {/* Reply indicator */}
      {replyingTo && (
        <Card className="p-3 bg-muted/50 border-l-4 border-l-primary">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Reply className="h-3 w-3" />
                <span>Replying to {getDisplayName(replyingTo.user)}</span>
              </div>
              <p className="text-sm truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      )}

      {/* Selected file indicator */}
      {selectedFile && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {selectedFile.name}
              </span>
              <span className="text-xs text-blue-600">
                ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      )}

      {/* Message input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="min-h-[44px] max-h-[120px] resize-none pr-12"
            rows={1}
          />
          
          {/* Character counter */}
          {content.length > maxLength * 0.8 && (
            <div className={`absolute bottom-2 right-2 text-xs ${
              remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {remainingChars}
            </div>
          )}
        </div>

        {/* File upload button */}
        {enableFileUpload && onSendFile && (
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              className="h-[44px] w-[44px] p-0"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.txt,.doc,.docx"
            />
          </div>
        )}

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="sm"
          className="h-[44px] w-[44px] p-0"
          title="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Input helpers */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {remainingChars < 100 && (
          <span className={remainingChars < 0 ? 'text-destructive' : ''}>
            {remainingChars} characters remaining
          </span>
        )}
      </div>
    </div>
  );
}