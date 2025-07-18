const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  genericName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  saltComposition: [{
    name: {
      type: String,
      required: true
    },
    strength: {
      type: String,
      required: true
    }
  }],
  category: {
    type: String,
    required: true,
    enum: [
      'Antibiotics',
      'Pain Relief',
      'Cardiovascular',
      'Diabetes',
      'Respiratory',
      'Gastrointestinal',
      'Neurological',
      'Dermatological',
      'Vitamins & Supplements',
      'Eye Care',
      'Women Health',
      'Child Care',
      'First Aid',
      'Other'
    ]
  },
  form: {
    type: String,
    required: true,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Powder', 'Other']
  },
  strength: {
    type: String,
    required: true
  },
  packSize: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  uses: [String],
  sideEffects: [String],
  contraindications: [String],
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  alternatives: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine'
    },
    similarity: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  imageUrl: String,
  barcode: String,
  isActive: {
    type: Boolean,
    default: true
  },
  searchKeywords: [String], // For better search functionality
  averagePrice: {
    type: Number,
    default: 0
  },
  priceRange: {
    min: Number,
    max: Number
  }
}, {
  timestamps: true
});

// Text search index
medicineSchema.index({
  name: 'text',
  genericName: 'text',
  brand: 'text',
  'saltComposition.name': 'text',
  searchKeywords: 'text'
});

// Compound indexes for better query performance
medicineSchema.index({ category: 1, form: 1 });
medicineSchema.index({ brand: 1, genericName: 1 });
medicineSchema.index({ prescriptionRequired: 1, category: 1 });

// Generate search keywords before saving
medicineSchema.pre('save', function(next) {
  const keywords = [
    this.name.toLowerCase(),
    this.genericName.toLowerCase(),
    this.brand.toLowerCase(),
    ...this.saltComposition.map(salt => salt.name.toLowerCase()),
    this.category.toLowerCase(),
    this.form.toLowerCase()
  ];
  
  this.searchKeywords = [...new Set(keywords)];
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);