const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+]?[1-9]\d{9,14}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('customer', 'pharmacist').default('customer'),
  location: Joi.object({
    address: Joi.string(),
    coordinates: Joi.array().items(Joi.number()).length(2),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[+]?[1-9]\d{9,14}$/),
  password: Joi.string().required()
}).or('email', 'phone');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register user
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, phone, password, role, location } = value;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      location
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, phone, password } = value;

    // Find user
    const query = email ? { email } : { phone };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favoriteMedicines.medicine', 'name brand genericName')
      .populate('favoritePharmacies.pharmacy', 'name location contact');

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'location', 'preferences', 'notifications'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// Add medicine to favorites
router.post('/favorites/medicines/:medicineId', authMiddleware, async (req, res) => {
  try {
    const { medicineId } = req.params;

    const user = await User.findById(req.user._id);
    
    // Check if already in favorites
    const existingFavorite = user.favoriteMedicines.find(
      fav => fav.medicine.toString() === medicineId
    );

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Medicine already in favorites'
      });
    }

    user.favoriteMedicines.push({ medicine: medicineId });
    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('favoriteMedicines.medicine', 'name brand genericName');

    res.json({
      success: true,
      message: 'Medicine added to favorites',
      data: populatedUser.favoriteMedicines
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding medicine to favorites'
    });
  }
});

// Remove medicine from favorites
router.delete('/favorites/medicines/:medicineId', authMiddleware, async (req, res) => {
  try {
    const { medicineId } = req.params;

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: {
          favoriteMedicines: { medicine: medicineId }
        }
      }
    );

    res.json({
      success: true,
      message: 'Medicine removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing medicine from favorites'
    });
  }
});

// Add pharmacy to favorites
router.post('/favorites/pharmacies/:pharmacyId', authMiddleware, async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    const user = await User.findById(req.user._id);
    
    // Check if already in favorites
    const existingFavorite = user.favoritePharmacies.find(
      fav => fav.pharmacy.toString() === pharmacyId
    );

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacy already in favorites'
      });
    }

    user.favoritePharmacies.push({ pharmacy: pharmacyId });
    await user.save();

    const populatedUser = await User.findById(user._id)
      .populate('favoritePharmacies.pharmacy', 'name location contact');

    res.json({
      success: true,
      message: 'Pharmacy added to favorites',
      data: populatedUser.favoritePharmacies
    });

  } catch (error) {
    console.error('Add pharmacy favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding pharmacy to favorites'
    });
  }
});

// Remove pharmacy from favorites
router.delete('/favorites/pharmacies/:pharmacyId', authMiddleware, async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: {
          favoritePharmacies: { pharmacy: pharmacyId }
        }
      }
    );

    res.json({
      success: true,
      message: 'Pharmacy removed from favorites'
    });

  } catch (error) {
    console.error('Remove pharmacy favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing pharmacy from favorites'
    });
  }
});

// Get user's search history
router.get('/search-history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('searchHistory');
    
    res.json({
      success: true,
      data: user.searchHistory.slice(-20).reverse() // Last 20 searches, most recent first
    });

  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search history'
    });
  }
});

// Clear search history
router.delete('/search-history', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { searchHistory: [] } }
    );

    res.json({
      success: true,
      message: 'Search history cleared'
    });

  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing search history'
    });
  }
});

// Verify token endpoint
router.get('/verify', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: req.user
  });
});

// Logout (client-side token removal)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;