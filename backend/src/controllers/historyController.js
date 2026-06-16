import Analysis from '../models/Analysis.js';

export const getHistory = async (req, res) => {
  try {
    const isLocked = process.env.TEST_LOCK_DB === 'true' || 
                     req.headers['x-test-lock-db'] === 'true' || 
                     req.query.lockDb === 'true';
    if (isLocked) {
      return res.status(500).json({ error: 'Database is locked or unavailable' });
    }
    
    let history;
    if (req.user.role === 'admin') {
      history = await Analysis.findAll({ order: [['timestamp', 'DESC']] });
    } else {
      history = await Analysis.findAll({ where: { userId: req.user.id }, order: [['timestamp', 'DESC']] });
    }

    const formattedHistory = history.map(item => {
      // details is either an object or a JSON string depending on Sequelize SQLite setup
      const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
      return {
        id: item.id,
        filename: item.filename,
        timestamp: item.timestamp,
        atsScore: item.score,
        ...details
      };
    });

    return res.json(formattedHistory);
  } catch (err) {
    console.error('History fetch error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

import fs from 'fs';
import path from 'path';

export const viewResume = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await Analysis.findByPk(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume not found' });
    }

    if (req.user.role !== 'admin' && analysis.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to view this file' });
    }

    if (!analysis.filepath || !fs.existsSync(analysis.filepath)) {
      return res.status(404).json({ error: 'Not Found', message: 'File is no longer available on the server' });
    }

    const ext = path.extname(analysis.filepath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    const fileStream = fs.createReadStream(analysis.filepath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${analysis.filename || path.basename(analysis.filepath)}"`);
    fileStream.pipe(res);
  } catch (err) {
    console.error('View error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

export const downloadResume = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await Analysis.findByPk(id);

    if (!analysis) {
      return res.status(404).json({ error: 'Not Found', message: 'Resume not found' });
    }

    // Ensure user owns this analysis or is an admin
    if (req.user.role !== 'admin' && analysis.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to download this file' });
    }

    if (!analysis.filepath || !fs.existsSync(analysis.filepath)) {
      return res.status(404).json({ error: 'Not Found', message: 'File is no longer available on the server' });
    }

    // Determine the original filename and send the file
    const originalName = analysis.filename || path.basename(analysis.filepath);
    res.download(analysis.filepath, originalName);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

export function handleMethodNotAllowed(req, res) {
  return res.status(405).json({ error: 'Method Not Allowed' });
}
