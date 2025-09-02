import sequelize from '../config/database.js';
import User from './User.js';
import Document from './Document.js';
import QASession from './QASession.js';

// Define associations
User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

User.hasMany(QASession, { foreignKey: 'userId', as: 'qaSessions' });
QASession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, Document, QASession };
