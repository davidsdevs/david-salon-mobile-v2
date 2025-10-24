# 📧 Email Setup Instructions - Nodemailer with Gmail SMTP

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Backend Dependencies
```bash
# In your project root directory
npm install express nodemailer cors
npm install -D nodemon
```

### Step 2: Start the Email Backend Server
```bash
# Start the backend server
node backend-server.js
```

You should see:
```
🚀 Email server running on http://localhost:3001
📧 Ready to send emails using Gmail SMTP
🔗 Health check: http://localhost:3001/health
✅ SMTP Server is ready to take our messages
```

### Step 3: Test the Setup
1. Open your mobile app
2. Book an appointment
3. Check the console logs for email sending status
4. Check the recipient's email inbox

## 🔧 How It Works

### Architecture:
```
Mobile App → Backend API → Nodemailer → Gmail SMTP → Recipient's Email
```

### Files Created:
- `backend-server.js` - Node.js server with Nodemailer
- `src/services/backendEmailService.ts` - Mobile app service
- `backend-package.json` - Backend dependencies

### Your Gmail SMTP Configuration:
- **Email:** `chicorlcruz@gmail.com`
- **Password:** `kflf nqdl mbfq opqv` (Gmail app password)
- **Host:** `smtp.gmail.com`
- **Port:** `587`

## 🧪 Testing

### Test Backend Server:
```bash
curl http://localhost:3001/health
```

### Test Email Sending:
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "chicorlcruz@gmail.com",
        "pass": "kflf nqdl mbfq opqv"
      }
    },
    "email": {
      "from": "David'\''s Salon <chicorlcruz@gmail.com>",
      "to": "test@example.com",
      "subject": "Test Email",
      "text": "This is a test email",
      "html": "<h1>Test Email</h1>"
    }
  }'
```

## 🎯 Production Deployment

### Option 1: Deploy Backend to Cloud
- **Heroku:** `git push heroku main`
- **Railway:** Connect GitHub repo
- **Vercel:** Deploy as serverless function
- **AWS:** EC2 instance

### Option 2: Use Existing Backend
- Update `BACKEND_API_URL` in `backendEmailService.ts`
- Point to your existing backend API

## 🔒 Security Notes

### Gmail App Password:
- ✅ Using Gmail app password (secure)
- ✅ Not using main Gmail password
- ✅ Can be revoked anytime

### Backend Security:
- Add authentication to `/send-email` endpoint
- Use environment variables for credentials
- Add rate limiting
- Use HTTPS in production

## 🐛 Troubleshooting

### Common Issues:

1. **"SMTP Error"**
   - Check Gmail app password
   - Enable "Less secure app access" (if needed)
   - Check firewall/antivirus blocking port 587

2. **"Connection refused"**
   - Make sure backend server is running
   - Check if port 3001 is available
   - Try different port if needed

3. **"Email not received"**
   - Check spam folder
   - Verify recipient email address
   - Check Gmail sending limits

### Debug Commands:
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check backend logs
node backend-server.js

# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'chicorlcruz@gmail.com', pass: 'kflf nqdl mbfq opqv' }
});
transporter.verify(console.log);
"
```

## ✅ Success Indicators

When working correctly, you'll see:
- Backend server starts without errors
- "✅ SMTP Server is ready" message
- Mobile app logs show "✅ Email sent successfully"
- Recipient receives beautiful HTML email
- Email contains all appointment details

## 🎉 You're All Set!

Your email system is now fully functional with:
- ✅ Nodemailer integration
- ✅ Gmail SMTP with your credentials
- ✅ Beautiful HTML email templates
- ✅ Mobile app compatibility
- ✅ Real email sending (not just logging)

**Next:** Book an appointment and check your email! 📧✨