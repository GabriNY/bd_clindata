const express = require('express');
const router = express.Router();
const pool = require('../db');

// Reporte
router.get('/reporte', async (req, res) => {
  const { estado, consultorio, medico, paciente, desde, hasta } = req.query;

  let sql = `
    SELECT c.id_cita, c.fecha_hora, c.estado, c.motivo, c.asistencia, c.duracion,
           con.numero AS consultorio,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           CONCAT(m.nombre, ' ', m.apellido) AS medico
    FROM cita c
    JOIN consultorio con ON c.id_consultorio = con.id_consultorio
    JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN medico m ON c.id_medico = m.id_medico
    WHERE 1=1
  `;
  const params = [];

  if (estado) {
    sql += ' AND c.estado = ?';
    params.push(estado);
  }
  if (consultorio) {
    sql += ' AND con.numero LIKE ?';
    params.push(`%${consultorio}%`);
  }
  if (medico) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`${medico}%`, `${medico}%`);
  }
  if (paciente) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ?)';
    params.push(`${paciente}%`, `${paciente}%`);
  }
  if (desde && hasta) {
    sql += ' AND c.fecha_hora BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY c.fecha_hora';

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
  const { estado, consultorio, medico, paciente, desde, hasta } = req.query;

  let sql = `
    SELECT c.id_cita, c.fecha_hora, c.estado, c.motivo, c.asistencia, c.duracion,
           con.numero AS consultorio,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           CONCAT(m.nombre, ' ', m.apellido) AS medico
    FROM cita c
    JOIN consultorio con ON c.id_consultorio = con.id_consultorio
    JOIN paciente p ON c.id_paciente = p.id_paciente
    JOIN medico m ON c.id_medico = m.id_medico
    WHERE 1=1
  `;
  const params = [];

  if (estado) {
    sql += ' AND c.estado = ?';
    params.push(estado);
  }
  if (consultorio) {
    sql += ' AND con.numero LIKE ?';
    params.push(`%${consultorio}%`);
  }
  if (medico) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`${medico}%`, `${medico}%`);
  }
  if (paciente) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ?)';
    params.push(`${paciente}%`, `${paciente}%`);
  }
  if (desde && hasta) {
    sql += ' AND c.fecha_hora BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY c.fecha_hora';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Reporte Citas');

    ws.columns = [
      { header: 'ID Cita', key: 'id_cita', width: 10 },
      { header: 'Fecha/Hora', key: 'fecha_hora', width: 20 },
      { header: 'Estado', key: 'estado', width: 14 },
      { header: 'Motivo', key: 'motivo', width: 30 },
      { header: 'Asistencia', key: 'asistencia', width: 14 },
      { header: 'Duración', key: 'duracion', width: 12 },
      { header: 'Consultorio', key: 'consultorio', width: 14 },
      { header: 'Paciente', key: 'paciente', width: 24 },
      { header: 'Médico', key: 'medico', width: 24 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_citas.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cita');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cita WHERE id_cita = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { fecha_hora, estado, motivo, asistencia, duracion, id_consultorio, id_paciente, id_medico } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO cita (fecha_hora, estado, motivo, asistencia, duracion, id_consultorio, id_paciente, id_medico) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [fecha_hora, estado, motivo, asistencia, duracion, id_consultorio, id_paciente, id_medico]
    );
    res.json({ id: result.insertId, message: 'Cita creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { fecha_hora, estado, motivo, asistencia, duracion, id_consultorio, id_paciente, id_medico } = req.body;
  try {
    await pool.query(
      'UPDATE cita SET fecha_hora=?, estado=?, motivo=?, asistencia=?, duracion=?, id_consultorio=?, id_paciente=?, id_medico=? WHERE id_cita=?',
      [fecha_hora, estado, motivo, asistencia, duracion, id_consultorio, id_paciente, id_medico, req.params.id]
    );
    res.json({ message: 'Cita actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cita WHERE id_cita = ?', [req.params.id]);
    res.json({ message: 'Cita eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
