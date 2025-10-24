# How to Fix Email Service Error

## Current Issue
```
ERROR  ❌ Error calling YOUR Nodemailer backend: [TypeError: Network request failed]
```

The app is trying to send emails through a backend server that isn't running.

---

## ✅ Solution 1: Start the Backend Server (Recommended)

### Step 1: Install Backend Dependencies
Open a **new terminal** and run:
```bash
cd c:\Users\Oj\Documents\david-salon-mobile-expo
npm install express nodemailer cors
```

### Step 2: Start the Backend Server
In the same terminal, run:
```bash
node backend-server.js
```

You should see:
```
✅ SMTP Server is ready to take our messages
🚀 Email backend server running on http://localhost:3001
```

### Step 3: Keep Server Running
**Important:** Keep this terminal window open while using the app. The backend server needs to be running for emails to work.

---

## ✅ Solution 2: Disable Email Notifications (Quick Fix)

If you don't need email functionality right now, you can temporarily disable it:

### Edit `src/screens/client/BookingSummaryScreen.tsx`

Find line 26:
```typescript
import RealEmailService, { AppointmentEmailData } from '../../services/realEmailService';
```

Comment it out and use SimpleEmailService instead:
```typescript
// import RealEmailService, { AppointmentEmailData } from '../../services/realEmailService';
import SimpleEmailService, { AppointmentEmailData } from '../../services/simpleEmailService';
```

Then find where `RealEmailService` is used (around line 280) and change it to:
```typescript
// const emailSent = await RealEmailService.sendAppointmentConfirmation(emailData);
const emailSent = await SimpleEmailService.sendAppointmentConfirmation(emailData);
```

**Note:** SimpleEmailService will just log to console instead of actually sending emails.

---

## 📧 Email Configuration

The backend server is configured to use Gmail SMTP with these credentials:
- **Email:** chicorlcruz@gmail.com
- **App Password:** kflf nqdl mbfq opqv

**Important:** Make sure this Gmail account has:
1. 2-Step Verification enabled
2. App Password generated (not your regular password)
3. "Less secure app access" is NOT needed for app passwords

---

## 🔍 Troubleshooting

### If backend server fails to start:
1. Make sure port 3001 is not already in use
2. Check if dependencies are installed: `npm list express nodemailer cors`
3. Check the backend-server.js file for syntax errors

### If emails still don't send:
1. Verify Gmail credentials are correct
2. Check if the app password is still valid
3. Look at the backend server console for error messages
4. Check your Gmail account's security settings

---

## 📝 Recommended Setup

For development, I recommend:
1. Start the backend server in a separate terminal
2. Keep it running while developing
3. The app will automatically send emails when appointments are booked

For production:
1. Deploy the backend server to a hosting service (Heroku, Railway, etc.)
2. Update the `BACKEND_API_URL` in `realEmailService.ts` to point to your deployed backend
