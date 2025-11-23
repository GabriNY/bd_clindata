const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM turno');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM turno WHERE id_turno = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Turno no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { fecha, hora, id_paciente, id_medico } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO turno (fecha, hora, id_paciente, id_medico) VALUES (?, ?, ?, ?)',
      [fecha, hora, id_paciente, id_medico]
    );
    res.json({ id: result.insertId, message: 'Turno creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { fecha, hora, id_paciente, id_medico } = req.body;
  try {
    await pool.query(
      'UPDATE turno SET fecha=?, hora=?, id_paciente=?, id_medico=? WHERE id_turno=?',
      [fecha, hora, id_paciente, id_medico, req.params.id]
    );
    res.json({ message: 'Turno actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM turno WHERE id_turno = ?', [req.params.id]);
    res.json({ message: 'Turno eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
