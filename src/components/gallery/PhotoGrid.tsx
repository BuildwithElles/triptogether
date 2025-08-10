/**
 * PhotoGrid component for displaying photos in a responsive masonry-style grid
 * Supports selection, hover effects, and click actions
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, Download, Trash2, Eye, MapPin, Calendar, User } from 'lucide-react';
import { Photo } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface PhotoWithUploader extends Photo {
  uploader_name?: string;
  uploader_email?: string;
}

interface PhotoGridProps {
  photos: PhotoWithUploader[];
  selectedPhotos: string[];
  onPhotoSelect?: (photoId: string) => void;
  onPhotoClick?: (photo: PhotoWithUploader) => void;
  onDeletePhoto?: (photoId: string) => void;
  onToggleFavorite?: (photoId: string, isFavorite: boolean) => void;
  onSetCoverPhoto?: (photoId: string) => void;
  isSelectionMode?: boolean;
  className?: string;
}

export function PhotoGrid({
  photos,
  selectedPhotos,
  onPhotoSelect,
  onPhotoClick,
  onDeletePhoto,
  onToggleFavorite,
  onSetCoverPhoto,
  isSelectionMode = false,
  className,
}: PhotoGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId));
  };

  const handleImageError = (photoId: string) => {
    setFailedImages(prev => new Set(prev).add(photoId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Eye className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
        <p className="text-gray-500">
          Upload some photos to start building your trip gallery
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
      {photos.map((photo) => {
        const isSelected = selectedPhotos.includes(photo.id);
        const isLoaded = loadedImages.has(photo.id);
        const hasFailed = failedImages.has(photo.id);

        return (
          <div
            key={photo.id}
            className={cn(
              "group relative bg-white rounded-lg overflow-hidden shadow-sm border transition-all duration-200",
              "hover:shadow-md hover:-translate-y-1",
              isSelected && "ring-2 ring-blue-500 shadow-md",
              isSelectionMode && "cursor-pointer"
            )}
            onClick={() => {
              if (isSelectionMode) {
                onPhotoSelect?.(photo.id);
              } else {
                onPhotoClick?.(photo);
              }
            }}
          >
            {/* Selection Checkbox */}
            {isSelectionMode && (
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    isSelected 
                      ? "bg-blue-500 border-blue-500" 
                      : "bg-white border-gray-300 group-hover:border-blue-400"
                  )}
                >
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            )}

            {/* Cover Photo Badge */}
            {photo.is_cover_photo && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="secondary" className="text-xs">
                  Cover
                </Badge>
              </div>
            )}

            {/* Photo Image */}
            <div className="aspect-square relative bg-gray-100">
              {!hasFailed ? (
                <Image
                  src={photo.file_path}
                  alt={photo.title || 'Trip photo'}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    isLoaded ? "opacity-100" : "opacity-0"
                  )}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  onLoad={() => handleImageLoad(photo.id)}
                  onError={() => handleImageError(photo.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Failed to load</p>
                  </div>
                </div>
              )}

              {/* Loading Placeholder */}
              {!isLoaded && !hasFailed && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}

              {/* Hover Overlay */}
              {!isSelectionMode && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPhotoClick?.(photo);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite?.(photo.id, !photo.is_favorite);
                        }}
                      >
                        <Heart 
                          className={cn(
                            "w-4 h-4",
                            photo.is_favorite ? "fill-red-500 text-red-500" : ""
                          )} 
                        />
                      </Button>
                      {onDeletePhoto && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-500/90 hover:bg-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePhoto(photo.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Photo Info */}
            <div className="p-3">
              {photo.title && (
                <h4 className="font-medium text-gray-900 text-sm truncate mb-1">
                  {photo.title}
                </h4>
              )}
              
              <div className="space-y-1">
                {/* Uploader */}
                {photo.uploader_name && (
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="w-3 h-3 mr-1" />
                    <span className="truncate">{photo.uploader_name}</span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(photo.created_at)}</span>
                </div>

                {/* Location */}
                {photo.location_name && (
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="truncate">{photo.location_name}</span>
                  </div>
                )}

                {/* File Size */}
                <div className="text-xs text-gray-400">
                  {formatFileSize(photo.file_size)}
                </div>
              </div>

              {/* Album Badge */}
              {photo.album_name && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {photo.album_name}
                  </Badge>
                </div>
              )}

              {/* Tags */}
              {photo.tags && photo.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {photo.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {photo.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{photo.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
