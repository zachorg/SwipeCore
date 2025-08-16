// Simple OTP Backend Example
// This shows how to implement the endpoints your frontend is calling

const express = require('express');
const app = express();
app.use(express.json());

// In-memory storage for demo (use database in production)
const otpStore = new Map();
const userStore = new Map();

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
app.post('/api/otp/send', (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const verificationId = Date.now().toString();

    // Store OTP (in production, use database + expiration)
    otpStore.set(verificationId, {
      phone,
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    // TODO: Integrate with SMS service (Twilio, MessageBird, etc.)
    console.log(`SMS to ${phone}: Your verification code is ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      verificationId,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});

// Verify OTP endpoint
app.post('/api/otp/verify', (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and code are required',
      });
    }

    // Find stored OTP
    let foundVerification = null;
    for (const [verificationId, verification] of otpStore.entries()) {
      if (verification.phone === phone && verification.otp === code) {
        foundVerification = { verificationId, ...verification };
        break;
      }
    }

    if (!foundVerification) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Check if expired
    if (Date.now() > foundVerification.expiresAt) {
      // Clean up expired OTP
      otpStore.delete(foundVerification.verificationId);
      return res.status(400).json({
        success: false,
        message: 'Verification code expired',
      });
    }

    // Clean up used OTP
    otpStore.delete(foundVerification.verificationId);

    // Create or update user
    const userId = `user_${Date.now()}`;
    userStore.set(phone, {
      id: userId,
      phone,
      verified: true,
      verifiedAt: Date.now(),
    });

    // Generate JWT token (in production, use proper JWT library)
    const token = `token_${userId}_${Date.now()}`;

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: userId,
        phone,
        verified: true,
      },
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [verificationId, verification] of otpStore.entries()) {
    if (now > verification.expiresAt) {
      otpStore.delete(verificationId);
    }
  }
}, 60000); // Check every minute

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`OTP Backend running on port ${PORT}`);
  console.log(`Send OTP: POST http://localhost:${PORT}/api/otp/send`);
  console.log(`Verify OTP: POST http://localhost:${PORT}/api/otp/verify`);
});

module.exports = app;
