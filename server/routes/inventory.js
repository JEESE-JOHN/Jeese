const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get inventory for a pharmacy
router.get('/pharmacy/:pharmacyId', async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      category,
      stockLevel,
      sortBy = 'medicine.name'
    } = req.query;

    let matchQuery = {
      pharmacy: pharmacyId,
      isActive: true
    };

    // Stock level filter
    if (stockLevel) {
      matchQuery.stockLevel = stockLevel;
    }

    let pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'medicine'
        }
      },
      { $unwind: '$medicine' },
      {
        $match: {
          'medicine.isActive': true
        }
      }
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'medicine.name': new RegExp(search, 'i') },
            { 'medicine.genericName': new RegExp(search, 'i') },
            { 'medicine.brand': new RegExp(search, 'i') }
          ]
        }
      });
    }

    // Category filter
    if (category) {
      pipeline.push({
        $match: {
          'medicine.category': category
        }
      });
    }

    // Add calculated fields
    pipeline.push({
      $addFields: {
        effectivePrice: {
          $cond: {
            if: {
              $and: [
                { $gt: ['$discount.percentage', 0] },
                { $gt: ['$discount.validUntil', new Date()] }
              ]
            },
            then: {
              $multiply: [
                '$price',
                { $subtract: [1, { $divide: ['$discount.percentage', 100] }] }
              ]
            },
            else: '$price'
          }
        },
        isNearExpiry: {
          $cond: {
            if: '$batch.expiryDate',
            then: {
              $lte: [
                '$batch.expiryDate',
                { $add: [new Date(), 30 * 24 * 60 * 60 * 1000] } // 30 days from now
              ]
            },
            else: false
          }
        },
        reservedQuantity: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$reservations',
                  cond: {
                    $and: [
                      { $eq: ['$$this.status', 'active'] },
                      { $gt: ['$$this.expiresAt', new Date()] }
                    ]
                  }
                }
              },
              as: 'reservation',
              in: '$$reservation.quantity'
            }
          }
        }
      }
    });

    // Add available quantity
    pipeline.push({
      $addFields: {
        availableQuantity: {
          $subtract: ['$quantity', '$reservedQuantity']
        }
      }
    });

    // Sorting
    let sortStage = {};
    switch (sortBy) {
      case 'name':
        sortStage = { 'medicine.name': 1 };
        break;
      case 'category':
        sortStage = { 'medicine.category': 1, 'medicine.name': 1 };
        break;
      case 'stock':
        sortStage = { quantity: -1 };
        break;
      case 'price':
        sortStage = { effectivePrice: 1 };
        break;
      case 'updated':
        sortStage = { lastUpdated: -1 };
        break;
      default:
        sortStage = { 'medicine.name': 1 };
    }
    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const inventory = await Inventory.aggregate(pipeline);

    // Get total count
    const countPipeline = pipeline.slice(0, -2);
    countPipeline.push({ $count: 'total' });
    const countResult = await Inventory.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        inventory,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory'
    });
  }
});

// Get specific medicine inventory at pharmacy
router.get('/pharmacy/:pharmacyId/medicine/:medicineId', async (req, res) => {
  try {
    const { pharmacyId, medicineId } = req.params;

    const inventory = await Inventory.findOne({
      pharmacy: pharmacyId,
      medicine: medicineId,
      isActive: true
    })
    .populate('medicine')
    .populate('pharmacy', 'name location contact')
    .populate('reservations.user', 'name phone');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found in pharmacy inventory'
      });
    }

    // Calculate effective price and availability
    const effectivePrice = inventory.getEffectivePrice();
    const isNearExpiry = inventory.isNearExpiry();
    
    const activeReservations = inventory.reservations.filter(
      r => r.status === 'active' && r.expiresAt > new Date()
    );
    
    const reservedQuantity = activeReservations.reduce(
      (total, r) => total + r.quantity, 0
    );

    res.json({
      success: true,
      data: {
        ...inventory.toObject(),
        effectivePrice,
        isNearExpiry,
        reservedQuantity,
        availableQuantity: inventory.quantity - reservedQuantity,
        activeReservations
      }
    });

  } catch (error) {
    console.error('Get medicine inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medicine inventory'
    });
  }
});

// Add or update inventory (Pharmacy owner/admin only)
router.post('/pharmacy/:pharmacyId', authMiddleware, authorize('pharmacist', 'admin'), async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const {
      medicineId,
      quantity,
      price,
      lowStockThreshold,
      discount,
      batch,
      supplier
    } = req.body;

    // Verify pharmacy ownership
    if (req.user.role === 'pharmacist') {
      const pharmacy = await Pharmacy.findById(pharmacyId);
      if (!pharmacy || pharmacy.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to manage this pharmacy inventory'
        });
      }
    }

    // Check if medicine exists
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Find existing inventory or create new
    let inventory = await Inventory.findOne({
      pharmacy: pharmacyId,
      medicine: medicineId
    });

    if (inventory) {
      // Update existing inventory
      inventory.quantity = quantity;
      inventory.price = price;
      inventory.lowStockThreshold = lowStockThreshold || inventory.lowStockThreshold;
      inventory.discount = discount || inventory.discount;
      inventory.batch = batch || inventory.batch;
      inventory.supplier = supplier || inventory.supplier;
      inventory.updatedBy = req.user._id;
      inventory.isActive = true;
    } else {
      // Create new inventory
      inventory = new Inventory({
        pharmacy: pharmacyId,
        medicine: medicineId,
        quantity,
        price,
        lowStockThreshold: lowStockThreshold || 10,
        discount,
        batch,
        supplier,
        updatedBy: req.user._id
      });
    }

    await inventory.save();

    // Update pharmacy's last stock update
    await Pharmacy.findByIdAndUpdate(pharmacyId, {
      lastStockUpdate: new Date()
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`pharmacy-${pharmacyId}`).emit('inventory-updated', {
      medicineId,
      stockLevel: inventory.stockLevel,
      quantity: inventory.quantity
    });

    const populatedInventory = await Inventory.findById(inventory._id)
      .populate('medicine')
      .populate('pharmacy', 'name');

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: populatedInventory
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory'
    });
  }
});

// Reserve medicine
router.post('/reserve', authMiddleware, async (req, res) => {
  try {
    const { pharmacyId, medicineId, quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const inventory = await Inventory.findOne({
      pharmacy: pharmacyId,
      medicine: medicineId,
      isActive: true
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not available at this pharmacy'
      });
    }

    // Check availability
    if (!inventory.isAvailableForReservation(quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient quantity available for reservation'
      });
    }

    // Check if user already has an active reservation for this medicine at this pharmacy
    const existingReservation = inventory.reservations.find(
      r => r.user.toString() === req.user._id.toString() &&
           r.status === 'active' &&
           r.expiresAt > new Date()
    );

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active reservation for this medicine at this pharmacy'
      });
    }

    // Add reservation
    inventory.reservations.push({
      user: req.user._id,
      quantity,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await inventory.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`pharmacy-${pharmacyId}`).emit('reservation-made', {
      medicineId,
      quantity,
      userId: req.user._id
    });

    // Populate reservation data
    const populatedInventory = await Inventory.findById(inventory._id)
      .populate('medicine', 'name brand')
      .populate('pharmacy', 'name location contact');

    const reservation = inventory.reservations[inventory.reservations.length - 1];

    res.json({
      success: true,
      message: 'Medicine reserved successfully',
      data: {
        reservationId: reservation._id,
        medicine: populatedInventory.medicine,
        pharmacy: populatedInventory.pharmacy,
        quantity,
        expiresAt: reservation.expiresAt
      }
    });

  } catch (error) {
    console.error('Reserve medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reserving medicine'
    });
  }
});

// Cancel reservation
router.put('/reservation/:reservationId/cancel', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;

    const inventory = await Inventory.findOne({
      'reservations._id': reservationId
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = inventory.reservations.id(reservationId);
    
    // Check if user owns this reservation or is pharmacy owner/admin
    if (req.user.role === 'customer' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this reservation'
      });
    }

    if (req.user.role === 'pharmacist') {
      const pharmacy = await Pharmacy.findById(inventory.pharmacy);
      if (pharmacy.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this reservation'
        });
      }
    }

    reservation.status = 'cancelled';
    await inventory.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`pharmacy-${inventory.pharmacy}`).emit('reservation-cancelled', {
      reservationId,
      medicineId: inventory.medicine
    });

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling reservation'
    });
  }
});

// Mark reservation as picked up (Pharmacy only)
router.put('/reservation/:reservationId/pickup', authMiddleware, authorize('pharmacist', 'admin'), async (req, res) => {
  try {
    const { reservationId } = req.params;

    const inventory = await Inventory.findOne({
      'reservations._id': reservationId
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Verify pharmacy ownership
    if (req.user.role === 'pharmacist') {
      const pharmacy = await Pharmacy.findById(inventory.pharmacy);
      if (pharmacy.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to manage this reservation'
        });
      }
    }

    const reservation = inventory.reservations.id(reservationId);
    
    if (reservation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Reservation is not active'
      });
    }

    // Update reservation status
    reservation.status = 'picked-up';
    
    // Reduce inventory quantity
    inventory.quantity -= reservation.quantity;
    
    // Add to sales history
    inventory.salesHistory.push({
      quantity: reservation.quantity,
      price: inventory.getEffectivePrice()
    });

    await inventory.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`pharmacy-${inventory.pharmacy}`).emit('medicine-sold', {
      medicineId: inventory.medicine,
      quantity: reservation.quantity,
      newStock: inventory.quantity
    });

    res.json({
      success: true,
      message: 'Medicine picked up successfully'
    });

  } catch (error) {
    console.error('Pickup reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing pickup'
    });
  }
});

// Get user's reservations
router.get('/reservations', authMiddleware, async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const matchQuery = {
      'reservations.user': req.user._id,
      isActive: true
    };

    if (status !== 'all') {
      matchQuery['reservations.status'] = status;
    }

    const reservations = await Inventory.aggregate([
      { $match: matchQuery },
      { $unwind: '$reservations' },
      {
        $match: {
          'reservations.user': req.user._id,
          ...(status !== 'all' && { 'reservations.status': status })
        }
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'medicine'
        }
      },
      { $unwind: '$medicine' },
      {
        $lookup: {
          from: 'pharmacies',
          localField: 'pharmacy',
          foreignField: '_id',
          as: 'pharmacy'
        }
      },
      { $unwind: '$pharmacy' },
      {
        $project: {
          _id: '$reservations._id',
          medicine: '$medicine',
          pharmacy: '$pharmacy',
          quantity: '$reservations.quantity',
          reservedAt: '$reservations.reservedAt',
          expiresAt: '$reservations.expiresAt',
          status: '$reservations.status',
          price: '$price'
        }
      },
      { $sort: { reservedAt: -1 } }
    ]);

    res.json({
      success: true,
      data: reservations
    });

  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reservations'
    });
  }
});

// Get low stock alerts for pharmacy
router.get('/pharmacy/:pharmacyId/alerts', authMiddleware, authorize('pharmacist', 'admin'), async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    // Verify pharmacy ownership
    if (req.user.role === 'pharmacist') {
      const pharmacy = await Pharmacy.findById(pharmacyId);
      if (!pharmacy || pharmacy.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this pharmacy data'
        });
      }
    }

    const alerts = await Inventory.find({
      pharmacy: pharmacyId,
      stockLevel: { $in: ['low-stock', 'out-of-stock'] },
      isActive: true
    })
    .populate('medicine', 'name brand category')
    .sort({ stockLevel: 1, quantity: 1 });

    // Also check for near-expiry medicines
    const nearExpiryAlerts = await Inventory.find({
      pharmacy: pharmacyId,
      'batch.expiryDate': {
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        $gt: new Date()
      },
      isActive: true
    })
    .populate('medicine', 'name brand category')
    .sort({ 'batch.expiryDate': 1 });

    res.json({
      success: true,
      data: {
        stockAlerts: alerts,
        expiryAlerts: nearExpiryAlerts
      }
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts'
    });
  }
});

module.exports = router;