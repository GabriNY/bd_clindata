const express = require('express');
const router = express.Router();
const pool = require('../db');

// Buscar por DNI, nombre, apellido, especialidad
router.get('/buscar', async (req, res) => {
  const { dni, nombre, apellido, especialidad } = req.query;

  let sql = `
    SELECT m.id_medico, m.dni, m.nombre, m.apellido, m.telefono, m.sexo, m.tipo_sangre,
           e.nombre AS especialidad
    FROM medico m
    LEFT JOIN medico_especialidad me ON m.id_medico = me.id_medico
    LEFT JOIN especialidad e ON me.id_especialidad = e.id_especialidad
    WHERE 1=1
  `;
  const params = [];

  if (dni) {
    sql += ' AND m.dni = ?';
    params.push(dni.trim());
  }
  if (nombre) {
    sql += ' AND m.nombre LIKE ?';
    params.push(`${nombre.trim()}%`);
  }
  if (apellido) {
    sql += ' AND m.apellido LIKE ?';
    params.push(`${apellido.trim()}%`);
  }
  if (especialidad) {
    sql += ' AND e.nombre LIKE ?';
    params.push(`${especialidad.trim()}%`);
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Información completa
router.get('/:id/detalle', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.id_medico, m.nombre, m.apellido, m.telefono, m.sexo,
             e.nombre AS especialidad,
             c.id_cita, c.fecha_hora, c.estado, c.motivo
      FROM medico m
      LEFT JOIN medico_especialidad me ON m.id_medico = me.id_medico
      LEFT JOIN especialidad e ON me.id_especialidad = e.id_especialidad
      LEFT JOIN cita c ON m.id_medico = c.id_medico
      WHERE m.id_medico = ?;
    `, [req.params.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporte
router.get('/reporte', async (req, res) => {
  const { especialidad, desde, hasta, estado } = req.query;

  let sql = `
    SELECT m.id_medico, m.dni, m.nombre, m.apellido, m.telefono, m.sexo,
           e.nombre AS especialidad,
           c.id_cita, c.fecha_hora, c.estado, c.motivo
    FROM medico m
    LEFT JOIN medico_especialidad me ON m.id_medico = me.id_medico
    LEFT JOIN especialidad e ON me.id_especialidad = e.id_especialidad
    LEFT JOIN cita c ON m.id_medico = c.id_medico
    WHERE 1=1
  `;
  const params = [];

  if (especialidad && especialidad.trim() !== '') {
    sql += ' AND e.nombre LIKE ?';
    params.push(`%${especialidad.trim()}%`);
  }
  if (desde && hasta) {
    sql += ' AND c.fecha_hora BETWEEN ? AND ?';
    params.push(desde, hasta);
  }
  if (estado && estado.trim() !== '') {
    sql += ' AND c.estado = ?';
    params.push(estado.trim());
  }

  sql += ' ORDER BY m.apellido, m.nombre, c.fecha_hora';

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
  const { especialidad, desde, hasta, estado } = req.query;

  let sql = `
    SELECT m.id_medico, m.dni, m.nombre, m.apellido, m.telefono, m.sexo,
           e.nombre AS especialidad,
           c.id_cita, c.fecha_hora, c.estado, c.motivo
    FROM medico m
    LEFT JOIN medico_especialidad me ON m.id_medico = me.id_medico
    LEFT JOIN especialidad e ON me.id_especialidad = e.id_especialidad
    LEFT JOIN cita c ON m.id_medico = c.id_medico
    WHERE 1=1
  `;
  const params = [];

  if (especialidad && especialidad.trim() !== '') {
    sql += ' AND e.nombre LIKE ?';
    params.push(`%${especialidad.trim()}%`);
  }
  if (desde && hasta) {
    sql += ' AND c.fecha_hora BETWEEN ? AND ?';
    params.push(desde, hasta);
  }
  if (estado && estado.trim() !== '') {
    sql += ' AND c.estado = ?';
    params.push(estado.trim());
  }

  sql += ' ORDER BY m.apellido, m.nombre, c.fecha_hora';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Reporte Médicos');

    ws.columns = [
      { header: 'ID Médico', key: 'id_medico', width: 12 },
      { header: 'DNI', key: 'dni', width: 14 },
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 16 },
      { header: 'Sexo', key: 'sexo', width: 10 },
      { header: 'Especialidad', key: 'especialidad', width: 24 },
      { header: 'ID Cita', key: 'id_cita', width: 12 },
      { header: 'Fecha Cita', key: 'fecha_hora', width: 20 },
      { header: 'Estado Cita', key: 'estado', width: 14 },
      { header: 'Motivo', key: 'motivo', width: 30 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_medicos.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medico');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medico WHERE id_medico = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Médico no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO medico (dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil]
    );
    res.json({ id: result.insertId, message: 'Médico creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil } = req.body;
  try {
    await pool.query(
      'UPDATE medico SET dni=?, nombre=?, apellido=?, fecha_nacimiento=?, edad=?, sexo=?, telefono=?, tipo_sangre=?, correo=?, estado_civil=? WHERE id_medico=?',
      [dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil, req.params.id]
    );
    res.json({ message: 'Médico actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const idMedico = req.params.id;
  try {
    // 1. Eliminar relaciones en medico_especialidad
    await pool.query('DELETE FROM medico_especialidad WHERE id_medico = ?', [idMedico]);

    // 2. Eliminar el médico
    const [result] = await pool.query('DELETE FROM medico WHERE id_medico = ?', [idMedico]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    res.json({ message: 'Médico y sus relaciones eliminados correctamente' });
  } catch (err) {
    console.error('Error eliminando médico:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
