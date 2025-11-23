const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receta_medicamento');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receta_medicamento WHERE id_receta_medicamento = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Relación no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id_receta, id_medicamento, cantidad, indicaciones } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO receta_medicamento (id_receta, id_medicamento, cantidad, indicaciones) VALUES (?, ?, ?, ?)',
      [id_receta, id_medicamento, cantidad, indicaciones]
    );
    res.json({ id: result.insertId, message: 'Relación receta-medicamento creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id_receta, id_medicamento, cantidad, indicaciones } = req.body;
  try {
    await pool.query(
      'UPDATE receta_medicamento SET id_receta=?, id_medicamento=?, cantidad=?, indicaciones=? WHERE id_receta_medicamento=?',
      [id_receta, id_medicamento, cantidad, indicaciones, req.params.id]
    );
    res.json({ message: 'Relación receta-medicamento actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM receta_medicamento WHERE id_receta_medicamento = ?', [req.params.id]);
    res.json({ message: 'Relación receta-medicamento eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
