/**
 * OutfitCalendar Component
 * Calendar view for outfits showing planned outfits by date
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Heart, CheckCircle, Plus } from 'lucide-react';
import { AddOutfit } from './AddOutfit';

interface OutfitCalendarProps {
  tripId: string;
  outfits: any[];
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onToggleWorn: (id: string, isWorn: boolean) => Promise<void>;
  onDeleteOutfit: (id: string) => Promise<void>;
}

export function OutfitCalendar({ 
  tripId, 
  outfits, 
  onToggleFavorite, 
  onToggleWorn, 
  onDeleteOutfit 
}: OutfitCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddOutfit, setShowAddOutfit] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group outfits by date
  const outfitsByDate = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    outfits.forEach(outfit => {
      if (outfit.date_planned) {
        const dateKey = outfit.date_planned;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(outfit);
      }
    });
    return grouped;
  }, [outfits]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateString = currentDay.toISOString().split('T')[0];
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const dayOutfits = outfitsByDate[dateString] || [];
      
      days.push({
        date: new Date(currentDay),
        dateString,
        day: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        outfits: dayOutfits
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  }, [currentDate, outfitsByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
    setShowAddOutfit(true);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <CalendarDay
                key={index}
                day={day}
                onDateClick={handleDateClick}
                onToggleFavorite={onToggleFavorite}
                onToggleWorn={onToggleWorn}
                onDeleteOutfit={onDeleteOutfit}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Outfit Modal */}
      {showAddOutfit && (
        <AddOutfit
          tripId={tripId}
          initialDate={selectedDate || undefined}
          onClose={() => {
            setShowAddOutfit(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}

interface CalendarDayProps {
  day: {
    date: Date;
    dateString: string;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    outfits: any[];
  };
  onDateClick: (dateString: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onToggleWorn: (id: string, isWorn: boolean) => Promise<void>;
  onDeleteOutfit: (id: string) => Promise<void>;
}

function CalendarDay({ 
  day, 
  onDateClick, 
  onToggleFavorite, 
  onToggleWorn, 
  onDeleteOutfit 
}: CalendarDayProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (outfitId: string, isFavorite: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await onToggleFavorite(outfitId, !isFavorite);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWorn = async (outfitId: string, isWorn: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await onToggleWorn(outfitId, !isWorn);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (outfitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this outfit?')) {
      setIsLoading(true);
      try {
        await onDeleteOutfit(outfitId);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div 
      className={`
        min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50
        ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
        ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
      `}
      onClick={() => onDateClick(day.dateString)}
    >
      {/* Date Number */}
      <div className={`
        text-sm font-medium mb-1
        ${day.isToday ? 'text-blue-600' : ''}
      `}>
        {day.day}
      </div>

      {/* Add Outfit Button (shown on hover or when no outfits) */}
      {day.outfits.length === 0 && day.isCurrentMonth && (
        <div className="flex items-center justify-center h-16 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Outfits */}
      <div className="space-y-1">
        {day.outfits.slice(0, 3).map((outfit) => (
          <div
            key={outfit.id}
            className="group relative bg-white rounded border p-1 text-xs hover:shadow-sm transition-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{outfit.name}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {outfit.occasion}
                  </Badge>
                  {outfit.weather && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {outfit.weather}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => handleToggleFavorite(outfit.id, outfit.is_favorite, e)}
                  disabled={isLoading}
                >
                  <Heart 
                    className={`h-3 w-3 ${
                      outfit.is_favorite 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400'
                    }`} 
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => handleToggleWorn(outfit.id, outfit.is_worn, e)}
                  disabled={isLoading}
                >
                  <CheckCircle 
                    className={`h-3 w-3 ${
                      outfit.is_worn 
                        ? 'fill-green-500 text-green-500' 
                        : 'text-gray-400'
                    }`} 
                  />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Show overflow count */}
        {day.outfits.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{day.outfits.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
