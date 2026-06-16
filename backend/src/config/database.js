import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the db is stored in the data directory when running in container
// Fallback to a local db.sqlite for testing
const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../data/database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, // Set to console.log to see SQL queries
});

export default sequelize;
