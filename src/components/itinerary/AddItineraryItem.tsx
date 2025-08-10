'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useItinerary, ITINERARY_CATEGORIES_LIST } from '@/lib/hooks/useItinerary';

const addItineraryItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
}).refine((data) => {
  if (data.start_time && data.end_time) {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    return end > start;
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

type AddItineraryItemForm = z.infer<typeof addItineraryItemSchema>;

interface AddItineraryItemProps {
  tripId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isInline?: boolean;
}

export function AddItineraryItem({ 
  tripId, 
  onSuccess, 
  onCancel, 
  isInline = false 
}: AddItineraryItemProps) {
  const [isOpen, setIsOpen] = useState(isInline);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useItinerary(tripId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddItineraryItemForm>({
    resolver: zodResolver(addItineraryItemSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      start_time: '',
      end_time: '',
      category: '',
    },
  });

  const watchedCategory = watch('category');

  const handleOpen = () => {
    setIsOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    reset();
    setError(null);
    onCancel?.();
  };

  const onSubmit = async (data: AddItineraryItemForm) => {
    try {
      setError(null);
      
      // Format datetime strings properly
      const formattedData = {
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        start_time: data.start_time ? new Date(data.start_time).toISOString() : undefined,
        end_time: data.end_time ? new Date(data.end_time).toISOString() : undefined,
        category: data.category,
      };

      await addItem(formattedData);
      
      reset();
      setError(null);
      
      if (isInline) {
        setIsOpen(false);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error adding itinerary item:', error);
      setError(error instanceof Error ? error.message : 'Failed to add itinerary item');
    }
  };

  // Format datetime-local input value
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!isInline && !isOpen) {
    return (
      <Button onClick={handleOpen} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Itinerary Item
      </Button>
    );
  }

  return (
    <Card className={isInline ? "w-full" : "w-full max-w-md mx-auto"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">Add Itinerary Item</CardTitle>
        {!isInline && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Visit Eiffel Tower"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={watchedCategory}
              onValueChange={(value) => setValue('category', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {ITINERARY_CATEGORIES_LIST.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional details about this activity"
              rows={3}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Paris, France"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                {...register('start_time')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">
                <Clock className="w-4 h-4 inline mr-1" />
                End Time
              </Label>
              <Input
                id="end_time"
                type="datetime-local"
                {...register('end_time')}
                disabled={isSubmitting}
              />
              {errors.end_time && (
                <p className="text-sm text-red-600">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
