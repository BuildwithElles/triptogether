'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

/**
 * Button component with built-in loading state
 * Shows spinner and optional loading text when loading
 */
export function LoadingButton({
  loading = false,
  loadingText,
  icon,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Button
      {...props}
      disabled={isDisabled}
      className={cn(className)}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
}

/**
 * Icon button variant with loading state
 */
export function LoadingIconButton({
  loading = false,
  icon,
  loadingIcon,
  className,
  ...props
}: Omit<LoadingButtonProps, 'children'> & {
  icon: React.ReactNode;
  loadingIcon?: React.ReactNode;
}) {
  return (
    <Button
      {...props}
      disabled={props.disabled || loading}
      className={cn('p-2', className)}
    >
      {loading ? (
        loadingIcon || <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
    </Button>
  );
}
