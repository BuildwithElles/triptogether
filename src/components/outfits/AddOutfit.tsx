/**
 * AddOutfit Component
 * Modal form for creating new outfits with clothing items and metadata
 */

'use client';

import { useState } from 'react';
import { useOutfits } from '@/lib/hooks/useOutfits';
import { ClothingItem } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Shirt } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    occasion: 'casual',
    weather: '',
    date_planned: initialDate || '',
    image_url: ''
  });
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'top' as const,
    color: '',
    brand: '',
    notes: ''
  });

  const { createOutfit } = useOutfits({ tripId });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter an outfit name');
      return;
    }

    setIsSubmitting(true);

    try {
      await createOutfit({
        ...formData,
        clothing_items: clothingItems,
        date_planned: formData.date_planned || undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to create outfit:', error);
      alert('Failed to create outfit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addClothingItem = () => {
    if (!newItem.name.trim()) {
      alert('Please enter an item name');
      return;
    }

    const item: ClothingItem = {
      id: `item-${Date.now()}`,
      name: newItem.name.trim(),
      type: newItem.type,
      color: newItem.color.trim(),
      brand: newItem.brand.trim() || undefined,
      notes: newItem.notes.trim() || undefined
    };

    setClothingItems(prev => [...prev, item]);
    setNewItem({
      name: '',
      type: 'top',
      color: '',
      brand: '',
      notes: ''
    });
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Outfit Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Dinner at fancy restaurant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Select 
                value={formData.occasion} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, occasion: value }))}
              >
                <SelectTrigger>
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weather">Weather</Label>
              <Select 
                value={formData.weather} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, weather: value }))}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_planned">Date</Label>
              <Input
                id="date_planned"
                type="date"
                value={formData.date_planned}
                onChange={(e) => setFormData(prev => ({ ...prev, date_planned: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the outfit or occasion..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL (optional)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              placeholder="https://example.com/outfit-image.jpg"
            />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <Input
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Select 
                    value={newItem.type} 
                    onValueChange={(value: any) => setNewItem(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
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
                  <Input
                    placeholder="Color"
                    value={newItem.color}
                    onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <Input
                    placeholder="Brand (optional)"
                    value={newItem.brand}
                    onChange={(e) => setNewItem(prev => ({ ...prev, brand: e.target.value }))}
                  />
                  <Input
                    placeholder="Notes (optional)"
                    value={newItem.notes}
                    onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                
                <Button type="button" onClick={addClothingItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
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
            <Button type="button" variant="outline" onClick={onClose}>
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
