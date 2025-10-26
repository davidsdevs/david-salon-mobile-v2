# 🚀 Cloudinary Quick Start (5 Minutes)

**For:** Stylist Portfolio Image Uploads

---

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Create Cloudinary Account
1. Go to: https://cloudinary.com/users/register_free
2. Sign up (Free plan - 25GB storage)
3. Note your **Cloud Name** from dashboard

### 2️⃣ Create Upload Preset
1. Settings → Upload → Upload presets
2. Click "Add upload preset"
3. Set:
   - Name: `stylist_portfolio`
   - Signing mode: **Unsigned**
   - Folder: `salon/portfolios`
4. Save

### 3️⃣ Add to .env File
Add these 3 lines to your `.env` file:

```env
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name-here
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=stylist_portfolio
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key-here
```

**Then restart Expo:**
```bash
expo start -c
```

---

## ✅ Done!

Your app can now upload images to Cloudinary.

**Test it:**
1. Open app as stylist
2. Go to Portfolio
3. Upload a photo
4. Check Cloudinary Dashboard → Media Library

---

## 📖 Full Guide

For detailed instructions, see: `CLOUDINARY_SETUP_GUIDE.md`

---

## 🆘 Need Help?

**Common Issues:**

**"Upload preset not found"**
→ Make sure preset is set to "Unsigned"

**"Invalid cloud name"**
→ Check spelling in `.env` file

**Images not uploading**
→ Restart Expo after changing `.env`

---

**That's it! Happy uploading! 📸**
