import User from '../models/User.js';
import Analysis from '../models/Analysis.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Analysis.findAll({
      where: { userId },
      order: [['timestamp', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    console.error('Error fetching user history:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
