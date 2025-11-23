const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medico_especialidad');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medico_especialidad WHERE id_medico_especialidad = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Relación no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { id_medico, id_especialidad } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES (?, ?)',
      [id_medico, id_especialidad]
    );
    res.json({ id: result.insertId, message: 'Relación creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id_medico, id_especialidad } = req.body;
  try {
    await pool.query(
      'UPDATE medico_especialidad SET id_medico=?, id_especialidad=? WHERE id_medico_especialidad=?',
      [id_medico, id_especialidad, req.params.id]
    );
    res.json({ message: 'Relación actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medico_especialidad WHERE id_medico_especialidad = ?', [req.params.id]);
    res.json({ message: 'Relación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
