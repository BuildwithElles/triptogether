'use client'

import { useState } from 'react'
import { Check, Trash2, Edit, Package, AlertCircle, MoreHorizontal, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { type PackingItem, type PackingStats } from '@/lib/hooks/usePacking'

interface PackingListProps {
  items: PackingItem[]
  stats: PackingStats
  isLoading?: boolean
  onTogglePacked: (itemId: string, currentStatus: boolean) => Promise<void>
  onDeleteItem: (itemId: string) => Promise<void>
  onEditItem?: (item: PackingItem) => void
}

// Category display configuration
const categoryConfig = {
  clothing: { label: 'Clothing', color: 'bg-blue-100 text-blue-800' },
  toiletries: { label: 'Toiletries', color: 'bg-green-100 text-green-800' },
  electronics: { label: 'Electronics', color: 'bg-purple-100 text-purple-800' },
  documents: { label: 'Documents', color: 'bg-yellow-100 text-yellow-800' },
  medication: { label: 'Medication', color: 'bg-red-100 text-red-800' },
  accessories: { label: 'Accessories', color: 'bg-pink-100 text-pink-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
}

// Priority display configuration
const priorityConfig = {
  low: { label: 'Low', color: 'text-green-600', icon: null },
  medium: { label: 'Medium', color: 'text-yellow-600', icon: null },
  high: { label: 'High', color: 'text-red-600', icon: <Star className="w-3 h-3" /> },
}

interface PackingItemRowProps {
  item: PackingItem
  onTogglePacked: (itemId: string, currentStatus: boolean) => Promise<void>
  onDeleteItem: (itemId: string) => Promise<void>
  onEditItem?: (item: PackingItem) => void
}

function PackingItemRow({ item, onTogglePacked, onDeleteItem, onEditItem }: PackingItemRowProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleTogglePacked = async () => {
    setIsUpdating(true)
    try {
      await onTogglePacked(item.id, item.is_packed)
    } catch (error) {
      console.error('Failed to toggle packed status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await onDeleteItem(item.id)
    } catch (error) {
      console.error('Failed to delete item:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const categoryInfo = categoryConfig[item.category]
  const priorityInfo = priorityConfig[item.priority]

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${item.is_packed ? 'opacity-75' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left side: Checkbox and item details */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Packed checkbox */}
            <div className="flex-shrink-0 mt-1">
              <Checkbox
                checked={item.is_packed}
                onCheckedChange={handleTogglePacked}
                disabled={isUpdating}
                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
            </div>

            {/* Item details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium truncate ${item.is_packed ? 'line-through text-gray-500' : ''}`}>
                  {item.name}
                </h3>
                {item.quantity > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {item.quantity}x
                  </Badge>
                )}
                {item.priority === 'high' && (
                  <div className="flex items-center text-red-600">
                    {priorityInfo.icon}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Badge className={categoryInfo.color} variant="secondary">
                  {categoryInfo.label}
                </Badge>
                <span className={`text-xs ${priorityInfo.color}`}>
                  {priorityInfo.label} priority
                </span>
              </div>

              {item.notes && (
                <p className="text-sm text-gray-600 truncate">{item.notes}</p>
              )}
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-8 h-8 p-0"
                  disabled={isUpdating || isDeleting}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleTogglePacked}
                  disabled={isUpdating}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {item.is_packed ? 'Mark as Unpacked' : 'Mark as Packed'}
                </DropdownMenuItem>
                {onEditItem && (
                  <DropdownMenuItem 
                    onClick={() => onEditItem(item)}
                    disabled={isUpdating || isDeleting}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Item
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting || isUpdating}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Item'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Loading overlay */}
        {(isUpdating || isDeleting) && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PackingList({ 
  items, 
  stats, 
  isLoading, 
  onTogglePacked, 
  onDeleteItem, 
  onEditItem 
}: PackingListProps) {
  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, PackingItem[]>)

  // Sort categories by number of items (descending)
  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => 
    itemsByCategory[b].length - itemsByCategory[a].length
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No packing items yet"
        description="Start building your personal packing list by adding items above."
        action={
          <p className="text-sm text-gray-500 mt-2">
            Add items by category and priority to stay organized!
          </p>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Packing Progress</h3>
              <Badge variant={stats.completion === 100 ? 'default' : 'secondary'}>
                {stats.completion}% Complete
              </Badge>
            </div>
            
            <Progress value={stats.completion} className="w-full" />
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>{stats.packed} packed</span>
              <span>{stats.total} total items</span>
              <span>{stats.unpacked} remaining</span>
            </div>

            {stats.completion === 100 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-700 font-medium">
                  All packed! You&apos;re ready to go! 🎉
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items by Category */}
      {sortedCategories.map((category) => {
        const categoryItems = itemsByCategory[category]
        const categoryConfig_ = categoryConfig[category as keyof typeof categoryConfig]
        const packedInCategory = categoryItems.filter(item => item.is_packed).length
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-lg flex items-center gap-2">
                <Badge className={categoryConfig_.color} variant="secondary">
                  {categoryConfig_.label}
                </Badge>
                <span className="text-sm text-gray-500">
                  ({packedInCategory}/{categoryItems.length} packed)
                </span>
              </h4>
            </div>
            
            <div className="grid gap-3">
              {categoryItems
                .sort((a, b) => {
                  // Sort by packed status (unpacked first), then by priority (high first), then by name
                  if (a.is_packed !== b.is_packed) {
                    return a.is_packed ? 1 : -1
                  }
                  
                  const priorityOrder = { high: 0, medium: 1, low: 2 }
                  if (a.priority !== b.priority) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority]
                  }
                  
                  return a.name.localeCompare(b.name)
                })
                .map((item) => (
                  <PackingItemRow
                    key={item.id}
                    item={item}
                    onTogglePacked={onTogglePacked}
                    onDeleteItem={onDeleteItem}
                    onEditItem={onEditItem}
                  />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
