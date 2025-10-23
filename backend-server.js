// Simple Node.js backend server for sending emails
// Run this with: node backend-server.js

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Your Gmail SMTP configuration
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'chicorlcruz@gmail.com',
    pass: 'kflf nqdl mbfq opqv' // Your Gmail app password
  }
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Test email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to take our messages');
  }
});

// Email sending endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { smtp, email } = req.body;
    
    console.log('📧 Received email request:', {
      to: email.to,
      subject: email.subject
    });
    
    // Send email using Nodemailer
    const result = await transporter.sendMail({
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html
    });
    
    console.log('✅ Email sent successfully:', result.messageId);
    
    res.json({
      success: true,
      messageId: result.messageId,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send email'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Email server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email server running on http://localhost:${PORT}`);
  console.log(`📧 Ready to send emails using Gmail SMTP`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
