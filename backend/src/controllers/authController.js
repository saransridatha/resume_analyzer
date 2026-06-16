import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail } from '../config/mailer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-for-dev';

// Generate a random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email is required' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert user
    let user = await User.findOne({ where: { email } });
    
    if (user) {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      user = await User.create({
        email,
        otp,
        otpExpiresAt,
        role: 'user', // Default role
      });
    }

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent successfully to your email.' });
  } catch (err) {
    console.error('Request OTP Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to send OTP email.' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(401).json({ error: 'Unauthorized', message: 'OTP has expired. Please request a new one.' });
    }

    // OTP is valid. Clear it.
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Issue JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Authentication successful',
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
