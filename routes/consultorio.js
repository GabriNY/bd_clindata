const express = require('express');
const router = express.Router();
const pool = require('../db');

// Reporte
router.get('/reporte', async (req, res) => {
  const { medico, fecha, piso, disponibilidad } = req.query;

  let sql = `
    SELECT con.numero AS consultorio, con.piso,
           a.id_agenda, a.fecha, a.hora_inicio, a.duracion AS duracion_agenda,
           CONCAT(m.nombre, ' ', m.apellido) AS medico,
           t.id_turno, t.hora_inicio AS hora_turno, t.duracion AS duracion_turno, t.disponibilidad
    FROM consultorio con
    JOIN cita c ON con.id_consultorio = c.id_consultorio
    JOIN medico m ON c.id_medico = m.id_medico
    JOIN agenda a ON m.id_medico = a.id_medico
    JOIN turno t ON a.id_agenda = t.id_agenda
    WHERE 1=1
  `;
  const params = [];

  if (medico && medico.trim()) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`${medico.trim()}%`, `${medico.trim()}%`);
  }
  if (fecha) {
    sql += ' AND a.fecha = ?';
    params.push(fecha);
  }
  if (piso) {
    sql += ' AND con.piso = ?';
    params.push(piso);
  }
  if (disponibilidad) {
    sql += ' AND t.disponibilidad = ?';
    params.push(disponibilidad);
  }

  sql += ' ORDER BY a.fecha, t.hora_inicio';

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
  const { medico, fecha, piso, disponibilidad } = req.query;

  let sql = `
    SELECT con.numero AS consultorio, con.piso,
           a.id_agenda, a.fecha, a.hora_inicio, a.duracion AS duracion_agenda,
           CONCAT(m.nombre, ' ', m.apellido) AS medico,
           t.id_turno, t.hora_inicio AS hora_turno, t.duracion AS duracion_turno, t.disponibilidad
    FROM consultorio con
    JOIN cita c ON con.id_consultorio = c.id_consultorio
    JOIN medico m ON c.id_medico = m.id_medico
    JOIN agenda a ON m.id_medico = a.id_medico
    JOIN turno t ON a.id_agenda = t.id_agenda
    WHERE 1=1
  `;
  const params = [];

  if (medico && medico.trim()) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`%${medico.trim()}%`, `%${medico.trim()}%`);
  }
  if (fecha) {
    sql += ' AND a.fecha = ?';
    params.push(fecha);
  }
  if (piso) {
    sql += ' AND con.piso = ?';
    params.push(piso);
  }
  if (disponibilidad) {
    sql += ' AND t.disponibilidad = ?';
    params.push(disponibilidad);
  }

  sql += ' ORDER BY a.fecha, t.hora_inicio';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Consultorios');

    ws.columns = [
      { header: 'Consultorio', key: 'consultorio', width: 14 },
      { header: 'Piso', key: 'piso', width: 10 },
      { header: 'ID Agenda', key: 'id_agenda', width: 12 },
      { header: 'Fecha Agenda', key: 'fecha', width: 16 },
      { header: 'Hora Inicio Agenda', key: 'hora_inicio', width: 18 },
      { header: 'Duración Agenda', key: 'duracion_agenda', width: 18 },
      { header: 'Médico', key: 'medico', width: 26 },
      { header: 'ID Turno', key: 'id_turno', width: 12 },
      { header: 'Hora Turno', key: 'hora_turno', width: 16 },
      { header: 'Duración Turno', key: 'duracion_turno', width: 18 },
      { header: 'Disponibilidad', key: 'disponibilidad', width: 18 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_consultorios.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM consultorio');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM consultorio WHERE id_consultorio = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Consultorio no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { numero, piso } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO consultorio (numero, piso) VALUES (?, ?)',
      [numero, piso]
    );
    res.json({ id: result.insertId, message: 'Consultorio creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { numero, piso } = req.body;
  try {
    await pool.query(
      'UPDATE consultorio SET numero=?, piso=? WHERE id_consultorio=?',
      [numero, piso, req.params.id]
    );
    res.json({ message: 'Consultorio actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM consultorio WHERE id_consultorio = ?', [req.params.id]);
    res.json({ message: 'Consultorio eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;