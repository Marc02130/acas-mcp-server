/**
 * Authentication test routes
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

// Public route - no authentication required
router.get('/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint that anyone can access'
  });
});

// Protected route - authentication required
router.get('/protected', authenticate(), (req, res) => {
  res.json({
    message: 'You have accessed a protected endpoint',
    user: req.user
  });
});

// Admin route - requires specific role
router.get('/admin', authenticate({ requiredRoles: ['ROLE_ACAS-ADMINS'] }), (req, res) => {
  res.json({
    message: 'You have accessed an admin endpoint',
    user: req.user
  });
});

module.exports = router;