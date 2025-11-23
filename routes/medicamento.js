const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicamento');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicamento WHERE id_medicamento = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Medicamento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, dosis, presentacion, laboratorio } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO medicamento (nombre, dosis, presentacion, laboratorio) VALUES (?, ?, ?, ?)',
      [nombre, dosis, presentacion, laboratorio]
    );
    res.json({ id: result.insertId, message: 'Medicamento creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, dosis, presentacion, laboratorio } = req.body;
  try {
    await pool.query(
      'UPDATE medicamento SET nombre=?, dosis=?, presentacion=?, laboratorio=? WHERE id_medicamento=?',
      [nombre, dosis, presentacion, laboratorio, req.params.id]
    );
    res.json({ message: 'Medicamento actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medicamento WHERE id_medicamento = ?', [req.params.id]);
    res.json({ message: 'Medicamento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
