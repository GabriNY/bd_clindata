const express = require('express');
const router = express.Router();
const pool = require('../db');

// Reporte
router.get('/reporte', async (req, res) => {
  const { paciente, medico, gravedad, desde, hasta } = req.query;

  let sql = `
    SELECT d.id_diagnostico, d.descripcion AS diagnostico, d.gravedad, d.fecha, d.hora,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           CONCAT(m.nombre, ' ', m.apellido) AS medico,
           t.id_tratamiento, t.duracion, t.dosis, t.frecuencia, t.via_administracion,
           med.nombre AS medicamento
    FROM diagnostico d
    JOIN historia_clinica h ON d.id_historia = h.id_historia
    JOIN paciente p ON h.id_paciente = p.id_paciente
    JOIN medico m ON d.id_medico = m.id_medico
    LEFT JOIN tratamiento t ON d.id_diagnostico = t.id_diagnostico
    LEFT JOIN medicamento_tratamiento mt ON t.id_tratamiento = mt.id_tratamiento
    LEFT JOIN medicamento med ON mt.id_medicamento = med.id_medicamento
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
  if (gravedad && gravedad.trim()) {
    sql += ' AND d.gravedad = ?';
    params.push(gravedad.trim());
  }
  if (desde && hasta) {
    sql += ' AND d.fecha BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY d.fecha, d.hora, t.id_tratamiento';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Exportar reporte
const ExcelJS = require('exceljs');
router.get('/reporte/exportar', async (req, res) => {
  const { paciente, medico, gravedad, desde, hasta } = req.query;

  let sql = `
    SELECT d.id_diagnostico, d.descripcion AS diagnostico, d.gravedad, d.fecha, d.hora,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           CONCAT(m.nombre, ' ', m.apellido) AS medico,
           t.id_tratamiento, t.duracion, t.dosis, t.frecuencia, t.via_administracion,
           med.nombre AS medicamento
    FROM diagnostico d
    JOIN historia_clinica h ON d.id_historia = h.id_historia
    JOIN paciente p ON h.id_paciente = p.id_paciente
    JOIN medico m ON d.id_medico = m.id_medico
    LEFT JOIN tratamiento t ON d.id_diagnostico = t.id_diagnostico
    LEFT JOIN medicamento_tratamiento mt ON t.id_tratamiento = mt.id_tratamiento
    LEFT JOIN medicamento med ON mt.id_medicamento = med.id_medicamento
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
  if (gravedad && gravedad.trim()) {
    sql += ' AND d.gravedad = ?';
    params.push(gravedad.trim());
  }
  if (desde && hasta) {
    sql += ' AND d.fecha BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY d.fecha, d.hora, t.id_tratamiento';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Diagnósticos');

    ws.columns = [
      { header: 'ID Diagnóstico', key: 'id_diagnostico', width: 14 },
      { header: 'Diagnóstico', key: 'diagnostico', width: 32 },
      { header: 'Gravedad', key: 'gravedad', width: 14 },
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Hora', key: 'hora', width: 12 },
      { header: 'Paciente', key: 'paciente', width: 26 },
      { header: 'Médico', key: 'medico', width: 26 },
      { header: 'ID Tratamiento', key: 'id_tratamiento', width: 16 },
      { header: 'Duración', key: 'duracion', width: 16 },
      { header: 'Dosis', key: 'dosis', width: 18 },
      { header: 'Frecuencia', key: 'frecuencia', width: 18 },
      { header: 'Vía administración', key: 'via_administracion', width: 20 },
      { header: 'Medicamento', key: 'medicamento', width: 24 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_diagnosticos.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM diagnostico');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM diagnostico WHERE id_diagnostico = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { descripcion, fecha, id_historia } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO diagnostico (descripcion, fecha, id_historia) VALUES (?, ?, ?)',
      [descripcion, fecha, id_historia]
    );
    res.json({ id: result.insertId, message: 'Diagnóstico creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { descripcion, fecha, id_historia } = req.body;
  try {
    await pool.query(
      'UPDATE diagnostico SET descripcion=?, fecha=?, id_historia=? WHERE id_diagnostico=?',
      [descripcion, fecha, id_historia, req.params.id]
    );
    res.json({ message: 'Diagnóstico actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM diagnostico WHERE id_diagnostico = ?', [req.params.id]);
    res.json({ message: 'Diagnóstico eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
