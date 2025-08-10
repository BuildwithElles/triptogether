/**
 * AddOutfit Component
 * Modal form for creating new outfits with clothing items and metadata
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOutfits } from '@/lib/hooks/useOutfits';
import { ClothingItem } from '@/lib/types/database';
import { outfitSchema, clothingItemSchema, type OutfitFormData, type ClothingItemFormData } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Shirt, AlertCircle } from 'lucide-react';

interface AddOutfitProps {
  tripId: string;
  onClose: () => void;
  initialDate?: string;
}

const OCCASIONS = [
  'casual',
  'formal',
  'business',
  'evening',
  'beach',
  'hiking',
  'sightseeing',
  'dining',
  'party',
  'travel',
  'sports',
  'other'
];

const WEATHER_CONDITIONS = [
  'sunny',
  'cloudy',
  'rainy',
  'cold',
  'hot',
  'windy',
  'snowy',
  'humid'
];

const CLOTHING_TYPES = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'accessory'
] as const;

export function AddOutfit({ tripId, onClose, initialDate }: AddOutfitProps) {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [newItemError, setNewItemError] = useState<string>('');
  const { createOutfit } = useOutfits({ tripId });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OutfitFormData>({
    resolver: zodResolver(outfitSchema),
    defaultValues: {
      name: '',
      description: '',
      occasion: 'casual',
      weather: '',
      date_planned: initialDate || '',
      image_url: '',
      clothing_items: [],
    },
  });

  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    formState: { errors: itemErrors },
  } = useForm<ClothingItemFormData>({
    resolver: zodResolver(clothingItemSchema),
    defaultValues: {
      name: '',
      type: 'top',
      color: '',
      brand: '',
      notes: '',
    },
  });

  const watchedOccasion = watch('occasion');
  const watchedWeather = watch('weather');

  const onSubmit = async (data: OutfitFormData) => {
    try {
      await createOutfit({
        ...data,
        clothing_items: clothingItems,
        date_planned: data.date_planned || undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to create outfit:', error);
      // Error handling could be enhanced with toast notifications
    }
  };

  const addClothingItem = (itemData: ClothingItemFormData) => {
    try {
      setNewItemError('');
      
      const item: ClothingItem = {
        id: `item-${Date.now()}`,
        name: itemData.name.trim(),
        type: itemData.type,
        color: itemData.color?.trim() || '',
        brand: itemData.brand?.trim() || undefined,
        notes: itemData.notes?.trim() || undefined
      };

      setClothingItems(prev => [...prev, item]);
      resetItem();
    } catch (error) {
      setNewItemError('Failed to add clothing item');
    }
  };

  const removeClothingItem = (itemId: string) => {
    setClothingItems(prev => prev.filter(item => item.id !== itemId));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Outfit</DialogTitle>
          <DialogDescription>
            Create a new outfit for your trip with clothing items and details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Outfit Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Dinner at fancy restaurant"
                disabled={isSubmitting}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Select 
                value={watchedOccasion} 
                onValueChange={(value) => setValue('occasion', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.occasion ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map(occasion => (
                    <SelectItem key={occasion} value={occasion}>
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.occasion && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.occasion.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weather">Weather</Label>
              <Select 
                value={watchedWeather} 
                onValueChange={(value) => setValue('weather', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.weather ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select weather condition" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_CONDITIONS.map(weather => (
                    <SelectItem key={weather} value={weather}>
                      {weather.charAt(0).toUpperCase() + weather.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.weather && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.weather.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_planned">Date</Label>
              <Input
                id="date_planned"
                type="date"
                {...register('date_planned')}
                disabled={isSubmitting}
                className={errors.date_planned ? 'border-red-500' : ''}
              />
              {errors.date_planned && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.date_planned.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the outfit or occasion..."
              rows={3}
              disabled={isSubmitting}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              {...register('image_url')}
              placeholder="https://example.com/outfit-image.jpg"
              disabled={isSubmitting}
              className={errors.image_url ? 'border-red-500' : ''}
            />
            {errors.image_url && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.image_url.message}
              </p>
            )}
          </div>

          {/* Clothing Items */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shirt className="h-5 w-5 text-gray-500" />
              <Label className="text-base font-medium">Clothing Items</Label>
            </div>

            {/* Add New Item Form */}
            <Card>
              <CardContent className="p-4">
                {newItemError && (
                  <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {newItemError}
                  </div>
                )}
                
                <form onSubmit={handleSubmitItem(addClothingItem)} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Input
                        placeholder="Item name"
                        {...registerItem('name')}
                        className={itemErrors.name ? 'border-red-500' : ''}
                      />
                      {itemErrors.name && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <input type="hidden" {...registerItem('type')} />
                      <Select 
                        defaultValue="top"
                        onValueChange={(value: any) => registerItem('type').onChange({ target: { value } })}
                      >
                        <SelectTrigger className={itemErrors.type ? 'border-red-500' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLOTHING_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {itemErrors.type && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors.type.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Input
                        placeholder="Color"
                        {...registerItem('color')}
                        className={itemErrors.color ? 'border-red-500' : ''}
                      />
                      {itemErrors.color && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors.color.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Input
                        placeholder="Brand (optional)"
                        {...registerItem('brand')}
                        className={itemErrors.brand ? 'border-red-500' : ''}
                      />
                      {itemErrors.brand && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors.brand.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Input
                        placeholder="Notes (optional)"
                        {...registerItem('notes')}
                        className={itemErrors.notes ? 'border-red-500' : ''}
                      />
                      {itemErrors.notes && (
                        <p className="text-xs text-red-600 mt-1">{itemErrors.notes.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button type="submit" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Clothing Items List */}
            {clothingItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Added Items ({clothingItems.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {clothingItems.map((item) => (
                    <Badge 
                      key={item.id} 
                      variant="secondary" 
                      className="flex items-center space-x-1 pr-1"
                    >
                      <span className="text-xs">
                        {item.name} ({item.type})
                        {item.color && ` - ${item.color}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeClothingItem(item.id)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Outfit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
