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
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { len: [1, 100] },
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { len: [1, 100] },
        },
        pictureUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: { isUrl: true },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        authProvider: {
            type: DataTypes.ENUM('local', 'google'),
            allowNull: false,
            defaultValue: 'local',
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true, // Can be null for social logins
            validate: {
                len: [6, 128],
            },
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    if (user.password) {
                        const salt = await bcrypt.genSalt(12);
                        user.password = await bcrypt.hash(user.password, salt);
                    }
                }
            },
        },
    },
);

User.prototype.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
};

export default User;
