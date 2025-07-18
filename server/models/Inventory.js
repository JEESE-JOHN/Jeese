const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  stockLevel: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    validUntil: Date
  },
  batch: {
    number: String,
    manufactureDate: Date,
    expiryDate: Date
  },
  supplier: {
    name: String,
    contact: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reservations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    quantity: Number,
    reservedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      }
    },
    status: {
      type: String,
      enum: ['active', 'picked-up', 'cancelled', 'expired'],
      default: 'active'
    }
  }],
  salesHistory: [{
    quantity: Number,
    price: Number,
    soldAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
inventorySchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });
inventorySchema.index({ medicine: 1, stockLevel: 1 });
inventorySchema.index({ pharmacy: 1, stockLevel: 1 });
inventorySchema.index({ pharmacy: 1, "batch.expiryDate": 1 });
inventorySchema.index({ lastUpdated: -1 });

// Update stock level based on quantity
inventorySchema.pre('save', function(next) {
  if (this.quantity === 0) {
    this.stockLevel = 'out-of-stock';
  } else if (this.quantity <= this.lowStockThreshold) {
    this.stockLevel = 'low-stock';
  } else {
    this.stockLevel = 'in-stock';
  }
  
  this.lastUpdated = new Date();
  next();
});

// Method to check if medicine is available for reservation
inventorySchema.methods.isAvailableForReservation = function(requestedQuantity) {
  const activeReservations = this.reservations.filter(
    r => r.status === 'active' && r.expiresAt > new Date()
  );
  
  const reservedQuantity = activeReservations.reduce(
    (total, reservation) => total + reservation.quantity, 0
  );
  
  const availableQuantity = this.quantity - reservedQuantity;
  return availableQuantity >= requestedQuantity;
};

// Method to get effective price after discount
inventorySchema.methods.getEffectivePrice = function() {
  if (this.discount.percentage > 0 && 
      this.discount.validUntil && 
      this.discount.validUntil > new Date()) {
    return this.price * (1 - this.discount.percentage / 100);
  }
  return this.price;
};

// Method to check if medicine is near expiry
inventorySchema.methods.isNearExpiry = function(daysThreshold = 30) {
  if (!this.batch.expiryDate) return false;
  
  const expiryDate = new Date(this.batch.expiryDate);
  const now = new Date();
  const diffTime = expiryDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold && diffDays > 0;
};

// Static method to find alternatives when medicine is out of stock
inventorySchema.statics.findAlternatives = async function(medicineId, pharmacyId, userLocation) {
  const Medicine = mongoose.model('Medicine');
  const Pharmacy = mongoose.model('Pharmacy');
  
  const medicine = await Medicine.findById(medicineId).populate('alternatives.medicine');
  if (!medicine) return [];
  
  const alternatives = [];
  
  // Check alternatives in the same pharmacy
  for (const alt of medicine.alternatives) {
    const inventory = await this.findOne({
      pharmacy: pharmacyId,
      medicine: alt.medicine._id,
      stockLevel: { $in: ['in-stock', 'low-stock'] },
      isActive: true
    }).populate('medicine');
    
    if (inventory) {
      alternatives.push({
        ...inventory.toObject(),
        similarity: alt.similarity,
        location: 'same-pharmacy'
      });
    }
  }
  
  // Find same medicine in nearby pharmacies
  if (userLocation) {
    const nearbyPharmacies = await Pharmacy.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userLocation
          },
          $maxDistance: 10000 // 10km radius
        }
      },
      isActive: true,
      'verification.isVerified': true
    });
    
    for (const pharmacy of nearbyPharmacies) {
      if (pharmacy._id.toString() === pharmacyId.toString()) continue;
      
      const inventory = await this.findOne({
        pharmacy: pharmacy._id,
        medicine: medicineId,
        stockLevel: { $in: ['in-stock', 'low-stock'] },
        isActive: true
      }).populate('medicine pharmacy');
      
      if (inventory) {
        alternatives.push({
          ...inventory.toObject(),
          similarity: 100,
          location: 'nearby-pharmacy',
          distance: pharmacy.getDistanceFrom(userLocation[0], userLocation[1])
        });
      }
    }
  }
  
  return alternatives.sort((a, b) => {
    if (a.location === 'same-pharmacy' && b.location !== 'same-pharmacy') return -1;
    if (b.location === 'same-pharmacy' && a.location !== 'same-pharmacy') return 1;
    return b.similarity - a.similarity;
  });
};

module.exports = mongoose.model('Inventory', inventorySchema);