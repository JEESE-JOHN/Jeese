const express = require('express');
const router = express.Router();

// Simple notification routes (notifications would be handled by a service in production)
router.get('/', async (req, res) => {
  try {
    // In production, this would fetch from a notifications database
    const notifications = [
      {
        id: '1',
        type: 'stock-alert',
        title: 'Medicine Back in Stock',
        message: 'Paracetamol is now available at MediPlus Pharmacy',
        timestamp: new Date(),
        read: false
      }
    ];

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
});

module.exports = router;