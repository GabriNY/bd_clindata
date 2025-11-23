const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seguro');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seguro WHERE id_seguro = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Seguro no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, cobertura, contacto, telefono } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO seguro (nombre, cobertura, contacto, telefono) VALUES (?, ?, ?, ?)',
      [nombre, cobertura, contacto, telefono]
    );
    res.json({ id: result.insertId, message: 'Seguro creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, cobertura, contacto, telefono } = req.body;
  try {
    await pool.query(
      'UPDATE seguro SET nombre=?, cobertura=?, contacto=?, telefono=? WHERE id_seguro=?',
      [nombre, cobertura, contacto, telefono, req.params.id]
    );
    res.json({ message: 'Seguro actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM seguro WHERE id_seguro = ?', [req.params.id]);
    res.json({ message: 'Seguro eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
