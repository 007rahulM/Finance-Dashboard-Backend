const FinancialRecord = require('../models/record.model');

const getTotalIncome = async (filter = {}) => {
  const result = await FinancialRecord.aggregate([
    { $match: { ...filter, type: 'income', isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

const getTotalExpenses = async (filter = {}) => {
  const result = await FinancialRecord.aggregate([
    { $match: { ...filter, type: 'expense', isDeleted: false } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

const getNetBalance = async (filter = {}) => {
  const [income, expenses] = await Promise.all([
    getTotalIncome(filter),
    getTotalExpenses(filter),
  ]);
  return income - expenses;
};

const getCategoryTotals = async (filter = {}) => {
  return FinancialRecord.aggregate([
    { $match: { ...filter, isDeleted: false } },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.category': 1 } },
  ]);
};

const getMonthlyTrends = async (year) => {
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31T23:59:59`);

  return FinancialRecord.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);
};

const getRecentActivity = async (limit = 5) => {
  return FinancialRecord.find({ isDeleted: false })
    .populate('createdBy', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = {
  getTotalIncome,
  getTotalExpenses,
  getNetBalance,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentActivity,
};