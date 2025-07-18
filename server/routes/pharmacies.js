const express = require('express');
const router = express.Router();
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const { authMiddleware, authorize } = require('../middleware/auth');

// Register new pharmacy
router.post('/register', authMiddleware, authorize('pharmacist'), async (req, res) => {
  try {
    const pharmacyData = {
      ...req.body,
      owner: req.user._id
    };

    const pharmacy = new Pharmacy(pharmacyData);
    await pharmacy.save();

    res.status(201).json({
      success: true,
      message: 'Pharmacy registered successfully',
      data: pharmacy
    });

  } catch (error) {
    console.error('Pharmacy registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering pharmacy'
    });
  }
});

// Get pharmacy details
router.get('/:id', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!pharmacy || !pharmacy.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    // Add current open status
    const isCurrentlyOpen = pharmacy.isCurrentlyOpen();
    
    // Get inventory summary
    const inventorySummary = await Inventory.aggregate([
      {
        $match: {
          pharmacy: pharmacy._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$stockLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const stockSummary = {
      'in-stock': 0,
      'low-stock': 0,
      'out-of-stock': 0
    };

    inventorySummary.forEach(item => {
      stockSummary[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        ...pharmacy.toObject(),
        isCurrentlyOpen,
        stockSummary
      }
    });

  } catch (error) {
    console.error('Get pharmacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy details'
    });
  }
});

// Update pharmacy details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pharmacyId = req.params.id;

    // Verify ownership or admin role
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    if (req.user.role === 'pharmacist' && pharmacy.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pharmacy'
      });
    }

    // Exclude certain fields from update
    const { owner, verification, ...updateData } = req.body;

    const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
      pharmacyId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Pharmacy updated successfully',
      data: updatedPharmacy
    });

  } catch (error) {
    console.error('Update pharmacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pharmacy'
    });
  }
});

// Get all pharmacies (with filters)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      city,
      state,
      verified,
      openNow,
      services,
      search
    } = req.query;

    let query = { isActive: true };

    // Apply filters
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');
    if (verified !== undefined) query['verification.isVerified'] = verified === 'true';
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { 'location.address': new RegExp(search, 'i') }
      ];
    }

    // Services filter
    if (services) {
      const serviceArray = services.split(',');
      serviceArray.forEach(service => {
        query[`services.${service}.available`] = true;
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let pharmacies = await Pharmacy.find(query)
      .populate('owner', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1, name: 1 });

    // Filter by open status if requested
    if (openNow === 'true') {
      pharmacies = pharmacies.filter(pharmacy => pharmacy.isCurrentlyOpen());
    }

    // Add current open status to all
    pharmacies = pharmacies.map(pharmacy => ({
      ...pharmacy.toObject(),
      isCurrentlyOpen: pharmacy.isCurrentlyOpen()
    }));

    const total = await Pharmacy.countDocuments(query);

    res.json({
      success: true,
      data: {
        pharmacies,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCount: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get pharmacies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacies'
    });
  }
});

// Get pharmacies owned by current user
router.get('/owner/me', authMiddleware, authorize('pharmacist'), async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({
      owner: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    // Add additional data for each pharmacy
    const pharmaciesWithData = await Promise.all(
      pharmacies.map(async (pharmacy) => {
        const inventoryCount = await Inventory.countDocuments({
          pharmacy: pharmacy._id,
          isActive: true
        });

        const lowStockCount = await Inventory.countDocuments({
          pharmacy: pharmacy._id,
          stockLevel: { $in: ['low-stock', 'out-of-stock'] },
          isActive: true
        });

        return {
          ...pharmacy.toObject(),
          isCurrentlyOpen: pharmacy.isCurrentlyOpen(),
          inventoryCount,
          lowStockCount
        };
      })
    );

    res.json({
      success: true,
      data: pharmaciesWithData
    });

  } catch (error) {
    console.error('Get owned pharmacies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching owned pharmacies'
    });
  }
});

// Verify pharmacy (Admin only)
router.put('/:id/verify', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { isVerified, documents } = req.body;

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      {
        'verification.isVerified': isVerified,
        'verification.verifiedAt': isVerified ? new Date() : null,
        ...(documents && { 'verification.documents': documents })
      },
      { new: true }
    );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    res.json({
      success: true,
      message: `Pharmacy ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: pharmacy
    });

  } catch (error) {
    console.error('Verify pharmacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pharmacy verification'
    });
  }
});

// Get nearby pharmacies
router.get('/search/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const pharmacies = await Pharmacy.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: radius * 1000, // Convert km to meters
          spherical: true,
          query: {
            isActive: true,
            'verification.isVerified': true
          }
        }
      },
      {
        $addFields: {
          distanceKm: { $divide: ['$distance', 1000] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'owner',
          pipeline: [{ $project: { name: 1, phone: 1 } }]
        }
      },
      { $unwind: '$owner' },
      { $limit: parseInt(limit) }
    ]);

    // Add current open status
    const pharmaciesWithStatus = pharmacies.map(pharmacy => ({
      ...pharmacy,
      isCurrentlyOpen: new Pharmacy(pharmacy).isCurrentlyOpen()
    }));

    res.json({
      success: true,
      data: pharmaciesWithStatus
    });

  } catch (error) {
    console.error('Nearby pharmacies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearby pharmacies'
    });
  }
});

// Get pharmacy analytics (Owner/Admin only)
router.get('/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const pharmacyId = req.params.id;

    // Verify ownership or admin role
    if (req.user.role === 'pharmacist') {
      const pharmacy = await Pharmacy.findById(pharmacyId);
      if (!pharmacy || pharmacy.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this pharmacy analytics'
        });
      }
    }

    const [
      inventoryStats,
      salesStats,
      reservationStats
    ] = await Promise.all([
      // Inventory statistics
      Inventory.aggregate([
        { $match: { pharmacy: pharmacyId, isActive: true } },
        {
          $group: {
            _id: '$stockLevel',
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$quantity', '$price'] } }
          }
        }
      ]),

      // Sales statistics (last 30 days)
      Inventory.aggregate([
        { $match: { pharmacy: pharmacyId } },
        { $unwind: '$salesHistory' },
        {
          $match: {
            'salesHistory.soldAt': {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$salesHistory.quantity' },
            totalRevenue: { $sum: { $multiply: ['$salesHistory.quantity', '$salesHistory.price'] } }
          }
        }
      ]),

      // Reservation statistics
      Inventory.aggregate([
        { $match: { pharmacy: pharmacyId } },
        { $unwind: '$reservations' },
        {
          $group: {
            _id: '$reservations.status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        inventory: inventoryStats,
        sales: salesStats[0] || { totalSales: 0, totalRevenue: 0 },
        reservations: reservationStats
      }
    });

  } catch (error) {
    console.error('Pharmacy analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pharmacy analytics'
    });
  }
});

// Delete/Deactivate pharmacy
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pharmacyId = req.params.id;

    // Verify ownership or admin role
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    if (req.user.role === 'pharmacist' && pharmacy.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pharmacy'
      });
    }

    // Soft delete
    await Pharmacy.findByIdAndUpdate(pharmacyId, { isActive: false });

    // Also deactivate all inventory
    await Inventory.updateMany(
      { pharmacy: pharmacyId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Pharmacy deactivated successfully'
    });

  } catch (error) {
    console.error('Delete pharmacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating pharmacy'
    });
  }
});

module.exports = router;