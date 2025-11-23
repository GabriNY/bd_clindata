const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM agenda');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM agenda WHERE id_agenda = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Agenda no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { fecha, hora_inicio, hora_fin, id_medico } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO agenda (fecha, hora_inicio, hora_fin, id_medico) VALUES (?, ?, ?, ?)',
      [fecha, hora_inicio, hora_fin, id_medico]
    );
    res.json({ id: result.insertId, message: 'Agenda creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { fecha, hora_inicio, hora_fin, id_medico } = req.body;
  try {
    await pool.query(
      'UPDATE agenda SET fecha=?, hora_inicio=?, hora_fin=?, id_medico=? WHERE id_agenda=?',
      [fecha, hora_inicio, hora_fin, id_medico, req.params.id]
    );
    res.json({ message: 'Agenda actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM agenda WHERE id_agenda = ?', [req.params.id]);
    res.json({ message: 'Agenda eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
