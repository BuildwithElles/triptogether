'use client'

import { useState } from 'react'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { PackingList } from '@/components/packing/PackingList'
import { AddPackingItem } from '@/components/packing/AddPackingItem'
import { usePacking } from '@/lib/hooks/usePacking'

interface PackingPageClientProps {
  tripId: string
}

export function PackingPageClient({ tripId }: PackingPageClientProps) {
  const {
    items,
    stats,
    isLoading,
    error,
    createPackingItem,
    togglePackedStatus,
    deletePackingItem,
  } = usePacking(tripId)

  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreateItem = async (itemData: Parameters<typeof createPackingItem>[0]) => {
    setCreateError(null)
    try {
      const newItem = await createPackingItem(itemData)
      return newItem
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create packing item'
      setCreateError(errorMessage)
      throw error // Re-throw for the component to handle
    }
  }

  const handleTogglePacked = async (itemId: string, currentStatus: boolean) => {
    try {
      await togglePackedStatus(itemId, currentStatus)
    } catch (error) {
      console.error('Failed to toggle packed status:', error)
      // Could add toast notification here
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deletePackingItem(itemId)
    } catch (error) {
      console.error('Failed to delete item:', error)
      // Could add toast notification here
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Link href={`/trips/${tripId}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trip
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Load Packing List
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/trips/${tripId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trip
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Packing List</h1>
            <p className="text-gray-600">
              Keep track of your personal packing items for this trip
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Add New Item */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
            <CardDescription>
              Add items to your personal packing list and track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddPackingItem onAdd={handleCreateItem} />
            {createError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{createError}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Packing List */}
        {isLoading && items.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <PackingList
            items={items}
            stats={stats}
            isLoading={isLoading}
            onTogglePacked={handleTogglePacked}
            onDeleteItem={handleDeleteItem}
          />
        )}
      </div>
    </div>
  )
}
