const express = require('express');
const router = express.Router();
const pool = require('../db');

// Reporte
router.get('/reporte', async (req, res) => {
  const { paciente, medico, desde, hasta } = req.query;

  let sql = `
    SELECT r.id_receta, r.fecha_emision,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           CONCAT(m.nombre, ' ', m.apellido) AS medico,
           med.nombre AS medicamento, med.laboratorio,
           rm.dosis, rm.instrucciones,
           st.cantidad AS stock, st.fecha_vencimiento
    FROM receta r
    JOIN medico m ON r.id_medico = m.id_medico
    LEFT JOIN cita c ON r.id_cita = c.id_cita
    LEFT JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN receta_medicamento rm ON r.id_receta = rm.id_receta
    JOIN medicamento med ON rm.id_medicamento = med.id_medicamento
    LEFT JOIN stock st ON med.id_medicamento = st.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (paciente && paciente.trim()) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ?)';
    params.push(`${paciente.trim()}%`, `${paciente.trim()}%`);
  }
  if (medico && medico.trim()) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`${medico.trim()}%`, `${medico.trim()}%`);
  }
  if (desde && hasta) {
    sql += ' AND r.fecha_emision BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY r.fecha_emision DESC, r.id_receta, med.nombre';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exportar reporte
const ExcelJS = require('exceljs');
router.get('/reporte/exportar', async (req, res) => {
  const { paciente, medico, desde, hasta } = req.query;

  let sql = `
    SELECT r.id_receta, r.fecha_emision,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           CONCAT(m.nombre, ' ', m.apellido) AS medico,
           med.nombre AS medicamento, med.laboratorio,
           rm.dosis, rm.instrucciones,
           st.cantidad AS stock, st.fecha_vencimiento
    FROM receta r
    JOIN medico m ON r.id_medico = m.id_medico
    LEFT JOIN cita c ON r.id_cita = c.id_cita
    LEFT JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN receta_medicamento rm ON r.id_receta = rm.id_receta
    JOIN medicamento med ON rm.id_medicamento = med.id_medicamento
    LEFT JOIN stock st ON med.id_medicamento = st.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (paciente && paciente.trim()) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ?)';
    params.push(`${paciente.trim()}%`, `${paciente.trim()}%`);
  }
  if (medico && medico.trim()) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`${medico.trim()}%`, `${medico.trim()}%`);
  }
  if (desde && hasta) {
    sql += ' AND r.fecha_emision BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY r.fecha_emision DESC, r.id_receta, med.nombre';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Recetas');

    ws.columns = [
      { header: 'ID Receta', key: 'id_receta', width: 12 },
      { header: 'Fecha Emisión', key: 'fecha_emision', width: 16 },
      { header: 'Paciente', key: 'paciente', width: 26 },
      { header: 'Médico', key: 'medico', width: 26 },
      { header: 'Medicamento', key: 'medicamento', width: 24 },
      { header: 'Laboratorio', key: 'laboratorio', width: 22 },
      { header: 'Dosis', key: 'dosis', width: 20 },
      { header: 'Instrucciones', key: 'instrucciones', width: 30 },
      { header: 'Stock', key: 'stock', width: 12 },
      { header: 'Vencimiento', key: 'fecha_vencimiento', width: 16 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_recetas.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receta');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM receta WHERE id_receta = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Receta no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { fecha_emision, indicaciones, id_tratamiento } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO receta (fecha_emision, indicaciones, id_tratamiento) VALUES (?, ?, ?)',
      [fecha_emision, indicaciones, id_tratamiento]
    );
    res.json({ id: result.insertId, message: 'Receta creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { fecha_emision, indicaciones, id_tratamiento } = req.body;
  try {
    await pool.query(
      'UPDATE receta SET fecha_emision=?, indicaciones=?, id_tratamiento=? WHERE id_receta=?',
      [fecha_emision, indicaciones, id_tratamiento, req.params.id]
    );
    res.json({ message: 'Receta actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM receta WHERE id_receta = ?', [req.params.id]);
    res.json({ message: 'Receta eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
