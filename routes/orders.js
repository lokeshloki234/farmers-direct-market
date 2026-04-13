const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getReceivedOrders, updateOrderStatus } = require('../controllers/orderController');
const { verifyToken, isFarmer, isBuyer } = require('../middleware/auth');

router.post('/', verifyToken, isBuyer, placeOrder);
router.get('/mine', verifyToken, isBuyer, getMyOrders);
router.get('/received', verifyToken, isFarmer, getReceivedOrders);
router.put('/:id/status', verifyToken, isFarmer, updateOrderStatus);

module.exports = router;