/**
 * ProfilePictureUpload Component
 * 
 * Reusable component for uploading profile pictures to Cloudinary
 * Features:
 * - Camera or gallery selection
 * - Image cropping (1:1 aspect ratio)
 * - Upload to Cloudinary with circular crop
 * - Firestore update
 * - Redux state update
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { cloudinaryService } from '../services/cloudinaryService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, FONTS } from '../constants';

interface ProfilePictureUploadProps {
  userId: string;
  currentImageUrl?: string;
  currentPublicId?: string;
  onUploadSuccess: (imageUrl: string, publicId: string) => void;
  size?: number;
  showEditButton?: boolean;
}

export default function ProfilePictureUpload({
  userId,
  currentImageUrl,
  currentPublicId,
  onUploadSuccess,
  size = 120,
  showEditButton = true,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUploadPress = () => {
    Alert.alert(
      'Upload Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => handleImagePick('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => handleImagePick('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleImagePick = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        // Request camera permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
          return;
        }

        // Launch camera
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        // Request gallery permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need gallery permissions to choose a photo.');
          return;
        }

        // Launch gallery
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      await uploadImage(result.assets[0].uri);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);
      console.log('📤 Uploading profile picture to Cloudinary...');

      // Upload to Cloudinary
      const uploadResult = await cloudinaryService.uploadProfilePicture(imageUri, userId);
      console.log('✅ Profile picture uploaded:', uploadResult.secureUrl);

      // Update Firestore
      if (userId) {
        await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
          profileImage: uploadResult.secureUrl,
          profileImagePublicId: uploadResult.publicId,
          profileImageUpdatedAt: new Date(),
        });
      }

      // Notify parent component
      onUploadSuccess(uploadResult.secureUrl, uploadResult.publicId);

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Get optimized image URL from Cloudinary
  const getImageUrl = () => {
    if (currentPublicId) {
      return cloudinaryService.getProfilePictureUrl(currentPublicId, size);
    }
    return currentImageUrl;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.avatarContainer, { width: size, height: size }]}
        onPress={handleUploadPress}
        disabled={uploading}
      >
        {uploading ? (
          <View style={[styles.loadingContainer, { width: size, height: size }]}>
            <ActivityIndicator size="large" color={APP_CONFIG.primaryColor} />
          </View>
        ) : getImageUrl() ? (
          <Image
            source={{ uri: getImageUrl() }}
            style={[styles.avatar, { width: size, height: size }]}
          />
        ) : (
          <View style={[styles.placeholderAvatar, { width: size, height: size }]}>
            <Ionicons name="person" size={size * 0.5} color="#9CA3AF" />
          </View>
        )}

        {showEditButton && !uploading && (
          <View style={styles.editButton}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {uploading && (
        <Text style={styles.uploadingText}>Uploading...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 1000,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    borderRadius: 1000,
  },
  placeholderAvatar: {
    borderRadius: 1000,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    borderRadius: 1000,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: APP_CONFIG.primaryColor,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FONTS.medium,
  },
});
