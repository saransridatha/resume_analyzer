import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null for fallback/mock without real files
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: false, // Stores breakdown, parsedDetails, geminiFeedback
  }
}, {
  timestamps: true,
});

User.hasMany(Analysis, { foreignKey: 'userId', onDelete: 'CASCADE' });
Analysis.belongsTo(User, { foreignKey: 'userId' });

export default Analysis;
