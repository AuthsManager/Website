const crypto = require('crypto');
const bcrypt = require('bcrypt');
const utils = require('../utils');
const App = require('../models/App');
const SubUser = require('../models/SubUser');
const User = require('../models/User');

const checkUserBanned = async (userId) => {
    const user = await User.findOne({ id: userId });
    return user && user.banned;
};

const getUsers = async (req, res) => {
    if (await checkUserBanned(req.user.id)) {
        return res.status(403).json({ message: 'Account suspended. Access denied.' });
    }

    const { ownerId } = req.query;
    
    let users;
    if (req.user.isAdmin && ownerId) {
        const User = require('../models/User');
        const owner = await User.findOne({ id: ownerId });
        if (owner && owner.banned) {
            users = []; 
        } else {
            users = await SubUser.find({ ownerId }) || [];
        }
    } else if (req.user.isAdmin) {
        const allSubUsers = await SubUser.find({}) || [];
        const User = require('../models/User');
        users = [];
        for (const subuser of allSubUsers) {
            const owner = await User.findOne({ id: subuser.ownerId });
            if (owner && !owner.banned) {
                users.push(subuser);
            }
        }
    } else {
        users = await SubUser.find({ ownerId: req.user.id }) || [];
    }

    return res.json(users.map(({ id, username, appId, active }) => ({ id, username, appId, active })));
};

const createUser = async (req, res) => {
    if (await checkUserBanned(req.user.id)) {
        return res.status(403).json({ message: 'Account suspended. Access denied.' });
    }

    const { username, password, appId, ownerId } = req.body;

    if (!username) return res.status(400).json({ message: 'Username is required.' });
    if (!password) return res.status(400).json({ message: 'Password is required.' });
    if (!appId) return res.status(400).json({ message: 'App id is required.' });

    let effectiveOwnerId = req.user.id;
    
    if (req.user.isAdmin && ownerId) {
        const owner = await User.findOne({ id: ownerId });
        if (!owner) {
            return res.status(400).json({ message: 'Invalid owner ID.' });
        }
        if (owner.banned) {
            return res.status(403).json({ message: 'Owner account is suspended.' });
        }
        effectiveOwnerId = ownerId;
    }

    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/;
    if (!usernameRegex.test(username)) return res.status(400).json({ message: 'The provided username is invalid.' });

    const existingUsername = await SubUser.findOne({ ownerId: effectiveOwnerId, username });
    if (existingUsername) return res.status(400).json({ message: 'Username already in use.' });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    // if (!passwordRegex.test(password)) return res.status(400).json({ message: 'The password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number and one special character.' });

    const app = await App.findOne({ id: appId });
    if (!app) return res.status(400).json({ message: 'Invalid app id.' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const token = utils.generateString(56);

    const user = new SubUser({ ownerId: effectiveOwnerId, appId, id: crypto.randomUUID(), username, password: hashedPassword, token });
    await user.save();

    return res.json({ id: user.id, username, appId });
}

const updateUser = async (req, res) => {
    if (await checkUserBanned(req.user.id)) {
        return res.status(403).json({ message: 'Account suspended. Access denied.' });
    }

    const { userId } = req.params;
    const { username, password, appId } = req.body;

    const user = await SubUser.findOne({ id: userId });
    if (!user) return res.status(400).json({ message: 'The provided user doesn\'t exist.' });
    if (!user.active) return res.status(403).json({ message: 'This user account is currently inactive.' });

    if (!req.user.isAdmin && user.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'You don\'t have permission to update this user.' });
    }

    if (username) {
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/;
        if (!usernameRegex.test(username)) return res.status(400).json({ message: 'The provided username is invalid.' });

        const existingUsername = await SubUser.findOne({ ownerId: user.ownerId, username, id: { $ne: userId } });
        if (existingUsername) return res.status(400).json({ message: 'Username already in use.' });

        user.username = username;
    }

    if (password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        // if (!passwordRegex.test(password)) return res.status(400).json({ message: 'The password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number and one special character.' });
        
        const hashedPassword = bcrypt.hashSync(password, 10);
        user.password = hashedPassword;
    }

    if (appId) {
        const app = await App.findOne({ id: appId });
        if (!app) return res.status(400).json({ message: 'Invalid app id.' });
        
        user.appId = appId;
    }

    await user.save();

    return res.json({ id: user.id, username: user.username, appId: user.appId });
};

const deleteUser = async (req, res) => {
    if (await checkUserBanned(req.user.id)) {
        return res.status(403).json({ message: 'Account suspended. Access denied.' });
    }

    const { userId } = req.params;

    const user = await SubUser.findOne({ id: userId });
    if (!user) return res.status(400).json({ message: 'The provided user doesn\'t exist.' });
    if (!user.active) return res.status(403).json({ message: 'This user account is currently inactive.' });

    await user.deleteOne();

    return res.status(204).send(null);
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};