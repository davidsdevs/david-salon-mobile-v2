/**
 * Cloudinary Service
 * 
 * Handles image uploads to Cloudinary for stylist portfolios
 * Uses Cloudinary's unsigned upload preset for mobile apps
 */

import { Platform } from 'react-native';

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = process.env['EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME'] || '';
const CLOUDINARY_UPLOAD_PRESET = process.env['EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET'] || '';
const CLOUDINARY_API_KEY = process.env['EXPO_PUBLIC_CLOUDINARY_API_KEY'] || '';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
  createdAt: string;
  bytes: number;
  thumbnailUrl: string;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
  transformation?: string;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private apiKey: string;

  constructor() {
    this.cloudName = CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = CLOUDINARY_UPLOAD_PRESET;
    this.apiKey = CLOUDINARY_API_KEY;
  }

  /**
   * Validate Cloudinary configuration
   */
  validateConfig(): boolean {
    if (!this.cloudName || !this.uploadPreset) {
      console.error('❌ Cloudinary configuration missing. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env');
      return false;
    }
    return true;
  }

  /**
   * Upload image to Cloudinary
   * @param imageUri - Local image URI from image picker
   * @param options - Upload options (folder, tags, etc.)
   */
  async uploadImage(
    imageUri: string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.validateConfig()) {
      throw new Error('Cloudinary configuration is missing');
    }

    try {
      // Create form data
      const formData = new FormData();
      
      // Add image file
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
        type,
        name: filename,
      } as any);

      // Add upload preset (required for unsigned uploads)
      formData.append('upload_preset', this.uploadPreset);

      // Add optional parameters
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.tags && options.tags.length > 0) {
        formData.append('tags', options.tags.join(','));
      }

      if (options.context) {
        const contextString = Object.entries(options.context)
          .map(([key, value]) => `${key}=${value}`)
          .join('|');
        formData.append('context', contextString);
      }

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
      
      console.log('📤 Uploading image to Cloudinary...');
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Image uploaded successfully:', data.secure_url);

      // Return formatted result
      return {
        url: data.url,
        secureUrl: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        resourceType: data.resource_type,
        createdAt: data.created_at,
        bytes: data.bytes,
        thumbnailUrl: this.getThumbnailUrl(data.public_id),
      };
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images
   * @param imageUris - Array of local image URIs
   * @param options - Upload options
   */
  async uploadMultipleImages(
    imageUris: string[],
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    console.log(`📤 Uploading ${imageUris.length} images to Cloudinary...`);
    
    const uploadPromises = imageUris.map((uri, index) => 
      this.uploadImage(uri, {
        ...options,
        tags: [...(options.tags || []), `batch_${Date.now()}`],
      })
    );

    try {
      const results = await Promise.all(uploadPromises);
      console.log(`✅ Successfully uploaded ${results.length} images`);
      return results;
    } catch (error) {
      console.error('❌ Error uploading multiple images:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   * @param publicId - Public ID of the image to delete
   */
  async deleteImage(publicId: string): Promise<void> {
    if (!this.validateConfig()) {
      throw new Error('Cloudinary configuration is missing');
    }

    try {
      // Note: Deletion requires authentication, so this should be done server-side
      // For now, we'll just log it. Implement server-side deletion via Cloud Functions
      console.warn('⚠️ Image deletion should be handled server-side for security');
      console.log('🗑️ Image marked for deletion:', publicId);
      
      // TODO: Call Cloud Function to delete image
      // await fetch('YOUR_CLOUD_FUNCTION_URL/deleteImage', {
      //   method: 'POST',
      //   body: JSON.stringify({ publicId }),
      // });
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Get thumbnail URL for an image
   * @param publicId - Public ID of the image
   * @param width - Thumbnail width (default: 200)
   * @param height - Thumbnail height (default: 200)
   */
  getThumbnailUrl(publicId: string, width: number = 200, height: number = 200): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${publicId}`;
  }

  /**
   * Get optimized image URL
   * @param publicId - Public ID of the image
   * @param transformation - Cloudinary transformation string
   */
  getOptimizedUrl(publicId: string, transformation?: string): string {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    const defaultTransform = 'q_auto,f_auto';
    const transform = transformation || defaultTransform;
    return `${baseUrl}/${transform}/${publicId}`;
  }

  /**
   * Get responsive image URLs for different screen sizes
   * @param publicId - Public ID of the image
   */
  getResponsiveUrls(publicId: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: this.getThumbnailUrl(publicId, 150, 150),
      small: this.getOptimizedUrl(publicId, 'w_400,h_400,c_limit,q_auto,f_auto'),
      medium: this.getOptimizedUrl(publicId, 'w_800,h_800,c_limit,q_auto,f_auto'),
      large: this.getOptimizedUrl(publicId, 'w_1200,h_1200,c_limit,q_auto,f_auto'),
      original: this.getOptimizedUrl(publicId),
    };
  }

  /**
   * Upload profile picture with circular crop
   * @param imageUri - Local image URI from image picker
   * @param userId - User ID for folder organization
   */
  async uploadProfilePicture(
    imageUri: string,
    userId: string
  ): Promise<CloudinaryUploadResult> {
    return this.uploadImage(imageUri, {
      folder: `profile_pictures/${userId}`,
      tags: ['profile_picture', userId],
      context: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * Get profile picture URL with circular crop
   * @param publicId - Public ID of the profile image
   * @param size - Size of the profile picture (default: 200)
   */
  getProfilePictureUrl(publicId: string, size: number = 200): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/c_fill,w_${size},h_${size},g_face,r_max,q_auto,f_auto/${publicId}`;
  }

  /**
   * Get profile picture URLs in different sizes
   * @param publicId - Public ID of the profile image
   */
  getProfilePictureUrls(publicId: string): {
    small: string;    // 50x50
    medium: string;   // 100x100
    large: string;    // 200x200
    xlarge: string;   // 400x400
  } {
    return {
      small: this.getProfilePictureUrl(publicId, 50),
      medium: this.getProfilePictureUrl(publicId, 100),
      large: this.getProfilePictureUrl(publicId, 200),
      xlarge: this.getProfilePictureUrl(publicId, 400),
    };
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
