'use client';

import React from 'react';
import { ChatMessageSkeleton } from '@/components/common/SkeletonComponents';
import { Skeleton } from '@/components/common/LoadingSpinner';

/**
 * Loading page for trip chat
 */
export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ChatMessageSkeleton key={i} />
        ))}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}
