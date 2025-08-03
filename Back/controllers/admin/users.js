const crypto = require('crypto');
const bcrypt = require('bcrypt');
const utils = require('../../utils');
const User = require('../../models/User');
const License = require('../../models/License');
const SubUser = require('../../models/SubUser');
const App = require('../../models/App');
const { sendBanNotification } = require('../../services/emailService');

const updateUserResourcesStatus = async (userId, active) => {
    try {
        await License.updateMany(
            { ownerId: userId },
            { active: active }
        );

        await SubUser.updateMany(
            { ownerId: userId },
            { active: active }
        );

        await App.updateMany(
            { ownerId: userId },
            { active: active }
        );
    } catch (error) {
        console.error('Error updating user resources status:', error);
        throw error;
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); 
        return res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Failed to fetch users.' });
    }
}

const createUser = async (req, res) => {
    const { username, email, password, isAdmin } = req.body;

    if (!username) return res.status(400).json({ message: 'Username is required.' });
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    if (!password) return res.status(400).json({ message: 'Password is required.' });
    if (typeof isAdmin !== 'boolean') return res.status(400).json({ message: 'IsAdmin is required.' });

    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/;
    if (!usernameRegex.test(username)) return res.status(400).json({ message: 'The provided username is invalid.' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: 'Username already in use.' });

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'The provided email is invalid.' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({  message: 'Email already in use.' });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) return res.status(400).json({ message: 'The password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number and one special character.' });


    const hashedPassword = bcrypt.hashSync(password, 10);
    const token = utils.generateString(56);

    const user = new User({
        id: crypto.randomUUID(),
        username,
        email,
        created_at: Date.now(),
        password: hashedPassword,
        token,
        subscription: {
            plan: isAdmin ? 'Admin' : 'Starter',
            expires: 0
        }
    });
    await user.save();

    const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        subscription: user.subscription,
        settings: user.settings
    };

    return res.json(userResponse);
}

const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, email, password, isAdmin } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updateData = {};

        if (username !== undefined) {
            if (!username) {
                return res.status(400).json({ message: 'Username cannot be empty.' });
            }
            const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,15}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({ message: 'The provided username is invalid.' });
            }
            const existingUsername = await User.findOne({ username, id: { $ne: userId } });
            if (existingUsername) {
                return res.status(400).json({ message: 'Username already in use.' });
            }
            updateData.username = username;
        }

        if (email !== undefined) {
            if (!email) {
                return res.status(400).json({ message: 'Email cannot be empty.' });
            }
            const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'The provided email is invalid.' });
            }
            const existingEmail = await User.findOne({ email, id: { $ne: userId } });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already in use.' });
            }
            updateData.email = email;
        }

        if (password !== undefined && password !== '') {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({ 
                    message: 'The password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number and one special character.' 
                });
            }
            updateData.password = bcrypt.hashSync(password, 10);
        }

        if (isAdmin !== undefined) {
            if (typeof isAdmin !== 'boolean') {
                return res.status(400).json({ message: 'IsAdmin must be a boolean value.' });
            }
            updateData['subscription.plan'] = isAdmin ? 'Admin' : 'Starter';
        }

        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { $set: updateData },
            { new: true, select: '-password' }
        );

        return res.json({
            message: 'User updated successfully.',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                created_at: updatedUser.created_at,
                subscription: updatedUser.subscription,
                settings: updatedUser.settings
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Failed to update user.' });
    }
}

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await SubUser.deleteMany({ ownerId: userId });
        
        await License.deleteMany({ ownerId: userId });
        
        await App.deleteMany({ ownerId: userId });
        
        await User.deleteOne({ id: userId });
        
        return res.json({ message: 'User and all related data deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Failed to delete user.' });
    }
}

const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { banned } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        if (typeof banned !== 'boolean') {
            return res.status(400).json({ message: 'Banned status must be a boolean.' });
        }

        if (req.user.id === userId) {
            return res.status(403).json({ message: 'You cannot ban yourself.' });
        }

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.subscription.plan === 'Founder') {
            return res.status(403).json({ message: 'Founders cannot be banned.' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { banned: banned },
            { new: true, select: '-password' }
        );

        try {
            await updateUserResourcesStatus(userId, !banned); // active = !banned
        } catch (resourceError) {
            console.error('Error updating user resources status:', resourceError);
        }

        if (updatedUser && updatedUser.email && updatedUser.username) {
            try {
                await sendBanNotification(updatedUser.email, updatedUser.username, updatedUser.banned);
            } catch (emailError) {
                console.error('Error sending ban notification email:', emailError);
            }
        }

        return res.json({
            message: `User ${updatedUser.banned ? 'banned' : 'unbanned'} successfully.`,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                subscription: updatedUser.subscription,
                settings: updatedUser.settings,
                banned: updatedUser.banned
            }
        });
    } catch (error) {
        console.error('Error banning/unbanning user:', error);
        return res.status(500).json({ message: 'Failed to update user ban status.' });
    }
}

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    banUser
};