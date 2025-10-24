# 📧 SMTP Email Setup Guide

## 🎯 What You Need to Do

### **Step 1: Choose Your Email Service**

**Option A: Gmail (Easiest)**
1. Go to your Gmail account
2. Enable 2-Factor Authentication
3. Generate an "App Password" (not your regular password)
4. Use these credentials:
   ```typescript
   user: 'your-email@gmail.com'
   pass: 'your-16-character-app-password'
   ```

**Option B: SendGrid (Recommended for Apps)**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Use these credentials:
   ```typescript
   user: 'apikey'
   pass: 'your-sendgrid-api-key'
   ```

**Option C: Mailgun**
1. Sign up at [mailgun.com](https://mailgun.com)
2. Get your SMTP credentials
3. Use your Mailgun username and password

### **Step 2: Update Your Configuration**

Open `src/services/smtpEmailService.ts` and update the SMTP_CONFIG:

```typescript
const SMTP_CONFIG = {
  // For Gmail
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com', // Your Gmail
    pass: 'your-app-password' // Your Gmail app password
  }
};
```

### **Step 3: Install Required Package**

```bash
npm install nodemailer
npm install @types/nodemailer
```

### **Step 4: Update Email Service**

Replace the placeholder in `sendAppointmentConfirmation` with actual SMTP sending:

```typescript
import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransporter(SMTP_CONFIG);

// Send email
await transporter.sendMail({
  from: SMTP_CONFIG.auth.user,
  to: data.clientEmail,
  subject: `Appointment Confirmation - David's Salon`,
  text: emailContent,
  html: htmlContent
});
```

## 🚀 Quick Setup Options

### **Option 1: Use a Backend Service (Recommended)**

Instead of SMTP, use a service like:
- **SendGrid API** (100 emails/day free)
- **Mailgun API** (10,000 emails/month free)
- **AWS SES** (62,000 emails/month free)

### **Option 2: Firebase Functions**

Create a Firebase Function that handles email sending:

```javascript
// functions/index.js
const nodemailer = require('nodemailer');

exports.sendAppointmentEmail = functions.https.onCall(async (data, context) => {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  });

  await transporter.sendMail({
    from: 'your-email@gmail.com',
    to: data.toEmail,
    subject: 'Appointment Confirmation',
    html: generateEmailHTML(data)
  });
});
```

### **Option 3: Keep Current (Development)**

The current setup logs email content to console, which is perfect for development and testing.

## 🎯 Current Status

✅ **Email content is generated** (both text and HTML)
✅ **Mobile app works** without crashes
✅ **Email data is logged** for debugging
✅ **Ready for SMTP integration** when you choose a service

## 📧 Email Features

- ✨ **Beautiful HTML design** with gradients and styling
- 📱 **Mobile responsive** email layout
- 💇‍♀️ **Complete appointment details**
- 🎨 **Professional salon branding**
- 📞 **Contact information**
- 📋 **Cancellation policy**

**Your email service is ready to be connected to any SMTP provider! 🚀**
