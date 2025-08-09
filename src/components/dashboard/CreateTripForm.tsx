'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, MapPinIcon, PlusIcon, LoaderIcon, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateTrip } from '@/lib/hooks/useTrips';

interface CreateTripFormProps {
  onSuccess?: (tripId: string) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetTotal: string;
  maxMembers: string;
  isPublic: boolean;
}

interface FormErrors {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budgetTotal?: string;
  maxMembers?: string;
  general?: string;
}

export function CreateTripForm({ onSuccess, onCancel }: CreateTripFormProps) {
  const router = useRouter();
  const { createTrip, isLoading } = useCreateTrip();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    budgetTotal: '',
    maxMembers: '',
    isPublic: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    // Destination validation
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    } else if (formData.destination.length > 200) {
      newErrors.destination = 'Destination must be 200 characters or less';
    }

    // Date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after or equal to start date';
      }
    }

    // Budget validation
    if (formData.budgetTotal && (isNaN(Number(formData.budgetTotal)) || Number(formData.budgetTotal) < 0)) {
      newErrors.budgetTotal = 'Budget must be a positive number';
    }

    // Max members validation
    if (formData.maxMembers) {
      const maxMembers = Number(formData.maxMembers);
      if (isNaN(maxMembers) || maxMembers < 1 || maxMembers > 100) {
        newErrors.maxMembers = 'Max members must be between 1 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setErrors({});

      const tripData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        destination: formData.destination.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        budgetTotal: formData.budgetTotal ? Number(formData.budgetTotal) : undefined,
        maxMembers: formData.maxMembers ? Number(formData.maxMembers) : undefined,
        isPublic: formData.isPublic,
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
        setErrors({
          general: result.error || 'Failed to create trip. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      setErrors({
        general: 'An unexpected error occurred. Please try again.'
      });
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create New Trip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Trip Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Summer Vacation 2025"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
              maxLength={200}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell us about your trip..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              Destination *
            </Label>
            <Input
              id="destination"
              type="text"
              placeholder="e.g., Maui, Hawaii"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              className={errors.destination ? 'border-red-500' : ''}
              maxLength={200}
              disabled={isLoading}
            />
            {errors.destination && (
              <p className="text-sm text-red-600">{errors.destination}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
                min={today}
                disabled={isLoading}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                End Date *
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={errors.endDate ? 'border-red-500' : ''}
                min={formData.startDate || today}
                disabled={isLoading}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Optional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetTotal">Budget Total ($)</Label>
              <Input
                id="budgetTotal"
                type="number"
                placeholder="e.g., 2500"
                value={formData.budgetTotal}
                onChange={(e) => handleInputChange('budgetTotal', e.target.value)}
                className={errors.budgetTotal ? 'border-red-500' : ''}
                min="0"
                step="0.01"
                disabled={isLoading}
              />
              {errors.budgetTotal && (
                <p className="text-sm text-red-600">{errors.budgetTotal}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Members</Label>
              <Input
                id="maxMembers"
                type="number"
                placeholder="e.g., 10"
                value={formData.maxMembers}
                onChange={(e) => handleInputChange('maxMembers', e.target.value)}
                className={errors.maxMembers ? 'border-red-500' : ''}
                min="1"
                max="100"
                disabled={isLoading}
              />
              {errors.maxMembers && (
                <p className="text-sm text-red-600">{errors.maxMembers}</p>
              )}
            </div>
          </div>

          {/* Public Trip Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="isPublic" className="text-base font-medium">
                Public Trip
              </Label>
              <p className="text-sm text-gray-600">
                Allow anyone to discover and join this trip
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                <>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Trip
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
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
