'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  Copy, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Users, 
  Calendar, 
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  copyToClipboard, 
  formatExpirationDate, 
  getTimeUntilExpiration,
  getInviteStatus,
  getStatusBadgeVariant
} from '@/lib/utils/invite';

interface InviteData {
  id: string;
  token: string;
  url: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
}

interface InviteLinkProps {
  tripId: string;
  isAdmin: boolean;
}

export function InviteLink({ tripId, isAdmin }: InviteLinkProps) {
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Form state
  const [maxUses, setMaxUses] = useState(10);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [email, setEmail] = useState('');

  // Load existing invites
  const loadInvites = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/invite`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load invites');
      }

      setInvites(data.invites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invites');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new invite
  const generateInvite = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxUses,
          expiresInDays,
          email: email.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate invite');
      }

      // Add new invite to list
      setInvites(prev => [data.invite, ...prev]);
      
      // Reset form
      setShowCreateForm(false);
      setMaxUses(10);
      setExpiresInDays(7);
      setEmail('');
      
      // Auto-copy the new invite URL
      const success = await copyToClipboard(data.invite.url);
      if (success) {
        setCopyFeedback('Invite link copied to clipboard!');
        setTimeout(() => setCopyFeedback(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite');
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete invite
  const deleteInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/invite?id=${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete invite');
      }

      // Remove invite from list
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete invite');
    }
  };

  // Copy invite URL
  const handleCopyUrl = async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopyFeedback('Invite link copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } else {
      setError('Failed to copy to clipboard');
    }
  };

  // Load invites on component mount
  useEffect(() => {
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, isAdmin]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>Only trip admins can manage invite links.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with generate button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Invite Links</h3>
          <p className="text-sm text-muted-foreground">
            Generate shareable links to invite people to your trip
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={isLoading || isGenerating}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate Invite
        </Button>
      </div>

      {/* Copy feedback */}
      {copyFeedback && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
          <CheckCircle className="h-4 w-4" />
          {copyFeedback}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Create invite form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Invite Link</CardTitle>
            <CardDescription>
              Create a shareable invitation link for your trip
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  max="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  How many people can use this link
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min="1"
                  max="30"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  Link will expire after this many days
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Specific Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Restrict this invite to a specific email address
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              onClick={generateInvite} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Link
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Existing invites list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-2">Loading invites...</span>
        </div>
      ) : invites.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <ExternalLink className="h-8 w-8 mx-auto mb-2" />
              <p>No invite links created yet.</p>
              <p className="text-sm">Generate your first invite link to start inviting people!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => {
            const status = getInviteStatus(invite);
            const statusVariant = getStatusBadgeVariant(status);
            
            return (
              <Card key={invite.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Invite status and info */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant}>
                            {status.replace('-', ' ')}
                          </Badge>
                          {invite.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {invite.email}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {invite.currentUses}/{invite.maxUses} uses
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires {getTimeUntilExpiration(invite.expiresAt)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvite(invite.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Invite URL */}
                    <div className="flex gap-2">
                      <Input
                        value={invite.url}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyUrl(invite.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Additional details */}
                    <div className="text-xs text-muted-foreground">
                      Created {formatExpirationDate(invite.createdAt)} • 
                      Expires {formatExpirationDate(invite.expiresAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
