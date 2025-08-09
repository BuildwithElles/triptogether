import { nanoid } from 'nanoid';

/**
 * Generate a secure invite token
 */
export function generateInviteToken(): string {
  return nanoid(32);
}

/**
 * Calculate expiration date based on days from now
 */
export function calculateExpirationDate(daysFromNow: number): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysFromNow);
  return expiresAt;
}

/**
 * Generate full invite URL from token
 */
export function generateInviteUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/invite/${token}`;
}

/**
 * Check if invite token is expired
 */
export function isInviteExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Check if invite has remaining uses
 */
export function hasRemainingUses(currentUses: number, maxUses: number): boolean {
  return currentUses < maxUses;
}

/**
 * Validate invite token format
 */
export function isValidTokenFormat(token: string): boolean {
  // Token should be 32 characters of alphanumeric and special characters
  return /^[A-Za-z0-9_-]{32}$/.test(token);
}

/**
 * Format invite expiration date for display
 */
export function formatExpirationDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time until expiration
 */
export function getTimeUntilExpiration(expiresAt: string): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour' : `${diffHours} hours`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
  } else {
    return 'Less than 1 minute';
  }
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Invite token status checker
 */
export function getInviteStatus(invite: {
  isActive: boolean;
  expiresAt: string;
  currentUses: number;
  maxUses: number;
}): 'active' | 'expired' | 'used-up' | 'inactive' {
  if (!invite.isActive) {
    return 'inactive';
  }
  
  if (isInviteExpired(invite.expiresAt)) {
    return 'expired';
  }
  
  if (!hasRemainingUses(invite.currentUses, invite.maxUses)) {
    return 'used-up';
  }
  
  return 'active';
}

/**
 * Get status badge color for invite status
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'expired':
      return 'destructive';
    case 'used-up':
      return 'secondary';
    case 'inactive':
      return 'outline';
    default:
      return 'outline';
  }
}
