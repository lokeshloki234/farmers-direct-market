const db = require('../config/db');

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT p.*, u.name AS farmer_name, c.name AS category_name
      FROM products p
      JOIN users u ON p.farmer_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    res.status(200).json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [products] = await db.query(`
      SELECT p.*, u.name AS farmer_name, u.phone AS farmer_phone, c.name AS category_name
      FROM products p
      JOIN users u ON p.farmer_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json(products[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// CREATE PRODUCT (farmers only)
const createProduct = async (req, res) => {
  const { name, description, price, quantity, unit, category_id } = req.body;
  const farmer_id = req.user.id;

  if (!name || !price || !quantity) {
    return res.status(400).json({ message: 'Name, price and quantity are required.' });
  }

  // If an image was uploaded, save its path
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await db.query(
      `INSERT INTO products (farmer_id, category_id, name, description, price, quantity, unit, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [farmer_id, category_id || null, name, description || null, price, quantity, unit || 'kg', image_url]
    );

    res.status(201).json({
      message: 'Product created successfully.',
      productId: result.insertId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// UPDATE PRODUCT (only the farmer who created it)
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity, unit, category_id } = req.body;
  const farmer_id = req.user.id;

  try {
    // Check if product exists and belongs to this farmer
    const [products] = await db.query(
      'SELECT * FROM products WHERE id = ? AND farmer_id = ?',
      [id, farmer_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found or you do not have permission.' });
    }

    // If new image uploaded use it, otherwise keep the old one
    const image_url = req.file ? `/uploads/${req.file.filename}` : products[0].image_url;

    await db.query(
      `UPDATE products SET name=?, description=?, price=?, quantity=?, unit=?, category_id=?, image_url=?
       WHERE id = ? AND farmer_id = ?`,
      [
        name || products[0].name,
        description || products[0].description,
        price || products[0].price,
        quantity || products[0].quantity,
        unit || products[0].unit,
        category_id || products[0].category_id,
        image_url,
        id,
        farmer_id
      ]
    );

    res.status(200).json({ message: 'Product updated successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// DELETE PRODUCT (only the farmer who created it)
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const farmer_id = req.user.id;

  try {
    // Check if product exists and belongs to this farmer
    const [products] = await db.query(
      'SELECT * FROM products WHERE id = ? AND farmer_id = ?',
      [id, farmer_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found or you do not have permission.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.status(200).json({ message: 'Product deleted successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };