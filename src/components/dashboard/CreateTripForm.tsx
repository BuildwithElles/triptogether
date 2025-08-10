'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, MapPinIcon, PlusIcon, LoaderIcon, AlertCircleIcon, Users, DollarSign, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateTrip } from '@/lib/hooks/useTrips';
import { createTripSchema, type CreateTripFormData } from '@/lib/utils/validation';

interface CreateTripFormProps {
  onSuccess?: (tripId: string) => void;
  onCancel?: () => void;
}

export function CreateTripForm({ onSuccess, onCancel }: CreateTripFormProps) {
  const router = useRouter();
  const { createTrip, isLoading } = useCreateTrip();
  const [generalError, setGeneralError] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: '',
      description: '',
      destination: '',
      startDate: '',
      endDate: '',
      budgetTotal: '',
      maxMembers: '',
      isPublic: false,
    },
  });

  const watchedIsPublic = watch('isPublic');

  // Handle form submission
  const onSubmit = async (data: CreateTripFormData) => {
    try {
      setGeneralError('');

      const tripData = {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        destination: data.destination.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        budgetTotal: data.budgetTotal ? Number(data.budgetTotal) : undefined,
        maxMembers: data.maxMembers ? Number(data.maxMembers) : undefined,
        isPublic: data.isPublic,
      };

      const result = await createTrip(tripData);
      
      if (result.success && result.trip) {
        // Success! Redirect to the new trip dashboard
        if (onSuccess) {
          onSuccess(result.trip.id);
        } else {
          router.push(`/dashboard/trips/${result.trip.id}`);
        }
      } else {
        setGeneralError(result.error || 'Failed to create trip. Please try again.');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create New Trip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* General error message */}
          {generalError && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircleIcon className="h-4 w-4" />
              {generalError}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trip Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Trip Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Summer Europe Adventure"
                  disabled={isFormLoading}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  Destination *
                </Label>
                <Input
                  id="destination"
                  {...register('destination')}
                  placeholder="e.g., Paris, France"
                  disabled={isFormLoading}
                  className={errors.destination ? 'border-red-500' : ''}
                />
                {errors.destination && (
                  <p className="text-sm text-red-600">{errors.destination.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Tell us about your trip plans..."
                rows={3}
                disabled={isFormLoading}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Trip Dates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  disabled={isFormLoading}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  disabled={isFormLoading}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Trip Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Trip Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budgetTotal" className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Total Budget (optional)
                </Label>
                <Input
                  id="budgetTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('budgetTotal')}
                  placeholder="e.g., 2000"
                  disabled={isFormLoading}
                  className={errors.budgetTotal ? 'border-red-500' : ''}
                />
                {errors.budgetTotal && (
                  <p className="text-sm text-red-600">{errors.budgetTotal.message}</p>
                )}
              </div>

              {/* Max Members */}
              <div className="space-y-2">
                <Label htmlFor="maxMembers" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Max Members (optional)
                </Label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="1"
                  max="100"
                  {...register('maxMembers')}
                  placeholder="e.g., 6"
                  disabled={isFormLoading}
                  className={errors.maxMembers ? 'border-red-500' : ''}
                />
                {errors.maxMembers && (
                  <p className="text-sm text-red-600">{errors.maxMembers.message}</p>
                )}
              </div>
            </div>

            {/* Public Trip Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <Label htmlFor="isPublic" className="font-medium">
                    Make trip public
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  Allow others to discover and request to join this trip
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={watchedIsPublic}
                onCheckedChange={(checked) => setValue('isPublic', checked)}
                disabled={isFormLoading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isFormLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isFormLoading}
              className="flex-1"
            >
              {isFormLoading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Trip
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}