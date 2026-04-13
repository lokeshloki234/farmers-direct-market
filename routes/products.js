const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { verifyToken, isFarmer } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer config — handles image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Public routes — anyone can view products
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Farmer only routes — must be logged in as a farmer
router.post('/', verifyToken, isFarmer, upload.single('image'), createProduct);
router.put('/:id', verifyToken, isFarmer, upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, isFarmer, deleteProduct);

module.exports = router;