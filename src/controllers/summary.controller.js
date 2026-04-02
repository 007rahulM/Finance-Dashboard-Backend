const summaryService = require('../services/summary.service');

const getDashboardSummary = async (req, res) => {
  try {
    const [totalIncome, totalExpenses, netBalance, categoryTotals, recentActivity] =
      await Promise.all([
        summaryService.getTotalIncome(),
        summaryService.getTotalExpenses(),
        summaryService.getNetBalance(),
        summaryService.getCategoryTotals(),
        summaryService.getRecentActivity(5),
      ]);

    return res.status(200).json({
      success: true,
      data: { totalIncome, totalExpenses, netBalance, categoryTotals, recentActivity },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMonthlyTrends = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const trends = await summaryService.getMonthlyTrends(year);
    return res.status(200).json({ success: true, data: { year, trends } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardSummary, getMonthlyTrends };