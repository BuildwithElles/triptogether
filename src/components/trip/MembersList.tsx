'use client';

import React from 'react';
import Image from 'next/image';
import { Crown, User, MoreVertical, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Member {
  id: string;
  userId: string;
  role: 'admin' | 'guest';
  joinedAt: string;
  invitationAcceptedAt: string | null;
  nickname: string | null;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

interface MembersListProps {
  members: Member[];
  userRole: 'admin' | 'guest';
  currentUserId: string;
  onInviteMembers?: () => void;
  onManageMember?: (member: Member) => void;
}

const MembersList: React.FC<MembersListProps> = ({
  members,
  userRole,
  currentUserId,
  onInviteMembers,
  onManageMember,
}) => {
  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const sortedMembers = [...members].sort((a, b) => {
    // Admins first, then by join date
    if (a.role !== b.role) {
      return a.role === 'admin' ? -1 : 1;
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Trip Members ({members.length})
          </CardTitle>
          {userRole === 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInviteMembers}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {member.avatarUrl ? (
                    <Image
                      src={member.avatarUrl}
                      alt={member.fullName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {getInitials(member.fullName)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Member info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {member.nickname || member.fullName}
                      {member.userId === currentUserId && (
                        <span className="text-gray-500 ml-1">(You)</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-1">
                      {member.role === 'admin' ? (
                        <Badge variant="default" className="flex items-center gap-1 text-xs">
                          <Crown className="h-3 w-3" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                          <User className="h-3 w-3" />
                          Guest
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <p className="text-sm text-gray-600 truncate">{member.email}</p>
                    <p className="text-xs text-gray-500">
                      Joined {formatJoinDate(member.joinedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions - only show for admins managing other members */}
              {userRole === 'admin' && member.userId !== currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onManageMember?.(member)}
                  className="flex-shrink-0 ml-2"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {/* Empty state */}
          {members.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
              <p className="text-gray-600 mb-4">
                Invite people to start planning your trip together.
              </p>
              {userRole === 'admin' && (
                <Button onClick={onInviteMembers} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Members
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Members summary */}
        {members.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {members.filter(m => m.role === 'admin').length} admin(s), {' '}
                {members.filter(m => m.role === 'guest').length} guest(s)
              </span>
              {userRole === 'admin' && (
                <button
                  onClick={onInviteMembers}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add more members
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MembersList;
