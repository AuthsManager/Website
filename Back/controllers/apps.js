const crypto = require('crypto');
const App = require('../models/App');
const License = require('../models/License');
const SubUser = require('../models/SubUser');
const User = require('../models/User');
const utils = require('../utils');

const checkUserBanned = async (userId) => {
    const user = await User.findOne({ id: userId });
    return user && user.banned;
};

const createApp = async (req, res) => {
    if (await checkUserBanned(req.user.id)) {
        return res.status(403).json({ message: 'Account suspended. Access denied.' });
    }

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'App name is required.' });

    const apps = await App.find({ ownerId: req.user.id }) || [];
    if (req.user.subscription.plan === 'Starter' && apps.length >= 1) return res.status(400).json({ message: 'Your subscription tier limits you to only one application.' });

    const nameRegex = /^[a-zA-Z0-9-]*$/;
    if (!nameRegex.test(name)) return res.status(400).json({ message: 'The provided app name is invalid.' });

    const already = apps.find(app => app.name === name);
    if (already) return res.status(400).json({ message: 'The provided app name already exist.' });
  
    const app = (await new App({
        ownerId: req.user.id,
        id: crypto.randomUUID(),
        secret: utils.generateString(36),
        name
    }).save()).toJSON();

    delete app._id;
    delete app.__v;
  
    return res.status(201).json(app);
};

const getApps = async (req, res) => {
    
    let apps;
    
    if (req.user.isAdmin) {
        apps = await App.find({});
        const appsWithOwnerInfo = await Promise.all(apps.map(async (app) => {
            const owner = await User.findOne({ id: app.ownerId });
            return {
                ...app.toJSON(),
                ownerUsername: owner ? owner.username : null
            };
        }));
        apps = appsWithOwnerInfo;
    } else {
        apps = await App.find({ ownerId: req.user.id });
    }

    const formattedApps = apps.map(app => {
        const { _id, __v, ...rest } = app;
        return rest;
    });

    return res.status(200).json(formattedApps);
};

const renameApp = async (req, res) => {
    if (await checkUserBanned(req.user.id)) {
        return res.status(403).json({ message: 'Account suspended. Access denied.' });
    }

    const { appId } = req.params;
    const { newName } = req.body;

    if (!newName) return res.status(400).json({ message: 'App name is required.' });

    const nameRegex = /^[a-zA-Z0-9-]*$/;
    if (!nameRegex.test(newName)) return res.status(400).json({ message: 'The provided app name is invalid.' });

    const app = await App.findOne({ id: appId });
    if (!app) return res.status(400).json({ message: 'The provided app doesn\'t exist.' });
    if (!app.active) return res.status(403).json({ message: 'This app is currently inactive.' });

    if (newName === app.name) return res.status(400).json({ message: 'The new app name must be different from the old one.' });

    const already = await App.findOne({ name: newName, ownerId: req.user.id });
    if (already) return res.status(400).json({ message: 'The provided app name already exist.' });

    app.name = newName;
    await app.save();

    return res.status(204).send(null);
};

const deleteApp = async (req, res) => {
    if (await checkUserBanned(req.user.id)) {
        return res.status(403).json({ message: 'Account suspended. Access denied.' });
    }

    const { appId } = req.params;

    const app = await App.findOne({ id: appId });
    if (!app) return res.status(400).json({ message: 'The provided app doesn\'t exist.' });
    if (!app.active) return res.status(403).json({ message: 'This app is currently inactive.' });

    await app.deleteOne();
    await License.deleteMany({ appId });
    await SubUser.deleteMany({ appId });

    return res.status(204).send(null);
};
  
module.exports = {
    createApp,
    getApps,
    renameApp,
    deleteApp
};