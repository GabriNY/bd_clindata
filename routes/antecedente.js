const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM antecedente');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM antecedente WHERE id_antecedente = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Antecedente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { descripcion, alergia, cirugia, enfermedad_cronica, fecha_diagnostico, id_historia } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO antecedente (descripcion, alergia, cirugia, enfermedad_cronica, fecha_diagnostico, id_historia) VALUES (?, ?, ?, ?, ?, ?)',
      [descripcion, alergia, cirugia, enfermedad_cronica, fecha_diagnostico, id_historia]
    );
    res.json({ id: result.insertId, message: 'Antecedente creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { descripcion, alergia, cirugia, enfermedad_cronica, fecha_diagnostico, id_historia } = req.body;
  try {
    await pool.query(
      'UPDATE antecedente SET descripcion=?, alergia=?, cirugia=?, enfermedad_cronica=?, fecha_diagnostico=?, id_historia=? WHERE id_antecedente=?',
      [descripcion, alergia, cirugia, enfermedad_cronica, fecha_diagnostico, id_historia, req.params.id]
    );
    res.json({ message: 'Antecedente actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM antecedente WHERE id_antecedente = ?', [req.params.id]);
    res.json({ message: 'Antecedente eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
