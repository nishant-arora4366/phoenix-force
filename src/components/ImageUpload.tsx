'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { secureSessionManager } from '@/src/lib/secure-session';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  disabled?: boolean;
  className?: string;
}


interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export default function ImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  onImageRemoved,
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`
      }));
      return;
    }

    // Validate file size (15MB limit)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      setUploadState(prev => ({
        ...prev,
        error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum allowed: 15MB`
      }));
      return;
    }

    setSelectedFile(file);
    setUploadState(prev => ({ ...prev, error: null, success: false }));

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Always proceed with upload - server will handle center cropping
    handleUpload(file);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = useCallback(async (file: File) => {
    if (!file) return;

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false
    });

    try {
      const token = secureSessionManager.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('profilePicture', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true
      });

      // Call the callback with the new image URL
      onImageUploaded(result.data.url);

      // Clear the selected file and preview
      setSelectedFile(null);
      setPreviewUrl(null);

      // Reset success state after 3 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 3000);

    } catch (error: any) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error.message || 'Upload failed',
        success: false
      });
    }
  }, [onImageUploaded]);

  // Handle image removal
  const handleRemove = useCallback(async () => {
    if (!currentImageUrl) return;

    try {
      const token = secureSessionManager.getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/upload/profile-picture', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove image');
      }

      onImageRemoved?.();
      setUploadState(prev => ({ ...prev, error: null, success: true }));

    } catch (error: any) {
      setUploadState(prev => ({
        ...prev,
        error: error.message || 'Failed to remove image'
      }));
    }
  }, [currentImageUrl, onImageRemoved]);


  // Clean up preview URLs
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Display */}
      {currentImageUrl && !selectedFile && (
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#CEA17A]/20">
            <img
              src={currentImageUrl}
              alt="Current profile picture"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      {!currentImageUrl && !selectedFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
            ${isDragging 
              ? 'border-[#CEA17A] bg-[#CEA17A]/10' 
              : 'border-[#CEA17A]/30 hover:border-[#CEA17A]/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-[#CEA17A]/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium text-[#DBD0C0]">
                {isDragging ? 'Drop your image here' : 'Upload Profile Picture'}
              </p>
              <p className="text-sm text-[#CEA17A]/70 mt-1">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-[#CEA17A]/50 mt-2">
                Supports JPEG, PNG, WebP • Max 15MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview and Upload Progress */}
      {selectedFile && (
        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#CEA17A]/30">
              <img
                src={previewUrl || ''}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#DBD0C0]">{selectedFile.name}</p>
              <p className="text-xs text-[#CEA17A]/70">
                {Math.round(selectedFile.size / 1024 / 1024 * 100) / 100} MB
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadState.isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[#CEA17A]">
                <span>Uploading...</span>
                <span>{uploadState.progress}%</span>
              </div>
              <div className="w-full bg-[#19171b] rounded-full h-2">
                <div 
                  className="bg-[#CEA17A] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadState.success && (
            <div className="flex items-center space-x-2 text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Upload successful!</span>
            </div>
          )}

          {/* Error Message */}
          {uploadState.error && (
            <div className="flex items-center space-x-2 text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{uploadState.error}</span>
            </div>
          )}

          {/* Action Buttons */}
          {!uploadState.isUploading && !uploadState.success && (
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleUpload(selectedFile)}
                className="px-4 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 rounded-lg hover:bg-[#CEA17A]/25 transition-colors"
                disabled={disabled}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setUploadState({ isUploading: false, progress: 0, error: null, success: false });
                }}
                className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                disabled={disabled}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
