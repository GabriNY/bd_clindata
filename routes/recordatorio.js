const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recordatorio');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recordatorio WHERE id_recordatorio = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Recordatorio no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { mensaje, fecha_envio, id_paciente } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO recordatorio (mensaje, fecha_envio, id_paciente) VALUES (?, ?, ?)',
      [mensaje, fecha_envio, id_paciente]
    );
    res.json({ id: result.insertId, message: 'Recordatorio creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { mensaje, fecha_envio, id_paciente } = req.body;
  try {
    await pool.query(
      'UPDATE recordatorio SET mensaje=?, fecha_envio=?, id_paciente=? WHERE id_recordatorio=?',
      [mensaje, fecha_envio, id_paciente, req.params.id]
    );
    res.json({ message: 'Recordatorio actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM recordatorio WHERE id_recordatorio = ?', [req.params.id]);
    res.json({ message: 'Recordatorio eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
