'use client';

import { useState } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { Calendar, Clock, MapPin, MoreVertical, Edit, Trash2, User } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useItinerary, ITINERARY_CATEGORIES_LIST } from '@/lib/hooks/useItinerary';

interface ItineraryListProps {
  tripId: string;
  onEditItem?: (itemId: string) => void;
}

export function ItineraryList({ tripId, onEditItem }: ItineraryListProps) {
  const { items, isLoading, error, deleteItem } = useItinerary(tripId);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this itinerary item? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      // TODO: Show toast notification for error
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load itinerary items</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No itinerary items yet"
        description="Start planning your trip by adding activities, transportation, and accommodation."
      />
    );
  }

  // Group items by date
  const groupedItems = items.reduce((groups, item) => {
    let groupKey = 'No Date';
    
    if (item.start_time) {
      try {
        const date = parseISO(item.start_time);
        groupKey = format(date, 'yyyy-MM-dd');
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, typeof items>);

  // Sort groups by date
  const sortedGroups = Object.entries(groupedItems).sort(([a], [b]) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return a.localeCompare(b);
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Transportation': 'bg-blue-100 text-blue-800',
      'Accommodation': 'bg-purple-100 text-purple-800',
      'Activity': 'bg-green-100 text-green-800',
      'Dining': 'bg-orange-100 text-orange-800',
      'Sightseeing': 'bg-yellow-100 text-yellow-800',
      'Meeting': 'bg-red-100 text-red-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors['Other'];
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'No Date') return 'Unscheduled';
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getUserDisplayName = (user?: { email: string; raw_user_meta_data?: any }) => {
    if (!user) return 'Unknown User';
    
    const metadata = user.raw_user_meta_data;
    if (metadata?.name) return metadata.name;
    if (metadata?.full_name) return metadata.full_name;
    
    return user.email.split('@')[0];
  };

  return (
    <div className="space-y-6">
      {sortedGroups.map(([dateKey, dateItems]) => (
        <div key={dateKey} className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground">
              {formatDate(dateKey)}
            </h3>
            <Badge variant="secondary" className="ml-auto">
              {dateItems.length} {dateItems.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {dateItems
              .sort((a, b) => {
                // Sort by start time within each day
                if (!a.start_time && !b.start_time) return 0;
                if (!a.start_time) return 1;
                if (!b.start_time) return -1;
                
                try {
                  const timeA = parseISO(a.start_time);
                  const timeB = parseISO(b.start_time);
                  return timeA.getTime() - timeB.getTime();
                } catch (error) {
                  return 0;
                }
              })
              .map((item) => (
                <Card key={item.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={getCategoryColor(item.category)}
                          >
                            {item.category}
                          </Badge>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => onEditItem?.(item.id)}
                            className="cursor-pointer"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteConfirm(item.id)}
                            className="cursor-pointer text-red-600"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {(item.start_time || item.end_time) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>
                            {item.start_time && formatTime(item.start_time)}
                            {item.start_time && item.end_time && ' - '}
                            {item.end_time && formatTime(item.end_time)}
                          </span>
                        </div>
                      )}
                      
                      {item.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      
                      {item.created_by_user && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>Added by {getUserDisplayName(item.created_by_user)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
