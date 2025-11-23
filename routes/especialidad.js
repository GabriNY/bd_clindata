const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM especialidad');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM especialidad WHERE id_especialidad = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Especialidad no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, descripcion, area } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO especialidad (nombre, descripcion, area) VALUES (?, ?, ?)',
      [nombre, descripcion, area]
    );
    res.json({ id: result.insertId, message: 'Especialidad creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion, area } = req.body;
  try {
    await pool.query(
      'UPDATE especialidad SET nombre=?, descripcion=?, area=? WHERE id_especialidad=?',
      [nombre, descripcion, area, req.params.id]
    );
    res.json({ message: 'Especialidad actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM especialidad WHERE id_especialidad = ?', [req.params.id]);
    res.json({ message: 'Especialidad eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
