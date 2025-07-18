const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');

// Sample data
const sampleMedicines = [
  {
    name: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    brand: 'Crocin',
    manufacturer: 'GSK',
    saltComposition: [{ name: 'Paracetamol', strength: '500mg' }],
    category: 'Pain Relief',
    form: 'Tablet',
    strength: '500mg',
    packSize: '10 tablets',
    description: 'Used for fever and pain relief',
    uses: ['Fever', 'Headache', 'Body pain'],
    prescriptionRequired: false
  },
  {
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    brand: 'Amoxil',
    manufacturer: 'GSK',
    saltComposition: [{ name: 'Amoxicillin', strength: '250mg' }],
    category: 'Antibiotics',
    form: 'Capsule',
    strength: '250mg',
    packSize: '10 capsules',
    description: 'Antibiotic for bacterial infections',
    uses: ['Bacterial infections', 'Respiratory infections'],
    prescriptionRequired: true
  },
  {
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine',
    brand: 'Zyrtec',
    manufacturer: 'UCB',
    saltComposition: [{ name: 'Cetirizine Hydrochloride', strength: '10mg' }],
    category: 'Respiratory',
    form: 'Tablet',
    strength: '10mg',
    packSize: '10 tablets',
    description: 'Antihistamine for allergy relief',
    uses: ['Allergic rhinitis', 'Urticaria', 'Skin allergies'],
    prescriptionRequired: false
  },
  {
    name: 'Metformin 500mg',
    genericName: 'Metformin',
    brand: 'Glucophage',
    manufacturer: 'Merck',
    saltComposition: [{ name: 'Metformin Hydrochloride', strength: '500mg' }],
    category: 'Diabetes',
    form: 'Tablet',
    strength: '500mg',
    packSize: '30 tablets',
    description: 'Antidiabetic medication',
    uses: ['Type 2 diabetes', 'PCOS'],
    prescriptionRequired: true
  },
  {
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    brand: 'Prilosec',
    manufacturer: 'AstraZeneca',
    saltComposition: [{ name: 'Omeprazole', strength: '20mg' }],
    category: 'Gastrointestinal',
    form: 'Capsule',
    strength: '20mg',
    packSize: '14 capsules',
    description: 'Proton pump inhibitor for acid reflux',
    uses: ['GERD', 'Peptic ulcers', 'Acid reflux'],
    prescriptionRequired: false
  },
  {
    name: 'Vitamin D3 1000 IU',
    genericName: 'Cholecalciferol',
    brand: 'D-Rise',
    manufacturer: 'Abbott',
    saltComposition: [{ name: 'Cholecalciferol', strength: '1000 IU' }],
    category: 'Vitamins & Supplements',
    form: 'Tablet',
    strength: '1000 IU',
    packSize: '30 tablets',
    description: 'Vitamin D supplement',
    uses: ['Vitamin D deficiency', 'Bone health'],
    prescriptionRequired: false
  },
  {
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    brand: 'Brufen',
    manufacturer: 'Abbott',
    saltComposition: [{ name: 'Ibuprofen', strength: '400mg' }],
    category: 'Pain Relief',
    form: 'Tablet',
    strength: '400mg',
    packSize: '10 tablets',
    description: 'NSAID for pain and inflammation',
    uses: ['Pain', 'Inflammation', 'Fever'],
    prescriptionRequired: false
  },
  {
    name: 'Azithromycin 500mg',
    genericName: 'Azithromycin',
    brand: 'Zithromax',
    manufacturer: 'Pfizer',
    saltComposition: [{ name: 'Azithromycin', strength: '500mg' }],
    category: 'Antibiotics',
    form: 'Tablet',
    strength: '500mg',
    packSize: '3 tablets',
    description: 'Macrolide antibiotic',
    uses: ['Respiratory infections', 'Skin infections'],
    prescriptionRequired: true
  }
];

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@findmymed.com',
    phone: '+1234567890',
    password: 'admin123',
    role: 'admin',
    isVerified: true
  },
  {
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh@pharmacy.com',
    phone: '+1234567891',
    password: 'pharmacy123',
    role: 'pharmacist',
    isVerified: true
  },
  {
    name: 'Dr. Priya Patel',
    email: 'priya@pharmacy.com',
    phone: '+1234567892',
    password: 'pharmacy123',
    role: 'pharmacist',
    isVerified: true
  },
  {
    name: 'John Customer',
    email: 'john@customer.com',
    phone: '+1234567893',
    password: 'customer123',
    role: 'customer',
    isVerified: true,
    location: {
      address: '123 Main Street, Downtown',
      coordinates: [77.2090, 28.6139], // Delhi coordinates
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    }
  }
];

const samplePharmacies = [
  {
    name: 'MediPlus Pharmacy',
    licenseNumber: 'DL001234',
    contact: {
      phone: '+1234567891',
      email: 'contact@mediplus.com',
      whatsapp: '+1234567891'
    },
    location: {
      address: '456 Health Street, Medical District',
      coordinates: [77.2085, 28.6135],
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      landmark: 'Near City Hospital'
    },
    services: {
      homeDelivery: {
        available: true,
        deliveryRadius: 10,
        deliveryCharge: 50,
        minimumOrderValue: 200
      },
      onlineOrdering: true,
      prescriptionUpload: true,
      wheelchairAccessible: true,
      parkingAvailable: true
    },
    rating: {
      average: 4.5,
      totalReviews: 156
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date()
    },
    isOpen24x7: false
  },
  {
    name: 'LifeCare Pharmacy',
    licenseNumber: 'DL001235',
    contact: {
      phone: '+1234567892',
      email: 'contact@lifecare.com',
      whatsapp: '+1234567892'
    },
    location: {
      address: '789 Wellness Road, Health Plaza',
      coordinates: [77.2100, 28.6145],
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110002',
      landmark: 'Opposite Metro Station'
    },
    services: {
      homeDelivery: {
        available: true,
        deliveryRadius: 15,
        deliveryCharge: 30,
        minimumOrderValue: 100
      },
      onlineOrdering: true,
      prescriptionUpload: true,
      wheelchairAccessible: false,
      parkingAvailable: true
    },
    rating: {
      average: 4.2,
      totalReviews: 89
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date()
    },
    isOpen24x7: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/findmymed', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Medicine.deleteMany({}),
      Pharmacy.deleteMany({}),
      Inventory.deleteMany({})
    ]);

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
    }

    // Create medicines
    console.log('Creating medicines...');
    const createdMedicines = [];
    for (const medicineData of sampleMedicines) {
      const medicine = new Medicine(medicineData);
      await medicine.save();
      createdMedicines.push(medicine);
    }

    // Create pharmacies
    console.log('Creating pharmacies...');
    const createdPharmacies = [];
    const pharmacistUsers = createdUsers.filter(user => user.role === 'pharmacist');
    
    for (let i = 0; i < samplePharmacies.length; i++) {
      const pharmacy = new Pharmacy({
        ...samplePharmacies[i],
        owner: pharmacistUsers[i]._id
      });
      await pharmacy.save();
      createdPharmacies.push(pharmacy);
    }

    // Create inventory
    console.log('Creating inventory...');
    for (const pharmacy of createdPharmacies) {
      for (const medicine of createdMedicines) {
        const quantity = Math.floor(Math.random() * 100) + 10; // Random quantity between 10-110
        const price = Math.floor(Math.random() * 500) + 50; // Random price between 50-550
        
        const inventory = new Inventory({
          pharmacy: pharmacy._id,
          medicine: medicine._id,
          quantity,
          price,
          lowStockThreshold: 10,
          batch: {
            number: `BATCH${Math.floor(Math.random() * 10000)}`,
            manufactureDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
          },
          supplier: {
            name: `Supplier ${Math.floor(Math.random() * 10) + 1}`,
            contact: `+91987654${Math.floor(Math.random() * 100)}`
          }
        });
        
        await inventory.save();
      }
    }

    console.log('Database seeded successfully!');
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${createdMedicines.length} medicines`);
    console.log(`Created ${createdPharmacies.length} pharmacies`);
    console.log(`Created ${createdPharmacies.length * createdMedicines.length} inventory items`);

    console.log('\nTest accounts:');
    console.log('Admin: admin@findmymed.com / admin123');
    console.log('Pharmacist 1: rajesh@pharmacy.com / pharmacy123');
    console.log('Pharmacist 2: priya@pharmacy.com / pharmacy123');
    console.log('Customer: john@customer.com / customer123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };