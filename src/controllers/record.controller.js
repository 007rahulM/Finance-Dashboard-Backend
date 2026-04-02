const FinancialRecord = require('../models/record.model');

const createRecord = async (req, res) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;
    const record = new FinancialRecord({
      title,
      amount,
      type,
      category,
      date,
      notes,
      createdBy: req.user.id,
    });
    await record.save();
    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllRecords = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filter = { isDeleted: false };

    if (type) filter.type = String(type);
    if (category) filter.category = String(category);
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(String(startDate));
      if (endDate) filter.date.$lte = new Date(String(endDate));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      FinancialRecord.find(filter)
        .populate('createdBy', 'username email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FinancialRecord.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: records,
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

const getRecordById = async (req, res) => {
  try {
    const record = await FinancialRecord.findOne({
      _id: String(req.params.id),
      isDeleted: false,
    }).populate('createdBy', 'username email');

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: 'Record not found.' });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { title, amount, type, category, date, notes } = req.body;
    const updateFields = {
      title: title !== undefined ? String(title) : undefined,
      amount: amount !== undefined ? Number(amount) : undefined,
      type: type !== undefined ? String(type) : undefined,
      category: category !== undefined ? String(category) : undefined,
      date: date !== undefined ? new Date(String(date)) : undefined,
      notes: notes !== undefined ? String(notes) : undefined,
    };
    // Remove undefined fields to avoid overwriting existing values with undefined
    Object.keys(updateFields).forEach(
      (k) => updateFields[k] === undefined && delete updateFields[k]
    );

    const record = await FinancialRecord.findOneAndUpdate(
      { _id: String(req.params.id), isDeleted: false },
      updateFields,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: 'Record not found.' });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const record = await FinancialRecord.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: 'Record not found.' });
    }
    return res
      .status(200)
      .json({ success: true, message: 'Record deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRecord, getAllRecords, getRecordById, updateRecord, deleteRecord };