const userService = require('./users.service');

const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers(req.organization_id);
        res.status(200).json({ data: users });
    } catch (error) {
        next(error);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id, req.organization_id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ data: user });
    } catch (error) {
        next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.organization_id, req.user.id, req.body);
        res.status(201).json({
            message: 'Employee created successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.organization_id, req.body);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const toggleStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        const success = await userService.toggleUserStatus(req.params.id, req.organization_id, isActive);
        if (!success) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    toggleStatus
};
