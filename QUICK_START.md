# 🚀 Quick Start Guide - Upload to GitHub

## ⚡ 3-Minute Upload Guide

### 🔴 STEP 1: Create `.env` File (CRITICAL!)

```bash
# Copy the template
cp .env.example .env
```

**Edit `.env` and add your credentials:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC-6AX8N96wuqEL-p0rQmJFiS-OZ9JEqGo
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=david-salon-fff6d.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=david-salon-fff6d
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=david-salon-fff6d.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=248565145509
EXPO_PUBLIC_FIREBASE_APP_ID=1:248565145509:web:a7861697801ebf3848524c
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-PB1LMRZD7J
```

### ✅ STEP 2: Test Your App

```bash
npm install
npm start
```

**Verify it works!** If you see errors about Firebase, check your `.env` file.

### 📤 STEP 3: Upload to GitHub

```bash
# 1. Initialize Git
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "feat: initial commit - salon management app"

# 4. Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/david-salon-mobile-expo.git
git branch -M main
git push -u origin main
```

### 🔍 STEP 4: Verify

Go to your GitHub repo and check:
- ✅ `.env.example` is visible
- ❌ `.env` is **NOT** visible
- ✅ All source code is there

---

## 📚 Need More Details?

- **Full checklist**: See `GITHUB_UPLOAD_CHECKLIST.md`
- **Complete summary**: See `UPLOAD_SUMMARY.md`
- **Contributing**: See `CONTRIBUTING.md`
- **Setup guide**: See `README.md`

## ⚠️ Important Reminders

1. **NEVER** commit your `.env` file
2. **ALWAYS** use `.env.example` as template
3. **TEST** before uploading
4. **VERIFY** after uploading

---

**That's it! You're ready to go! 🎉**
