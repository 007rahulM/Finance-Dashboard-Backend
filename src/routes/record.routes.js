const { Router } = require('express');
const { body } = require('express-validator');
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require('../controllers/record.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../middlewares/validate.middleware');

const router = Router();

const recordValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a non-negative number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category')
    .isIn(['Salary', 'Rent', 'Food', 'Investment', 'Other'])
    .withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

// Financial record routes
router.post(
  '/',
  verifyToken,
  authorizeRoles('Admin', 'Analyst'),
  recordValidation,
  handleValidationErrors,
  createRecord
);

router.get('/', verifyToken, getAllRecords);
router.get('/:id', verifyToken, getRecordById);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Admin', 'Analyst'),
  recordValidation,
  handleValidationErrors,
  updateRecord
);

router.delete('/:id', verifyToken, authorizeRoles('Admin'), deleteRecord);

module.exports = router;