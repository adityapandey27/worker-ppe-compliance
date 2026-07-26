const User = require('../models/User');

// @route POST /api/users  (admin only) - create a new supervisor (or admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, site } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'supervisor',
      site: site || 'Main Site',
      createdBy: req.user._id
    });

    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user.', error: err.message });
  }
};

// @route GET /api/users (admin only)
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users: users.map((u) => u.toSafeObject()) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
  }
};

// @route PATCH /api/users/:id/status (admin only) - activate/deactivate a supervisor
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user.', error: err.message });
  }
};

// @route DELETE /api/users/:id (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.', error: err.message });
  }
};

module.exports = { createUser, getUsers, updateUserStatus, deleteUser };
