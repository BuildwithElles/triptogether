/**
 * PhotoGallery component - main gallery interface
 * Combines photo grid, upload functionality, and album management
 */

'use client';

import { useState } from 'react';
import { 
  Upload, 
  Grid, 
  List, 
  Filter, 
  Search, 
  MoreHorizontal,
  Trash2,
  Download,
  Star,
  FolderOpen
} from 'lucide-react';
import { PhotoGrid } from './PhotoGrid';
import { PhotoUpload } from './PhotoUpload';
import { useGallery } from '@/lib/hooks/useGallery';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PhotoSkeleton, ListSkeleton } from '@/components/common/SkeletonComponents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils/cn';

interface PhotoGalleryProps {
  tripId: string;
  className?: string;
}

type ViewMode = 'grid' | 'upload';

export function PhotoGallery({ tripId, className }: PhotoGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    photos,
    albums,
    selectedPhotos,
    uploadProgress,
    albumFilter,
    isLoading,
    error,
    uploadPhotos,
    deletePhoto,
    updatePhoto,
    setCoverPhoto,
    togglePhotoSelection,
    clearSelection,
    deleteSelectedPhotos,
    setAlbumFilter,
  } = useGallery({ tripId });

  // Filter photos based on search query
  const filteredPhotos = photos.filter(photo => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      photo.title?.toLowerCase().includes(query) ||
      photo.description?.toLowerCase().includes(query) ||
      photo.album_name?.toLowerCase().includes(query) ||
      photo.location_name?.toLowerCase().includes(query) ||
      photo.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const handlePhotoClick = (photo: any) => {
    // TODO: Implement photo modal/lightbox
    console.log('Photo clicked:', photo);
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto(photoId);
    } catch (error) {
      console.error('Error deleting photo:', error);
      // TODO: Show error toast
    }
  };

  const handleToggleFavorite = async (photoId: string, isFavorite: boolean) => {
    try {
      await updatePhoto(photoId, { is_favorite: isFavorite });
    } catch (error) {
      console.error('Error updating favorite status:', error);
      // TODO: Show error toast
    }
  };

  const handleSetCoverPhoto = async (photoId: string) => {
    try {
      await setCoverPhoto(photoId);
    } catch (error) {
      console.error('Error setting cover photo:', error);
      // TODO: Show error toast
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteSelectedPhotos();
      setIsSelectionMode(false);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting selected photos:', error);
      // TODO: Show error toast
    }
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    clearSelection();
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading photos</div>
        <p className="text-gray-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          {/* View Mode Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid className="w-4 h-4 mr-1" />
              Gallery
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'upload' ? 'default' : 'ghost'}
              onClick={() => setViewMode('upload')}
              className="px-3"
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>

          {/* Photo Count */}
          {viewMode === 'grid' && (
            <div className="text-sm text-gray-600">
              {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
              {albumFilter && ` in "${albumFilter}"`}
            </div>
          )}
        </div>

        {/* Actions */}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-2">
            {isSelectionMode ? (
              <>
                <Badge variant="secondary">
                  {selectedPhotos.length} selected
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={selectedPhotos.length === 0}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExitSelectionMode}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSelectionMode(true)}
                  disabled={photos.length === 0}
                >
                  Select
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewMode('upload')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters and Search */}
      {viewMode === 'grid' && photos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Album Filter */}
          {albums.length > 0 && (
            <div className="sm:w-48">
              <Select value={albumFilter || 'all'} onValueChange={(value) => setAlbumFilter(value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Albums" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      All Albums
                    </div>
                  </SelectItem>
                  {albums.map((album) => (
                    <SelectItem key={album} value={album}>
                      <div className="flex items-center">
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {album}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === 'upload' ? (
        <PhotoUpload
          onUpload={uploadPhotos}
          uploadProgress={uploadProgress}
          disabled={isLoading}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <PhotoSkeleton key={i} />
          ))}
        </div>
      ) : (
        <PhotoGrid
          photos={filteredPhotos}
          selectedPhotos={selectedPhotos}
          onPhotoSelect={togglePhotoSelection}
          onPhotoClick={handlePhotoClick}
          onDeletePhoto={handleDeletePhoto}
          onToggleFavorite={handleToggleFavorite}
          onSetCoverPhoto={handleSetCoverPhoto}
          isSelectionMode={isSelectionMode}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Photos</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Photos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
