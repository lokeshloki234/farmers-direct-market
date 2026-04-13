const db = require('../config/db');

// PLACE AN ORDER (buyers only)
const placeOrder = async (req, res) => {
  const buyer_id = req.user.id;
  const { delivery_address, items } = req.body;

  // items should be an array like:
  // [{ product_id: 1, quantity: 2 }, { product_id: 3, quantity: 1 }]

  if (!delivery_address || !items || items.length === 0) {
    return res.status(400).json({ message: 'Delivery address and items are required.' });
  }

  try {
    let total_amount = 0;

    // Check each product exists and has enough quantity
    for (const item of items) {
      const [products] = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [item.product_id]
      );

      if (products.length === 0) {
        return res.status(404).json({ message: `Product with id ${item.product_id} not found.` });
      }

      const product = products[0];

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough quantity for ${product.name}. Available: ${product.quantity}`
        });
      }

      total_amount += product.price * item.quantity;
      item.price = product.price;
    }

    // Create the order
    const [orderResult] = await db.query(
      'INSERT INTO orders (buyer_id, total_amount, delivery_address) VALUES (?, ?, ?)',
      [buyer_id, total_amount, delivery_address]
    );

    const order_id = orderResult.insertId;

    // Insert each order item
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
        [order_id, item.product_id, item.quantity, item.price]
      );

      // Reduce product quantity
      await db.query(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    res.status(201).json({
      message: 'Order placed successfully.',
      orderId: order_id,
      total_amount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// GET BUYER'S OWN ORDERS
const getMyOrders = async (req, res) => {
  const buyer_id = req.user.id;

  try {
    const [orders] = await db.query(`
      SELECT o.*, 
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_at_time', oi.price_at_time
          )
        ) AS items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.buyer_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [buyer_id]);

    res.status(200).json(orders);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// GET ORDERS RECEIVED BY FARMER
const getReceivedOrders = async (req, res) => {
  const farmer_id = req.user.id;

  try {
    const [orders] = await db.query(`
      SELECT DISTINCT o.*, u.name AS buyer_name, u.phone AS buyer_phone
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE p.farmer_id = ?
      ORDER BY o.created_at DESC
    `, [farmer_id]);

    res.status(200).json(orders);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// UPDATE ORDER STATUS (farmers only)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const farmer_id = req.user.id;

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    // Make sure this order contains at least one product from this farmer
    const [orders] = await db.query(`
      SELECT DISTINCT o.id FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.id = ? AND p.farmer_id = ?
    `, [id, farmer_id]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found or you do not have permission.' });
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.status(200).json({ message: 'Order status updated successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { placeOrder, getMyOrders, getReceivedOrders, updateOrderStatus };