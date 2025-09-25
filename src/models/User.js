import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [2, 100],
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [6, 128],
            },
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        firebaseUid: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        profilePicture: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true,
            },
        },
        authProvider: {
            type: DataTypes.ENUM('local', 'google', 'firebase'),
            defaultValue: 'local',
            allowNull: false,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        hooks: {
            beforeCreate: async (user) => {
                // Only hash password if it exists (for local auth users)
                if (user.password) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                // Only hash password if it exists and has changed
                if (user.password && user.changed('password')) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    },
);

User.prototype.comparePassword = async function (candidatePassword) {
    // Return false if no password is set (OAuth users)
    if (!this.password) {
        return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
};

export default User;
