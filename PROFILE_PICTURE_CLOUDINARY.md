# Profile Picture Upload with Cloudinary

## Overview

Added profile picture upload functionality using your existing Cloudinary setup. Profile pictures are now uploaded to Cloudinary (same as portfolio images) instead of Firebase Storage.

## What Was Added

### 1. Cloudinary Service Enhancements

**File**: `src/services/cloudinaryService.ts`

Added profile picture specific methods:

```typescript
// Upload profile picture to Cloudinary
async uploadProfilePicture(imageUri: string, userId: string): Promise<CloudinaryUploadResult>

// Get profile picture URL with circular crop and face detection
getProfilePictureUrl(publicId: string, size: number = 200): string

// Get profile picture URLs in different sizes
getProfilePictureUrls(publicId: string): {
  small: string;    // 50x50
  medium: string;   // 100x100
  large: string;    // 200x200
  xlarge: string;   // 400x400
}
```

**Features**:
- ✅ Automatic circular crop (`r_max`)
- ✅ Face detection for smart cropping (`g_face`)
- ✅ Auto quality optimization (`q_auto`)
- ✅ Auto format selection (`f_auto`)
- ✅ Organized in `profile_pictures/{userId}/` folder
- ✅ Tagged with `profile_picture` and `userId`

### 2. Reusable ProfilePictureUpload Component

**File**: `src/components/ProfilePictureUpload.tsx`

A complete, reusable component for profile picture uploads:

```typescript
<ProfilePictureUpload
  userId={user?.id || ''}
  currentImageUrl={user?.profileImage}
  currentPublicId={user?.profileImagePublicId}
  onUploadSuccess={(imageUrl, publicId) => {
    // Handle upload success
  }}
  size={100}
  showEditButton={true}
/>
```

**Features**:
- ✅ Camera or gallery selection
- ✅ Image cropping (1:1 aspect ratio)
- ✅ Upload progress indicator
- ✅ Circular avatar display
- ✅ Edit button overlay
- ✅ Automatic Firestore update
- ✅ Error handling with alerts
- ✅ Optimized image loading from Cloudinary

### 3. Updated Screens

#### Stylist Profile Screen
**File**: `src/screens/stylist/StylistProfileScreen.tsx`

- ✅ Replaced Firebase Storage with Cloudinary
- ✅ Uses ProfilePictureUpload component
- ✅ Stores both `profileImage` URL and `profileImagePublicId`
- ✅ Updates Redux state and AsyncStorage

#### Client Profile Screen
**File**: `src/screens/client/ProfileScreen.tsx`

- Ready to add ProfilePictureUpload component (same as stylist)

## Cloudinary Transformations

### Profile Picture URL Format

```
https://res.cloudinary.com/{cloud_name}/image/upload/
  c_fill,        // Crop to fill
  w_200,         // Width 200px
  h_200,         // Height 200px
  g_face,        // Focus on face
  r_max,         // Maximum radius (circular)
  q_auto,        // Auto quality
  f_auto/        // Auto format
  {public_id}
```

### Example URLs

**Small (50x50)**:
```
https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_50,h_50,g_face,r_max,q_auto,f_auto/profile_pictures/user123/abc123.jpg
```

**Large (200x200)**:
```
https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_200,h_200,g_face,r_max,q_auto,f_auto/profile_pictures/user123/abc123.jpg
```

## Firestore Schema

Profile pictures are stored in the `users` collection:

```typescript
{
  profileImage: string;              // Full Cloudinary URL
  profileImagePublicId: string;      // Cloudinary public ID
  profileImageUpdatedAt: Timestamp;  // Last update time
}
```

## How It Works

### Upload Flow

```
1. User clicks avatar/camera button
   ↓
2. Alert shows: "Take Photo" or "Choose from Gallery"
   ↓
3. Image picker opens (with 1:1 crop)
   ↓
4. Image selected
   ↓
5. Upload to Cloudinary (with progress indicator)
   ↓
6. Firestore updated with URL + publicId
   ↓
7. Redux state updated
   ↓
8. AsyncStorage updated
   ↓
9. UI refreshes with new image
```

### Display Flow

```
1. Check if profileImagePublicId exists
   ↓
2. If yes: Generate optimized URL from Cloudinary
   ↓
3. If no: Use profileImage URL directly
   ↓
4. If neither: Show placeholder avatar
```

## Benefits Over Firebase Storage

| Feature | Firebase Storage | Cloudinary |
|---------|-----------------|------------|
| **Image Optimization** | Manual | Automatic |
| **Circular Crop** | Manual | Automatic |
| **Face Detection** | ❌ | ✅ |
| **Multiple Sizes** | Manual | On-the-fly |
| **CDN** | ✅ | ✅ |
| **Transformations** | ❌ | ✅ |
| **Cost** | Pay per GB | Free tier generous |

## Usage Examples

### In Any Screen

```typescript
import ProfilePictureUpload from '../components/ProfilePictureUpload';

// In your component
<ProfilePictureUpload
  userId={user?.id || ''}
  currentImageUrl={user?.profileImage}
  currentPublicId={user?.profileImagePublicId}
  onUploadSuccess={async (imageUrl, publicId) => {
    // Update Redux
    const updatedUser = { 
      ...user, 
      profileImage: imageUrl,
      profileImagePublicId: publicId,
    };
    updateUserProfile(updatedUser);
    
    // Update AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  }}
  size={120}  // Avatar size in pixels
  showEditButton={true}
/>
```

### Get Optimized URLs

```typescript
import { cloudinaryService } from '../services/cloudinaryService';

// Single size
const avatarUrl = cloudinaryService.getProfilePictureUrl(publicId, 100);

// Multiple sizes
const urls = cloudinaryService.getProfilePictureUrls(publicId);
console.log(urls.small);   // 50x50
console.log(urls.medium);  // 100x100
console.log(urls.large);   // 200x200
console.log(urls.xlarge);  // 400x400
```

## File Organization in Cloudinary

```
cloudinary/
└── profile_pictures/
    ├── user_abc123/
    │   └── profile_1234567890.jpg
    ├── user_def456/
    │   └── profile_1234567891.jpg
    └── user_ghi789/
        └── profile_1234567892.jpg
```

## Testing

1. ✅ Upload from camera
2. ✅ Upload from gallery
3. ✅ Image cropping (1:1)
4. ✅ Upload progress indicator
5. ✅ Firestore update
6. ✅ Redux state update
7. ✅ AsyncStorage update
8. ✅ UI refresh
9. ✅ Circular display
10. ✅ Face detection centering
11. ✅ Multiple sizes generation
12. ✅ Error handling

## Next Steps

To add profile picture upload to Client Profile Screen:

1. Import the component:
   ```typescript
   import ProfilePictureUpload from '../../components/ProfilePictureUpload';
   ```

2. Add to the profile header:
   ```typescript
   <ProfilePictureUpload
     userId={user?.id || ''}
     currentImageUrl={user?.profileImage}
     currentPublicId={user?.profileImagePublicId}
     onUploadSuccess={handleProfilePictureUpload}
     size={100}
     showEditButton={true}
   />
   ```

3. Add the handler:
   ```typescript
   const handleProfilePictureUpload = async (imageUrl: string, publicId: string) => {
     const updatedUser = { ...user, profileImage: imageUrl, profileImagePublicId: publicId };
     updateUserProfile(updatedUser);
     await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
   };
   ```

## Environment Variables

Make sure these are set in your `.env`:

```bash
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
EXPO_PUBLIC_CLOUDINARY_API_KEY=your_api_key
```

## Notes

- Profile pictures are automatically optimized for web and mobile
- Face detection ensures faces are centered in circular crops
- Multiple sizes are generated on-the-fly (no storage overhead)
- Old images are kept in Cloudinary (manual cleanup needed if desired)
- Component is fully reusable across all user types (client, stylist, admin)
