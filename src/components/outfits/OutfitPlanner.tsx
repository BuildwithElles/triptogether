/**
 * OutfitPlanner Component
 * Main component for outfit planning with view switching and outfit management
 */

'use client';

import { useState } from 'react';
import { useOutfits } from '@/lib/hooks/useOutfits';
import { AddOutfit } from './AddOutfit';
import { OutfitCalendar } from './OutfitCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common';
import { 
  Calendar, 
  Grid3X3, 
  Plus, 
  Search, 
  Filter,
  Heart,
  CheckCircle,
  Shirt
} from 'lucide-react';

interface OutfitPlannerProps {
  tripId: string;
}

type ViewMode = 'grid' | 'calendar';

export function OutfitPlanner({ tripId }: OutfitPlannerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAddOutfit, setShowAddOutfit] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [occasionFilter, setOccasionFilter] = useState<string>('');

  const {
    outfits,
    stats,
    isLoading,
    error,
    deleteOutfit,
    toggleFavorite,
    toggleWorn,
    getOccasions,
    clearError,
  } = useOutfits({ tripId });

  // Filter outfits based on search and occasion
  const filteredOutfits = outfits.filter(outfit => {
    const matchesSearch = !searchTerm || 
      outfit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outfit.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOccasion = !occasionFilter || outfit.occasion === occasionFilter;
    
    return matchesSearch && matchesOccasion;
  });

  const occasions = getOccasions();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading outfits: {error}</p>
        <Button onClick={clearError} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Shirt className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Outfits</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Planned</p>
              <p className="text-2xl font-bold">{stats.planned}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Worn</p>
              <p className="text-2xl font-bold">{stats.worn}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Heart className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-bold">{stats.favorites}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle>Your Outfits</CardTitle>
              <CardDescription>
                Plan and organize your trip outfits
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="h-8 px-3"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
              
              <Button onClick={() => setShowAddOutfit(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Outfit
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search outfits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={occasionFilter} onValueChange={setOccasionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All occasions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All occasions</SelectItem>
                  {occasions.map(occasion => (
                    <SelectItem key={occasion} value={occasion}>
                      {occasion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'calendar' ? (
            <OutfitCalendar
              tripId={tripId}
              outfits={filteredOutfits}
              onToggleFavorite={toggleFavorite}
              onToggleWorn={toggleWorn}
              onDeleteOutfit={deleteOutfit}
            />
          ) : (
            <OutfitGridView
              outfits={filteredOutfits}
              onToggleFavorite={toggleFavorite}
              onToggleWorn={toggleWorn}
              onDeleteOutfit={deleteOutfit}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Outfit Modal */}
      {showAddOutfit && (
        <AddOutfit
          tripId={tripId}
          onClose={() => setShowAddOutfit(false)}
        />
      )}
    </div>
  );
}

/**
 * Grid View for outfits
 */
interface OutfitGridViewProps {
  outfits: any[];
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onToggleWorn: (id: string, isWorn: boolean) => Promise<void>;
  onDeleteOutfit: (id: string) => Promise<void>;
}

function OutfitGridView({ 
  outfits, 
  onToggleFavorite, 
  onToggleWorn, 
  onDeleteOutfit 
}: OutfitGridViewProps) {
  if (outfits.length === 0) {
    return (
      <div className="text-center py-12">
        <Shirt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No outfits</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first outfit.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {outfits.map((outfit) => (
        <OutfitCard
          key={outfit.id}
          outfit={outfit}
          onToggleFavorite={onToggleFavorite}
          onToggleWorn={onToggleWorn}
          onDeleteOutfit={onDeleteOutfit}
        />
      ))}
    </div>
  );
}

/**
 * Individual Outfit Card
 */
interface OutfitCardProps {
  outfit: any;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  onToggleWorn: (id: string, isWorn: boolean) => Promise<void>;
  onDeleteOutfit: (id: string) => Promise<void>;
}

function OutfitCard({ 
  outfit, 
  onToggleFavorite, 
  onToggleWorn, 
  onDeleteOutfit 
}: OutfitCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    try {
      await onToggleFavorite(outfit.id, !outfit.is_favorite);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWorn = async () => {
    setIsLoading(true);
    try {
      await onToggleWorn(outfit.id, !outfit.is_worn);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this outfit?')) {
      setIsLoading(true);
      try {
        await onDeleteOutfit(outfit.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Card className={`relative ${outfit.is_worn ? 'ring-2 ring-green-500' : ''}`}>
      {outfit.image_url && (
        <div className="aspect-square rounded-t-lg bg-gray-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={outfit.image_url}
            alt={outfit.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{outfit.name}</h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <Heart 
                className={`h-4 w-4 ${
                  outfit.is_favorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400'
                }`} 
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleWorn}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <CheckCircle 
                className={`h-4 w-4 ${
                  outfit.is_worn 
                    ? 'fill-green-500 text-green-500' 
                    : 'text-gray-400'
                }`} 
              />
            </Button>
          </div>
        </div>
        
        {outfit.description && (
          <p className="text-sm text-gray-600 mb-3">{outfit.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary">{outfit.occasion}</Badge>
          {outfit.weather && <Badge variant="outline">{outfit.weather}</Badge>}
          {outfit.date_planned && (
            <Badge variant="outline">
              {new Date(outfit.date_planned).toLocaleDateString()}
            </Badge>
          )}
        </div>
        
        {outfit.clothing_items && outfit.clothing_items.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Items:</p>
            <div className="flex flex-wrap gap-1">
              {outfit.clothing_items.map((item: any, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(outfit.created_at).toLocaleDateString()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 h-auto p-0"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
