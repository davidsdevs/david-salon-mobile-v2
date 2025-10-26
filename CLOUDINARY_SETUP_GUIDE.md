# 📸 Cloudinary Setup Guide - Stylist Portfolios

**Date:** October 26, 2025  
**Purpose:** Image hosting and optimization for stylist portfolio photos

---

## 🎯 Why Cloudinary?

### Benefits:
- ✅ **Free tier:** 25GB storage, 25GB bandwidth/month
- ✅ **Automatic optimization:** Images are compressed and served in optimal format
- ✅ **Responsive images:** Different sizes for different devices
- ✅ **Fast CDN:** Global content delivery network
- ✅ **Transformations:** Resize, crop, filters on-the-fly
- ✅ **No Firebase Storage costs:** Offload image storage from Firebase

---

## 📋 Step 1: Create Cloudinary Account

### 1.1 Sign Up
1. Go to https://cloudinary.com/users/register_free
2. Sign up with email or Google
3. Choose **Free Plan** (25GB storage)

### 1.2 Get Your Credentials
After signing up, go to **Dashboard**:

```
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123
```

**Save these!** You'll need them in Step 3.

---

## 📋 Step 2: Create Upload Preset

Upload presets allow **unsigned uploads** from mobile apps (secure and easy).

### 2.1 Navigate to Settings
1. Click **Settings** (gear icon) in top-right
2. Go to **Upload** tab
3. Scroll to **Upload presets** section

### 2.2 Create New Preset
1. Click **Add upload preset**
2. Configure:
   ```
   Preset name: stylist_portfolio
   Signing mode: Unsigned
   Folder: salon/portfolios
   ```

3. **Advanced settings:**
   ```
   Format: Auto (jpg, png, webp)
   Quality: Auto
   Max file size: 10 MB
   Allowed formats: jpg, png, webp
   ```

4. **Transformations** (optional):
   ```
   Incoming transformation:
   - Width: 1200
   - Height: 1200
   - Crop: limit
   - Quality: auto
   ```

5. Click **Save**

### 2.3 Copy Preset Name
Your preset name will be: `stylist_portfolio`

---

## 📋 Step 3: Add Credentials to .env

### 3.1 Open Your .env File
```bash
# Location: david-salon-mobile-v2/.env
```

### 3.2 Add Cloudinary Configuration
Add these lines to your `.env` file:

```env
# Cloudinary Configuration (for stylist portfolios)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=stylist_portfolio
EXPO_PUBLIC_CLOUDINARY_API_KEY=123456789012345
```

**Replace with your actual values:**
- `your-cloud-name` → Your Cloud Name from Dashboard
- `stylist_portfolio` → Your upload preset name
- `123456789012345` → Your API Key from Dashboard

### 3.3 Example
```env
# Cloudinary Configuration (for stylist portfolios)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=davidsalon
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=stylist_portfolio
EXPO_PUBLIC_CLOUDINARY_API_KEY=987654321098765
```

---

## 📋 Step 4: Restart Expo

After adding environment variables:

```bash
# Stop Expo (Ctrl+C)

# Clear cache and restart
expo start -c
```

---

## 🧪 Step 5: Test Upload

### 5.1 Test in App
1. Open app as a **Stylist**
2. Go to **Portfolio** screen
3. Click **Add Photo** or **Upload** button
4. Select an image from gallery
5. Image should upload to Cloudinary

### 5.2 Verify in Cloudinary
1. Go to Cloudinary Dashboard
2. Click **Media Library**
3. Navigate to `salon/portfolios` folder
4. Your uploaded image should appear

---

## 📊 Cloudinary Features Used

### Image Upload
```typescript
import { cloudinaryService } from '@/services/cloudinaryService';

// Upload single image
const result = await cloudinaryService.uploadImage(imageUri, {
  folder: 'salon/portfolios',
  tags: ['stylist', userId],
});

// Result contains:
// - secureUrl: Full HTTPS URL
// - publicId: Unique identifier
// - thumbnailUrl: 200x200 thumbnail
```

### Get Optimized URLs
```typescript
// Get responsive image URLs
const urls = cloudinaryService.getResponsiveUrls(publicId);

// Returns:
// {
//   thumbnail: '150x150',
//   small: '400x400',
//   medium: '800x800',
//   large: '1200x1200',
//   original: 'full size'
// }
```

### Multiple Uploads
```typescript
// Upload multiple images at once
const results = await cloudinaryService.uploadMultipleImages(
  [uri1, uri2, uri3],
  { folder: 'salon/portfolios' }
);
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use **unsigned upload presets** for mobile apps
- ✅ Set **folder restrictions** in preset settings
- ✅ Set **max file size** limits (10MB recommended)
- ✅ Restrict **allowed formats** (jpg, png, webp only)
- ✅ Keep `.env` file gitignored

### ❌ DON'T:
- ❌ Don't expose API Secret in mobile app
- ❌ Don't allow unlimited file sizes
- ❌ Don't commit `.env` to git
- ❌ Don't use signed uploads from mobile (use server-side)

---

## 📈 Free Tier Limits

Cloudinary Free Plan includes:

| Resource | Limit |
|----------|-------|
| Storage | 25 GB |
| Bandwidth | 25 GB/month |
| Transformations | 25 credits/month |
| Images | Unlimited |
| API Requests | Unlimited |

### Monitoring Usage
1. Go to Cloudinary Dashboard
2. Check **Usage** section
3. Monitor storage and bandwidth

---

## 🛠️ Advanced Configuration (Optional)

### Auto-Tagging
Add automatic tags to uploads:

```typescript
await cloudinaryService.uploadImage(imageUri, {
  folder: 'salon/portfolios',
  tags: [
    `stylist_${stylistId}`,
    `uploaded_${new Date().toISOString()}`,
    'portfolio'
  ],
});
```

### Custom Transformations
Apply transformations on upload:

```typescript
// In upload preset settings:
Incoming Transformation:
- Effect: sharpen
- Quality: auto:best
- Format: auto
- Fetch format: auto
```

### Folder Structure
Organize images by stylist:

```
salon/
├── portfolios/
│   ├── stylist_123/
│   │   ├── image1.jpg
│   │   └── image2.jpg
│   └── stylist_456/
│       └── image1.jpg
```

---

## 🐛 Troubleshooting

### Error: "Upload preset not found"
**Solution:** 
- Check preset name in `.env` matches Cloudinary
- Ensure preset is set to "Unsigned"
- Restart Expo after changing `.env`

### Error: "Invalid cloud name"
**Solution:**
- Verify `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` in `.env`
- Check for typos
- Cloud name is case-sensitive

### Images not uploading
**Solution:**
1. Check internet connection
2. Verify `.env` variables are set
3. Check Cloudinary Dashboard for errors
4. Look at console logs for error messages

### Images upload but don't display
**Solution:**
- Check `secureUrl` is being saved to Firestore
- Verify image URLs are HTTPS (not HTTP)
- Check image format is supported

---

## 📝 Integration with Firestore

### Save to Firestore
After uploading to Cloudinary, save the URL to Firestore:

```typescript
// Upload to Cloudinary
const result = await cloudinaryService.uploadImage(imageUri);

// Save to Firestore
await addDoc(collection(db, 'portfolio'), {
  stylistId: user.id,
  imageUrl: result.secureUrl,
  publicId: result.publicId,
  thumbnailUrl: result.thumbnailUrl,
  width: result.width,
  height: result.height,
  createdAt: serverTimestamp(),
});
```

### Display in App
```typescript
// Use optimized URL for display
const optimizedUrl = cloudinaryService.getOptimizedUrl(
  publicId,
  'w_800,h_800,c_limit,q_auto,f_auto'
);

<Image source={{ uri: optimizedUrl }} />
```

---

## ✅ Checklist

Before going live:

- [ ] Cloudinary account created
- [ ] Upload preset created and set to "Unsigned"
- [ ] Credentials added to `.env` file
- [ ] `.env` file is gitignored
- [ ] Expo restarted after adding credentials
- [ ] Test upload successful
- [ ] Images appear in Cloudinary Media Library
- [ ] Images display correctly in app
- [ ] Firestore integration working

---

## 📞 Support

### Cloudinary Documentation
- Main docs: https://cloudinary.com/documentation
- Upload API: https://cloudinary.com/documentation/upload_images
- Transformations: https://cloudinary.com/documentation/image_transformations

### Common Questions

**Q: Can I delete images?**  
A: Yes, but deletion should be done server-side (Cloud Functions) for security.

**Q: What happens if I exceed free tier?**  
A: Cloudinary will notify you. You can upgrade or optimize usage.

**Q: Can I use my own domain?**  
A: Yes, with paid plans you can use custom CNAME.

**Q: Are images backed up?**  
A: Yes, Cloudinary handles backups automatically.

---

## 🎉 You're All Set!

Your Cloudinary integration is ready! Stylists can now upload portfolio photos that are:
- ✅ Automatically optimized
- ✅ Served from global CDN
- ✅ Responsive for all devices
- ✅ Cost-effective (free tier)

**Next Steps:**
1. Test uploading a few images
2. Monitor usage in Cloudinary Dashboard
3. Customize transformations as needed

---

**Happy uploading! 📸**
