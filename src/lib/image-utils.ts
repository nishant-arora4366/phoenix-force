import sharp from 'sharp';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxFileSize?: number; // in bytes
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Process and compress an image for profile pictures
 */
export async function processProfileImage(
  inputBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    width = 400,
    height = 400,
    quality = 85,
    format = 'jpeg',
    maxFileSize = 15 * 1024 * 1024 // 15MB
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: unable to read dimensions');
    }

    // Check if image is too large
    if (inputBuffer.length > maxFileSize) {
      throw new Error(`Image too large: ${Math.round(inputBuffer.length / 1024 / 1024)}MB. Maximum allowed: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    }

    // Check if image format is supported
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !supportedFormats.includes(metadata.format)) {
      throw new Error(`Unsupported image format: ${metadata.format}. Supported formats: ${supportedFormats.join(', ')}`);
    }

    // Process the image
    let processedImage = sharp(inputBuffer);

    // Log original dimensions
    console.log(`Original image: ${metadata.width}x${metadata.height}`);

    // Resize and crop to square (center crop)
    processedImage = processedImage.resize(width, height, {
      fit: 'cover',
      position: 'center'
    });

    console.log(`Processing image to: ${width}x${height} with center crop`);

    // Convert to specified format and apply quality
    switch (format) {
      case 'jpeg':
        processedImage = processedImage.jpeg({ quality, progressive: true });
        break;
      case 'png':
        processedImage = processedImage.png({ quality, progressive: true });
        break;
      case 'webp':
        processedImage = processedImage.webp({ quality });
        break;
    }

    // Get the processed buffer
    const processedBuffer = await processedImage.toBuffer();
    
    // Get final metadata
    const finalMetadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      metadata: {
        width: finalMetadata.width || width,
        height: finalMetadata.height || height,
        format: finalMetadata.format || format,
        size: processedBuffer.length
      }
    };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
    throw new Error('Image processing failed: Unknown error');
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size (15MB limit)
  const maxSize = 15 * 1024 * 1024; // 15MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum allowed: 15MB`
    };
  }

  // Check minimum size (1KB)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return {
      valid: false,
      error: 'File too small: minimum 1KB required'
    };
  }

  return { valid: true };
}

/**
 * Generate a unique filename for profile pictures
 */
export function generateProfilePictureFilename(userId: string, format: string = 'jpg'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${userId}/${timestamp}-${random}.${format}`;
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };
  
  return mimeToExt[mimeType] || 'jpg';
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}
