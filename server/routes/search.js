const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');

// Advanced medicine search with filters
router.get('/medicines', optionalAuth, async (req, res) => {
  try {
    const {
      q,
      category,
      form,
      brand,
      minPrice,
      maxPrice,
      prescriptionRequired,
      inStockOnly,
      latitude,
      longitude,
      radius = 10,
      page = 1,
      limit = 20,
      sortBy = 'relevance'
    } = req.query;

    let searchQuery = { isActive: true };
    let inventoryFilter = { isActive: true };

    // Text search
    if (q) {
      searchQuery.$text = { $search: q };
    }

    // Category filter
    if (category) {
      searchQuery.category = category;
    }

    // Form filter
    if (form) {
      searchQuery.form = form;
    }

    // Brand filter
    if (brand) {
      searchQuery.brand = new RegExp(brand, 'i');
    }

    // Prescription filter
    if (prescriptionRequired !== undefined) {
      searchQuery.prescriptionRequired = prescriptionRequired === 'true';
    }

    // Stock filter
    if (inStockOnly === 'true') {
      inventoryFilter.stockLevel = { $in: ['in-stock', 'low-stock'] };
    }

    // Location-based search
    let pharmacyIds = [];
    if (latitude && longitude) {
      const nearbyPharmacies = await Pharmacy.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: radius * 1000 // Convert km to meters
          }
        },
        isActive: true,
        'verification.isVerified': true
      }).select('_id');

      pharmacyIds = nearbyPharmacies.map(p => p._id);
      if (pharmacyIds.length > 0) {
        inventoryFilter.pharmacy = { $in: pharmacyIds };
      }
    }

    // Build aggregation pipeline
    let pipeline = [
      { $match: searchQuery }
    ];

    // Add text score for relevance sorting
    if (q) {
      pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
    }

    // Lookup inventory information
    pipeline.push({
      $lookup: {
        from: 'inventories',
        localField: '_id',
        foreignField: 'medicine',
        as: 'inventory',
        pipeline: [
          { $match: inventoryFilter },
          {
            $lookup: {
              from: 'pharmacies',
              localField: 'pharmacy',
              foreignField: '_id',
              as: 'pharmacy'
            }
          },
          { $unwind: '$pharmacy' }
        ]
      }
    });

    // Filter medicines that have inventory (if location-based search)
    if (latitude && longitude && pharmacyIds.length === 0) {
      // No nearby pharmacies found
      return res.json({
        success: true,
        data: {
          medicines: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalCount: 0,
            hasNext: false,
            hasPrev: false
          },
          message: 'No pharmacies found in the specified area'
        }
      });
    }

    // Price filter (applied to inventory)
    if (minPrice || maxPrice) {
      const priceMatch = {};
      if (minPrice) priceMatch.$gte = parseFloat(minPrice);
      if (maxPrice) priceMatch.$lte = parseFloat(maxPrice);
      
      pipeline.push({
        $match: {
          'inventory.price': priceMatch
        }
      });
    }

    // Filter out medicines without inventory if stock filter is applied
    if (inStockOnly === 'true' || (latitude && longitude)) {
      pipeline.push({
        $match: {
          'inventory.0': { $exists: true }
        }
      });
    }

    // Calculate average price and availability stats
    pipeline.push({
      $addFields: {
        averagePrice: { $avg: '$inventory.price' },
        minPrice: { $min: '$inventory.price' },
        maxPrice: { $max: '$inventory.price' },
        totalPharmacies: { $size: '$inventory' },
        inStockPharmacies: {
          $size: {
            $filter: {
              input: '$inventory',
              cond: { $in: ['$$this.stockLevel', ['in-stock', 'low-stock']] }
            }
          }
        }
      }
    });

    // Sorting
    let sortStage = {};
    switch (sortBy) {
      case 'price-low':
        sortStage = { minPrice: 1 };
        break;
      case 'price-high':
        sortStage = { minPrice: -1 };
        break;
      case 'availability':
        sortStage = { inStockPharmacies: -1 };
        break;
      case 'relevance':
      default:
        if (q) {
          sortStage = { score: { $meta: 'textScore' } };
        } else {
          sortStage = { name: 1 };
        }
        break;
    }
    pipeline.push({ $sort: sortStage });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute aggregation
    const medicines = await Medicine.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = pipeline.slice(0, -2); // Remove skip and limit
    countPipeline.push({ $count: 'total' });
    const countResult = await Medicine.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const currentPage = parseInt(page);

    // Save search query to user's history (if authenticated)
    if (req.user && q) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $push: {
            searchHistory: {
              $each: [{ query: q }],
              $slice: -50 // Keep only last 50 searches
            }
          }
        }
      );
    }

    res.json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage,
          totalPages,
          totalCount,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      }
    });

  } catch (error) {
    console.error('Medicine search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching medicines'
    });
  }
});

// Get medicine suggestions for autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const suggestions = await Medicine.aggregate([
      {
        $match: {
          $or: [
            { name: new RegExp(q, 'i') },
            { genericName: new RegExp(q, 'i') },
            { brand: new RegExp(q, 'i') },
            { 'saltComposition.name': new RegExp(q, 'i') }
          ],
          isActive: true
        }
      },
      {
        $project: {
          name: 1,
          genericName: 1,
          brand: 1,
          category: 1,
          form: 1,
          strength: 1
        }
      },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting suggestions'
    });
  }
});

// Search nearby pharmacies
router.get('/pharmacies', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
      openNow,
      services,
      rating,
      page = 1,
      limit = 20
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    let matchQuery = {
      isActive: true,
      'verification.isVerified': true
    };

    // Filter by services
    if (services) {
      const serviceArray = services.split(',');
      serviceArray.forEach(service => {
        matchQuery[`services.${service}.available`] = true;
      });
    }

    // Filter by rating
    if (rating) {
      matchQuery['rating.average'] = { $gte: parseFloat(rating) };
    }

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: radius * 1000, // Convert km to meters
          spherical: true
        }
      },
      { $match: matchQuery },
      {
        $addFields: {
          distanceKm: { $divide: ['$distance', 1000] },
          isCurrentlyOpen: {
            $cond: {
              if: '$isOpen24x7',
              then: true,
              else: false // We'll calculate this in post-processing
            }
          }
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'pharmacy',
          as: 'inventory',
          pipeline: [
            {
              $match: {
                stockLevel: { $in: ['in-stock', 'low-stock'] },
                isActive: true
              }
            },
            {
              $group: {
                _id: null,
                totalMedicines: { $sum: 1 },
                inStockCount: {
                  $sum: {
                    $cond: [{ $eq: ['$stockLevel', 'in-stock'] }, 1, 0]
                  }
                }
              }
            }
          ]
        }
      },
      {
        $addFields: {
          medicineStats: { $arrayElemAt: ['$inventory', 0] }
        }
      },
      { $unset: 'inventory' }
    ];

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    let pharmacies = await Pharmacy.aggregate(pipeline);

    // Calculate if pharmacy is currently open
    if (openNow === 'true') {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.toTimeString().slice(0, 5);

      pharmacies = pharmacies.filter(pharmacy => {
        if (pharmacy.isOpen24x7) return true;
        
        const daySchedule = pharmacy.operatingHours[currentDay];
        return daySchedule.isOpen && 
               currentTime >= daySchedule.openTime && 
               currentTime <= daySchedule.closeTime;
      });
    } else {
      // Add current open status to all pharmacies
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const currentTime = now.toTimeString().slice(0, 5);

      pharmacies = pharmacies.map(pharmacy => {
        if (pharmacy.isOpen24x7) {
          pharmacy.isCurrentlyOpen = true;
        } else {
          const daySchedule = pharmacy.operatingHours[currentDay];
          pharmacy.isCurrentlyOpen = daySchedule.isOpen && 
                                    currentTime >= daySchedule.openTime && 
                                    currentTime <= daySchedule.closeTime;
        }
        return pharmacy;
      });
    }

    res.json({
      success: true,
      data: {
        pharmacies,
        searchCenter: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      }
    });

  } catch (error) {
    console.error('Pharmacy search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching pharmacies'
    });
  }
});

// Find alternatives for out-of-stock medicine
router.get('/alternatives/:medicineId', optionalAuth, async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { pharmacyId, latitude, longitude } = req.query;

    let userLocation = null;
    if (latitude && longitude) {
      userLocation = [parseFloat(longitude), parseFloat(latitude)];
    } else if (req.user && req.user.location.coordinates) {
      userLocation = req.user.location.coordinates;
    }

    const alternatives = await Inventory.findAlternatives(
      medicineId,
      pharmacyId,
      userLocation
    );

    res.json({
      success: true,
      data: alternatives
    });

  } catch (error) {
    console.error('Alternatives search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding alternatives'
    });
  }
});

// Get search filters data
router.get('/filters', async (req, res) => {
  try {
    const [categories, forms, brands] = await Promise.all([
      Medicine.distinct('category', { isActive: true }),
      Medicine.distinct('form', { isActive: true }),
      Medicine.distinct('brand', { isActive: true }).limit(100)
    ]);

    res.json({
      success: true,
      data: {
        categories: categories.sort(),
        forms: forms.sort(),
        brands: brands.sort()
      }
    });

  } catch (error) {
    console.error('Filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting filter options'
    });
  }
});

module.exports = router;