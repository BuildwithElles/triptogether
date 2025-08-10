/**
 * PhotoUpload component for uploading photos to trip gallery
 * Supports drag & drop, multiple file selection, and progress tracking
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
// Alert component will be added when needed
import { cn } from '@/lib/utils/cn';
import { ALLOWED_FILE_TYPES, FILE_SIZE_LIMITS, validateFile } from '@/lib/utils/storage';

interface UploadProgress {
  photoId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

interface PhotoUploadProps {
  onUpload: (files: FileList, albumName?: string) => Promise<any>;
  uploadProgress: UploadProgress[];
  disabled?: boolean;
  className?: string;
}

interface PreviewFile {
  id: string;
  file: File;
  preview: string;
  error?: string;
}

export function PhotoUpload({
  onUpload,
  uploadProgress,
  disabled = false,
  className,
}: PhotoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: FileList): PreviewFile[] => {
    const validFiles: PreviewFile[] = [];

    Array.from(files).forEach((file, index) => {
      const id = `preview-${Date.now()}-${index}`;
      const validation = validateFile(file, ALLOWED_FILE_TYPES.PHOTOS, FILE_SIZE_LIMITS.PHOTO);
      
      const preview: PreviewFile = {
        id,
        file,
        preview: URL.createObjectURL(file),
        error: validation.isValid ? undefined : validation.error,
      };

      validFiles.push(preview);
    });

    return validFiles;
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPreviews = validateFiles(files);
    setPreviewFiles(prev => [...prev, ...newPreviews]);
  }, [validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const removePreviewFile = useCallback((id: string) => {
    setPreviewFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      // Clean up object URL
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  }, []);

  const clearPreviews = useCallback(() => {
    // Clean up object URLs
    previewFiles.forEach(file => {
      URL.revokeObjectURL(file.preview);
    });
    setPreviewFiles([]);
  }, [previewFiles]);

  const handleUpload = useCallback(async () => {
    const validFiles = previewFiles.filter(f => !f.error);
    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      // Create FileList from valid files
      const dataTransfer = new DataTransfer();
      validFiles.forEach(({ file }) => dataTransfer.items.add(file));
      
      await onUpload(dataTransfer.files, albumName || undefined);
      
      // Clear previews after successful upload
      clearPreviews();
      setAlbumName('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [previewFiles, albumName, onUpload, clearPreviews]);

  const validFiles = previewFiles.filter(f => !f.error);
  const hasErrors = previewFiles.some(f => f.error);
  const canUpload = validFiles.length > 0 && !isUploading && !disabled;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver && !disabled
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Upload Photos
            </h3>
            <p className="text-gray-600 mt-1">
              Drag and drop photos here, or click to select files
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports JPEG, PNG, WebP, HEIC up to 10MB each
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Select Photos
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled}
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      </div>

      {/* Album Name Input */}
      {previewFiles.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="album-name">Album Name (Optional)</Label>
          <Input
            id="album-name"
            type="text"
            placeholder="e.g., Day 1, Beach Day, Hiking"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            disabled={disabled || isUploading}
            maxLength={100}
          />
        </div>
      )}

      {/* Preview Files */}
      {previewFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Selected Photos ({previewFiles.length})
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearPreviews}
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewFiles.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border",
                  file.error ? "border-red-300 bg-red-50" : "border-gray-200"
                )}
              >
                {!file.error ? (
                                  <Image
                  src={file.preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-red-50">
                    <div className="text-center p-2">
                      <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-red-600 break-words">
                        {file.error}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 w-6 h-6 p-0"
                  onClick={() => removePreviewFile(file.id)}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>

                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-black/50 text-white text-xs p-1 rounded truncate">
                    {file.file.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    Some files couldn&apos;t be uploaded due to size or format restrictions.
                    Only valid files will be uploaded.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!canUpload}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {validFiles.length} Photo{validFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Upload Progress</h4>
          {uploadProgress.map((progress) => (
            <div key={progress.photoId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {progress.status === 'uploading' && 'Uploading...'}
                  {progress.status === 'processing' && 'Processing...'}
                  {progress.status === 'complete' && 'Complete'}
                  {progress.status === 'error' && 'Error'}
                </span>
                <span className="text-gray-500">{progress.progress}%</span>
              </div>
              <Progress 
                value={progress.progress} 
                className={cn(
                  "h-2",
                  progress.status === 'error' && "bg-red-100"
                )}
              />
              {progress.error && (
                <p className="text-sm text-red-600">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
