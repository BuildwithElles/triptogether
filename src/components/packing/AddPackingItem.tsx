'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Plus, Package, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type CreatePackingItemData, type PackingItem } from '@/lib/hooks/usePacking'

// Form validation schema
const packingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(255, 'Item name too long'),
  category: z.enum(['clothing', 'toiletries', 'electronics', 'documents', 'medication', 'accessories', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  notes: z.string().max(500, 'Notes too long').optional(),
})

type PackingItemFormData = z.infer<typeof packingItemSchema>

interface AddPackingItemProps {
  onAdd: (itemData: CreatePackingItemData) => Promise<PackingItem>
}

// Category options with display labels
const categoryOptions = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'toiletries', label: 'Toiletries' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'documents', label: 'Documents' },
  { value: 'medication', label: 'Medication' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
] as const

// Priority options with display labels
const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-red-600' },
] as const

export function AddPackingItem({ onAdd }: AddPackingItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PackingItemFormData>({
    resolver: zodResolver(packingItemSchema),
    defaultValues: {
      name: '',
      category: 'other',
      priority: 'medium',
      quantity: 1,
      notes: '',
    },
  })

  // Watch form values for UI updates
  const selectedCategory = watch('category')
  const selectedPriority = watch('priority')

  const onSubmit = async (data: PackingItemFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onAdd(data)
      
      // Reset form and close modal on success
      reset()
      setIsOpen(false)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to add packing item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    setSubmitError(null)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)} 
        className="w-full"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Packing Item
      </Button>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Add Packing Item
        </CardTitle>
        <CardDescription>
          Add a new item to your personal packing list
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              placeholder="e.g., T-shirts, Toothbrush, Phone charger"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Category and Quantity Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => setValue('category', value as PackingItemFormData['category'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                {...register('quantity', { valueAsNumber: true })}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.quantity.message}
                </p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={selectedPriority} 
              onValueChange={(value) => setValue('priority', value as PackingItemFormData['priority'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={option.color}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.priority.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or reminders..."
              {...register('notes')}
              className={errors.notes ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.notes.message}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
