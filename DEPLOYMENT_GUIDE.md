# Firebase Deployment Guide

## Prerequisites Completed ✅
- ✅ `firestore.indexes.json` - Firestore indexes configuration
- ✅ `firestore.rules` - Firestore security rules
- ✅ `firebase.json` - Firebase project configuration
- ✅ `functions/` - Cloud Functions directory
- ✅ `functions/package.json` - Functions dependencies
- ✅ `functions/index.js` - Functions entry point
- ✅ `functions/cleanupOldNotifications.js` - Cleanup function
- ✅ Functions dependencies installed (524 packages)

## Step 1: Install Firebase CLI (If Not Installed)

### Option A: Global Installation (Recommended)
```bash
npm install -g firebase-tools
```

### Option B: Use npx (No Installation Required)
```bash
npx firebase-tools <command>
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

## Step 3: Initialize Firebase Project (If Not Done)

```bash
firebase init
```

Select:
- Firestore
- Functions
- Hosting (optional)
- Storage (optional)

**Important**: When asked about existing files, choose to keep them (we already created them).

## Step 4: Deploy Firestore Indexes

This is **REQUIRED** for the notification optimizations to work:

```bash
firebase deploy --only firestore:indexes
```

Expected output:
```
✔ Deploy complete!

Indexes:
  - notifications (recipientId ASC, createdAt DESC)
  - notifications (recipientId ASC, createdAt ASC)
```

**Note**: Index creation can take 5-15 minutes. You can check status at:
https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes

## Step 5: Deploy Firestore Rules (Optional but Recommended)

```bash
firebase deploy --only firestore:rules
```

This ensures proper security for your Firestore database.

## Step 6: Deploy Cloud Functions (Optional)

Deploy the automatic cleanup function:

```bash
firebase deploy --only functions
```

This will deploy:
- `cleanupOldNotifications` - Runs daily at midnight UTC
- `manualCleanupNotifications` - HTTP callable for manual cleanup

**Note**: Cloud Functions require the Blaze (pay-as-you-go) plan.

## Step 7: Verify Deployment

### Check Firestore Indexes:
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `david-salon-fff6d`
3. Navigate to: Firestore Database → Indexes
4. Verify indexes are created and status is "Enabled"

### Check Cloud Functions (if deployed):
1. Navigate to: Functions
2. Verify `cleanupOldNotifications` is listed
3. Check logs: `firebase functions:log`

## Alternative: Manual Index Creation

If you prefer to create indexes manually via Firebase Console:

1. Go to: https://console.firebase.google.com/project/david-salon-fff6d/firestore/indexes
2. Click "Create Index"
3. Configure:
   - **Collection ID**: `notifications`
   - **Field 1**: `recipientId` (Ascending)
   - **Field 2**: `createdAt` (Descending)
   - **Query scope**: Collection
4. Click "Create"
5. Wait 5-15 minutes for index to build

## Troubleshooting

### Error: "Firebase CLI not found"
**Solution**: Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

### Error: "Not authorized"
**Solution**: Login again:
```bash
firebase logout
firebase login
```

### Error: "Project not found"
**Solution**: Set the correct project:
```bash
firebase use david-salon-fff6d
```

Or add `.firebaserc`:
```json
{
  "projects": {
    "default": "david-salon-fff6d"
  }
}
```

### Error: "Functions require Blaze plan"
**Solution**: 
- Upgrade to Blaze plan in Firebase Console
- Or skip Cloud Functions deployment (indexes are more important)

### Error: "Index already exists"
**Solution**: This is fine! It means the index is already created.

## Quick Commands Reference

```bash
# Check Firebase CLI version
firebase --version

# List Firebase projects
firebase projects:list

# Check current project
firebase use

# Deploy everything
firebase deploy

# Deploy only indexes
firebase deploy --only firestore:indexes

# Deploy only rules
firebase deploy --only firestore:rules

# Deploy only functions
firebase deploy --only functions

# View function logs
firebase functions:log

# Test functions locally
cd functions
npm run serve
```

## Cost Estimate

### Firestore Indexes:
- **Free**: No additional cost for indexes

### Cloud Functions:
- **Free tier**: 2M invocations/month, 400K GB-seconds/month
- **Daily cleanup**: ~30 invocations/month (well within free tier)
- **Manual cleanup**: Pay only when called

### Expected Monthly Cost:
- **With free tier**: $0
- **Beyond free tier**: ~$0.10-0.50/month (very unlikely)

## What Happens After Deployment?

### Firestore Indexes:
1. Queries become 10-100x faster
2. No more "missing index" errors
3. Notifications load instantly

### Cloud Functions:
1. Old notifications (>90 days) deleted automatically
2. Runs daily at midnight UTC
3. Keeps Firestore lean and reduces costs

## Testing the Deployment

### Test Indexes:
1. Open the app
2. Navigate to Stylist Notifications
3. Should load without errors
4. Check console for: "✅ Real-time notifications updated"

### Test Cloud Function (if deployed):
```javascript
// In your app
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const cleanup = httpsCallable(functions, 'manualCleanupNotifications');

const result = await cleanup({ daysAgo: 90 });
console.log(result.data.message);
```

## Next Steps After Deployment

1. ✅ Verify indexes are enabled in Firebase Console
2. ✅ Test notification loading in the app
3. ✅ Monitor function execution (if deployed)
4. ✅ Set up billing alerts (optional)
5. ✅ Schedule regular backups (optional)

## Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Run `firebase functions:log` to see function logs
3. Verify your Firebase project ID is correct
4. Ensure billing is enabled for Cloud Functions

## Summary

**Minimum Required**: Deploy Firestore indexes
```bash
firebase deploy --only firestore:indexes
```

**Recommended**: Deploy indexes + rules
```bash
firebase deploy --only firestore:indexes,firestore:rules
```

**Full Setup**: Deploy everything
```bash
firebase deploy
```

---

**Status**: Ready to deploy! All configuration files are created and dependencies are installed.
