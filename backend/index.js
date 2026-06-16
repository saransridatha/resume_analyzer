import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getHistory, downloadResume, viewResume, handleMethodNotAllowed } from './src/controllers/historyController.js';
import { analyzeResume } from './src/controllers/analyzeController.js';
import { requestOtp, verifyOtp } from './src/controllers/authController.js';
import { getUsers, getUserHistory } from './src/controllers/adminController.js';
import { requireAuth, requireAdmin } from './src/middleware/authMiddleware.js';
import sequelize from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure uploads dir exists
const uploadsDir = path.resolve(__dirname, '../data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Auth Routes
app.post('/api/auth/request-otp', requestOtp);
app.post('/api/auth/verify-otp', verifyOtp);

// Admin Routes
app.get('/api/admin/users', requireAuth, requireAdmin, getUsers);
app.get('/api/admin/history/:userId', requireAuth, requireAdmin, getUserHistory);

// Protected Routes
app.route('/api/history')
  .get(requireAuth, getHistory)
  .all(handleMethodNotAllowed);

app.post('/api/analyze', requireAuth, upload.single('file'), analyzeResume);

app.get('/api/download/:id', requireAuth, downloadResume);
app.get('/api/view/:id', requireAuth, viewResume);

// Serve Static Frontend (for monolithic container)
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.resolve(frontendDistPath, 'index.html'));
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Payload Too Large', message: 'File size exceeds limit' });
    }
  }
  console.error('[Global Error Handler]:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Sync Database and Start Server
sequelize.sync().then(() => {
  console.log('SQLite Database synchronized.');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
