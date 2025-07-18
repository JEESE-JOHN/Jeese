const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get all medicines with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      form,
      brand,
      prescriptionRequired,
      search
    } = req.query;

    let query = { isActive: true };

    // Apply filters
    if (category) query.category = category;
    if (form) query.form = form;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (prescriptionRequired !== undefined) {
      query.prescriptionRequired = prescriptionRequired === 'true';
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: search ? { score: { $meta: 'textScore' } } : { name: 1 },
      populate: 'alternatives.medicine'
    };

    const medicines = await Medicine.paginate(query, options);

    res.json({
      success: true,
      data: medicines
    });

  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medicines'
    });
  }
});

// Get medicine by ID
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id)
      .populate('alternatives.medicine');

    if (!medicine || !medicine.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      data: medicine
    });

  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medicine'
    });
  }
});

// Create new medicine (Admin only)
router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });

  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating medicine'
    });
  }
});

// Update medicine (Admin only)
router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });

  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating medicine'
    });
  }
});

// Delete medicine (Admin only) - Soft delete
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting medicine'
    });
  }
});

// Get medicine categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Medicine.distinct('category', { isActive: true });
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Get medicine forms
router.get('/meta/forms', async (req, res) => {
  try {
    const forms = await Medicine.distinct('form', { isActive: true });
    res.json({
      success: true,
      data: forms.sort()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching forms'
    });
  }
});

// Get medicine brands
router.get('/meta/brands', async (req, res) => {
  try {
    const brands = await Medicine.distinct('brand', { isActive: true });
    res.json({
      success: true,
      data: brands.sort().slice(0, 100) // Limit to top 100 brands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching brands'
    });
  }
});

module.exports = router;