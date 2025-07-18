const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favoriteMedicines.medicine', 'name brand genericName category')
      .populate('favoritePharmacies.pharmacy', 'name location contact rating');

    // Get recent search history
    const recentSearches = user.searchHistory.slice(-10).reverse();

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          preferences: user.preferences,
          location: user.location
        },
        favoriteMedicines: user.favoriteMedicines,
        favoritePharmacies: user.favoritePharmacies,
        recentSearches
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Update user location
router.put('/location', async (req, res) => {
  try {
    const { address, coordinates, city, state, pincode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          address,
          coordinates,
          city,
          state,
          pincode
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: user.location
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location'
    });
  }
});

// Update user preferences
router.put('/preferences', async (req, res) => {
  try {
    const { language, accessibilityMode, fontSize, voiceEnabled } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        preferences: {
          language: language || req.user.preferences.language,
          accessibilityMode: accessibilityMode !== undefined ? accessibilityMode : req.user.preferences.accessibilityMode,
          fontSize: fontSize || req.user.preferences.fontSize,
          voiceEnabled: voiceEnabled !== undefined ? voiceEnabled : req.user.preferences.voiceEnabled
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

// Update notification settings
router.put('/notifications', async (req, res) => {
  try {
    const { sms, whatsapp, email, push } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        notifications: {
          sms: sms !== undefined ? sms : req.user.notifications.sms,
          whatsapp: whatsapp !== undefined ? whatsapp : req.user.notifications.whatsapp,
          email: email !== undefined ? email : req.user.notifications.email,
          push: push !== undefined ? push : req.user.notifications.push
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: user.notifications
    });

  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings'
    });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const stats = {
      searchesCount: user.searchHistory.length,
      favoriteMedicinesCount: user.favoriteMedicines.length,
      favoritePharmaciesCount: user.favoritePharmacies.length,
      accountAge: Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24)) // days
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    });
  }
});

module.exports = router;