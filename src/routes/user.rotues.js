const { Router } = require('express');
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/user.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * @access  Private (Admin Only)
 * All user management routes are restricted to Admin users.
 */
router.use(verifyToken, authorizeRoles('Admin'));

// GET /api/users - Get all users (with optional filters/pagination in controller)
router.get('/', getAllUsers);

// GET /api/users/:id - Get details of a specific user
router.get('/:id', getUserById);

// PUT /api/users/:id - Update user details or status (Active/Inactive)
router.put('/:id', updateUser);

// DELETE /api/users/:id - Soft delete a user
router.delete('/:id', deleteUser);

module.exports = router;