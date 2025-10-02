const express = require('express');
const multer = require('multer');
const authMiddleware = require('../authMiddleware');
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload single image and return base64
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    res.json({ 
      success: true, 
      image: base64,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images and return base64 array
router.post('/images', authMiddleware, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const images = req.files.map(file => ({
      data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      filename: file.originalname,
      size: file.size
    }));
    
    res.json({ 
      success: true, 
      images: images
    });
  } catch (error) {
    console.error('Images upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

module.exports = router;