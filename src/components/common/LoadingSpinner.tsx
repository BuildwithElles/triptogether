'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  color?: 'primary' | 'secondary' | 'gray' | 'white';
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  variant = 'spinner',
  color = 'primary'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'border-blue-200 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    gray: 'border-gray-300 border-t-gray-600',
    white: 'border-white/30 border-t-white'
  };

  if (variant === 'spinner') {
    return (
      <div 
        className={`animate-spin rounded-full border-2 ${colorClasses[color]} ${sizeClasses[size]} ${className}`} 
        role="status"
        aria-label="Loading"
      />
    );
  }

  if (variant === 'dots') {
    const dotSize = {
      xs: 'h-1 w-1',
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-3 w-3',
      xl: 'h-4 w-4'
    };

    const dotColor = {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-600',
      gray: 'bg-gray-400',
      white: 'bg-white'
    };

    return (
      <div className={`flex space-x-1 ${className}`} role="status" aria-label="Loading">
        <div className={`${dotSize[size]} ${dotColor[color]} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
        <div className={`${dotSize[size]} ${dotColor[color]} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
        <div className={`${dotSize[size]} ${dotColor[color]} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  if (variant === 'pulse') {
    const pulseColor = {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-600',
      gray: 'bg-gray-400',
      white: 'bg-white'
    };

    return (
      <div 
        className={`${sizeClasses[size]} ${pulseColor[color]} rounded-full animate-pulse ${className}`}
        role="status"
        aria-label="Loading"
      />
    );
  }

  return null;
}

interface LoadingStateProps {
  message?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  color?: 'primary' | 'secondary' | 'gray' | 'white';
  className?: string;
  fullScreen?: boolean;
}

/**
 * Loading state component with message
 * Useful for showing loading states with descriptive text
 */
export function LoadingState({
  message = 'Loading...',
  size = 'lg',
  variant = 'spinner',
  color = 'primary',
  className = '',
  fullScreen = false
}: LoadingStateProps) {
  const containerClass = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size={size} variant={variant} color={color} />
        {message && (
          <p className="text-gray-600 text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'rectangular' | 'circular' | 'text';
}

/**
 * Skeleton loading component for content placeholders
 */
export function Skeleton({ 
  className = '', 
  width, 
  height, 
  variant = 'rectangular' 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading content"
    />
  );
}

interface InlineLoadingProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  text?: string;
}

/**
 * Inline loading component for buttons or small spaces
 */
export function InlineLoading({ 
  size = 'sm', 
  className = '', 
  text 
}: InlineLoadingProps) {
  return (
    <span className={`inline-flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} variant="spinner" />
      {text && <span className="text-sm">{text}</span>}
    </span>
  );
}