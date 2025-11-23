const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicamento_tratamiento');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicamento_tratamiento WHERE id_medicamento_tratamiento = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Relación no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id_medicamento, id_tratamiento, dosis, frecuencia } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO medicamento_tratamiento (id_medicamento, id_tratamiento, dosis, frecuencia) VALUES (?, ?, ?, ?)',
      [id_medicamento, id_tratamiento, dosis, frecuencia]
    );
    res.json({ id: result.insertId, message: 'Relación medicamento-tratamiento creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id_medicamento, id_tratamiento, dosis, frecuencia } = req.body;
  try {
    await pool.query(
      'UPDATE medicamento_tratamiento SET id_medicamento=?, id_tratamiento=?, dosis=?, frecuencia=? WHERE id_medicamento_tratamiento=?',
      [id_medicamento, id_tratamiento, dosis, frecuencia, req.params.id]
    );
    res.json({ message: 'Relación medicamento-tratamiento actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medicamento_tratamiento WHERE id_medicamento_tratamiento = ?', [req.params.id]);
    res.json({ message: 'Relación medicamento-tratamiento eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
