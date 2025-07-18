const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    whatsapp: String
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    landmark: String
  },
  operatingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '10:00' },
      closeTime: { type: String, default: '20:00' }
    }
  },
  services: {
    homeDelivery: {
      available: { type: Boolean, default: false },
      deliveryRadius: { type: Number, default: 0 }, // in km
      deliveryCharge: { type: Number, default: 0 },
      minimumOrderValue: { type: Number, default: 0 }
    },
    onlineOrdering: { type: Boolean, default: false },
    prescriptionUpload: { type: Boolean, default: false },
    wheelchairAccessible: { type: Boolean, default: false },
    parkingAvailable: { type: Boolean, default: false }
  },
  rating: {
    average: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    documents: [{
      type: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOpen24x7: {
    type: Boolean,
    default: false
  },
  description: String,
  imageUrl: String,
  lastStockUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
pharmacySchema.index({ "location.coordinates": "2dsphere" });

// Compound indexes
pharmacySchema.index({ "location.city": 1, isActive: 1 });
pharmacySchema.index({ isActive: 1, "verification.isVerified": 1 });
pharmacySchema.index({ "rating.average": -1 });

// Method to check if pharmacy is currently open
pharmacySchema.methods.isCurrentlyOpen = function() {
  if (this.isOpen24x7) return true;
  
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const daySchedule = this.operatingHours[currentDay];
  if (!daySchedule.isOpen) return false;
  
  return currentTime >= daySchedule.openTime && currentTime <= daySchedule.closeTime;
};

// Method to get distance from a point
pharmacySchema.methods.getDistanceFrom = function(longitude, latitude) {
  const [pharmLng, pharmLat] = this.location.coordinates;
  const R = 6371; // Earth's radius in km
  
  const dLat = (pharmLat - latitude) * Math.PI / 180;
  const dLng = (pharmLng - longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(latitude * Math.PI / 180) * Math.cos(pharmLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

module.exports = mongoose.model('Pharmacy', pharmacySchema);