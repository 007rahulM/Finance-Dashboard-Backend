const mongoose = require('mongoose');
const User = require('../models/user.model');

const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (role) filter.role = String(role);

    const skip = (parseInt(String(page), 10) - 1) * parseInt(String(limit), 10);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(parseInt(String(limit), 10)),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    const { username, email, role, isActive } = req.body;
    const targetId = req.params.id;

    if (role && targetId === req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: 'You cannot change your own role.' });
    }

    const updateFields = {
      username: username !== undefined ? String(username) : undefined,
      email: email !== undefined ? String(email) : undefined,
      role: role !== undefined ? String(role) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    };
    Object.keys(updateFields).forEach(
      (k) => updateFields[k] === undefined && delete updateFields[k]
    );

    const user = await User.findByIdAndUpdate(
      String(targetId),
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    if (req.params.id === req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    return res
      .status(200)
      .json({ success: true, message: 'User deactivated successfully.', data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };