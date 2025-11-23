const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tratamiento');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tratamiento WHERE id_tratamiento = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tratamiento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { descripcion, fecha_inicio, fecha_fin, id_diagnostico } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO tratamiento (descripcion, fecha_inicio, fecha_fin, id_diagnostico) VALUES (?, ?, ?, ?)',
      [descripcion, fecha_inicio, fecha_fin, id_diagnostico]
    );
    res.json({ id: result.insertId, message: 'Tratamiento creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { descripcion, fecha_inicio, fecha_fin, id_diagnostico } = req.body;
  try {
    await pool.query(
      'UPDATE tratamiento SET descripcion=?, fecha_inicio=?, fecha_fin=?, id_diagnostico=? WHERE id_tratamiento=?',
      [descripcion, fecha_inicio, fecha_fin, id_diagnostico, req.params.id]
    );
    res.json({ message: 'Tratamiento actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tratamiento WHERE id_tratamiento = ?', [req.params.id]);
    res.json({ message: 'Tratamiento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
