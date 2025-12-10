const express = require('express');
const router = express.Router();
const pool = require('../db');

// Reporte
router.get('/reporte', async (req, res) => {
  const { paciente, gravedad, desde, hasta } = req.query;

  let sql = `
    SELECT h.id_historia, h.fecha_creacion, h.observaciones,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           d.id_diagnostico, d.descripcion AS diagnostico, d.gravedad, d.fecha, d.hora,
           CONCAT(m.nombre, ' ', m.apellido) AS medico
    FROM historia_clinica h
    JOIN paciente p ON h.id_paciente = p.id_paciente
    LEFT JOIN diagnostico d ON h.id_historia = d.id_historia
    LEFT JOIN medico m ON d.id_medico = m.id_medico
    WHERE 1=1
  `;
  const params = [];

  if (paciente) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ?)';
    params.push(`${paciente}%`, `${paciente}%`);
  }
  if (gravedad) {
    sql += ' AND d.gravedad = ?';
    params.push(gravedad);
  }
  if (desde && hasta) {
    sql += ' AND h.fecha_creacion BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY h.fecha_creacion, d.fecha, d.hora';

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
  const { paciente, gravedad, desde, hasta } = req.query;

  let sql = `
    SELECT h.id_historia, h.fecha_creacion, h.observaciones,
           CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           d.id_diagnostico, d.descripcion AS diagnostico, d.gravedad, d.fecha, d.hora,
           CONCAT(m.nombre, ' ', m.apellido) AS medico
    FROM historia_clinica h
    JOIN paciente p ON h.id_paciente = p.id_paciente
    LEFT JOIN diagnostico d ON h.id_historia = d.id_historia
    LEFT JOIN medico m ON d.id_medico = m.id_medico
    WHERE 1=1
  `;
  const params = [];

  if (paciente) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ?)';
    params.push(`${paciente}%`, `${paciente}%`);
  }
  if (gravedad) {
    sql += ' AND d.gravedad = ?';
    params.push(gravedad);
  }
  if (desde && hasta) {
    sql += ' AND h.fecha_creacion BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY h.fecha_creacion, d.fecha, d.hora';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Reporte Historias');

    ws.columns = [
      { header: 'ID Historia', key: 'id_historia', width: 12 },
      { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 },
      { header: 'Observaciones', key: 'observaciones', width: 30 },
      { header: 'Paciente', key: 'paciente', width: 24 },
      { header: 'ID Diagnóstico', key: 'id_diagnostico', width: 12 },
      { header: 'Diagnóstico', key: 'diagnostico', width: 30 },
      { header: 'Gravedad', key: 'gravedad', width: 14 },
      { header: 'Fecha Diagnóstico', key: 'fecha', width: 20 },
      { header: 'Hora Diagnóstico', key: 'hora', width: 14 },
      { header: 'Médico', key: 'medico', width: 24 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_historias.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM historia_clinica');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM historia_clinica WHERE id_historia = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Historia clínica no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { observaciones, fecha_creacion, id_paciente } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO historia_clinica (observaciones, fecha_creacion, id_paciente) VALUES (?, ?, ?)',
      [observaciones, fecha_creacion, id_paciente]
    );
    res.json({ id: result.insertId, message: 'Historia clínica creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { observaciones, fecha_creacion, id_paciente } = req.body;
  try {
    await pool.query(
      'UPDATE historia_clinica SET observaciones=?, fecha_creacion=?, id_paciente=? WHERE id_historia=?',
      [observaciones, fecha_creacion, id_paciente, req.params.id]
    );
    res.json({ message: 'Historia clínica actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/historia/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`
      DELETE t FROM tratamiento t
      INNER JOIN diagnostico d ON t.id_diagnostico = d.id_diagnostico
      WHERE d.id_historia = ?`, [id]);

    await conn.query(`DELETE FROM diagnostico WHERE id_historia = ?`, [id]);

    await conn.query(`DELETE FROM antecedente WHERE id_historia = ?`, [id]);

    await conn.query(`DELETE FROM historia_clinica WHERE id_historia = ?`, [id]);

    await conn.commit();
    res.json({ message: 'Historia clínica y registros asociados eliminados' });
  } catch (err) {
    await conn.rollback();
    console.error('Error al eliminar historia clínica:', err);
    res.status(500).json({ error: 'Error interno al eliminar historia clínica' });
  } finally {
    conn.release();
  }
});

module.exports = router;
