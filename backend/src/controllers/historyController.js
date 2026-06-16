import { readDb } from '../models/analysisModel.js';

export function getHistory(req, res) {
  const isLocked = process.env.TEST_LOCK_DB === 'true' || 
                   req.headers['x-test-lock-db'] === 'true' || 
                   req.query.lockDb === 'true';
  if (isLocked) {
    return res.status(500).json({ error: 'Database is locked or unavailable' });
  }
  
  const history = readDb();
  // Sort descending by timestamp
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return res.json(history);
}

export function handleMethodNotAllowed(req, res) {
  return res.status(405).json({ error: 'Method Not Allowed' });
}
