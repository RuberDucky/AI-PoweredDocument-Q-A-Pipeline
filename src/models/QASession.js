import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QASession = sequelize.define('QASession', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    context: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    relevantDocuments: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    tokensUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    responseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5,
        },
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
});

export default QASession;
