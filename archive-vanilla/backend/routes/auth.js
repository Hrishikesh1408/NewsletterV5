const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ email: username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, username: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    
    const redirect = ['platform', 'presales', 'qa', 'enterprise', 'sre'].includes(user.role) 
      ? 'team-editor.html' 
      : 'admin.html';
    
    res.json({ 
      success: true, 
      token, 
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      redirect 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;