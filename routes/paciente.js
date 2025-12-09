const express = require('express');
const router = express.Router();
const pool = require('../db');


// Buscar por DNI, nombre, apellido
router.get('/buscar', async (req, res) => {
  const { dni, nombre, apellido } = req.query;

  let sql = 'SELECT * FROM paciente WHERE 1=1';
  const params = [];

  if (dni && dni.trim() !== '') {
    sql += ' AND dni = ?';
    params.push(dni.trim());
  }
  if (nombre && nombre.trim() !== '') {
    sql += ' AND nombre LIKE ?';
    params.push(`${nombre.trim()}%`);
  }
  if (apellido && apellido.trim() !== '') {
    sql += ' AND apellido LIKE ?';
    params.push(`${apellido.trim()}%`);
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows); // Devuelve directamente el array
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Información completa
router.get('/:id/detalle', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id_paciente, p.nombre, p.apellido, p.dni,
             s.nombre AS seguro,
             h.id_historia, 
             h.observaciones, h.fecha_creacion,
             c.id_cita, c.fecha_hora, c.estado, c.motivo
      FROM paciente p
      LEFT JOIN seguro s ON p.id_seguro = s.id_seguro
      LEFT JOIN historia_clinica h ON p.id_paciente = h.id_paciente
      LEFT JOIN cita c ON p.id_paciente = c.id_paciente
      WHERE p.id_paciente = ?;
    `, [req.params.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historial clinico
router.get('/:id/historial', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id_paciente, CONCAT(p.nombre, ' ', p.apellido) AS paciente,
             h.id_historia, 
             d.descripcion AS diagnostico,
             t.duracion, t.dosis, t.frecuencia, t.via_administracion,
             m.nombre AS medicamento
      FROM paciente p
      JOIN historia_clinica h ON p.id_paciente = h.id_paciente
      JOIN diagnostico d ON h.id_historia = d.id_historia
      JOIN tratamiento t ON d.id_diagnostico = t.id_diagnostico
      JOIN medicamento_tratamiento mt ON t.id_tratamiento = mt.id_tratamiento
      JOIN medicamento m ON mt.id_medicamento = m.id_medicamento
      WHERE p.id_paciente = ?;
    `, [req.params.id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporte
router.get('/reporte', async (req, res) => {
  const { edad_min, edad_max, sexo, seguro, desde, hasta } = req.query;

  let sql = `
    SELECT p.id_paciente, p.dni, CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           p.edad, p.sexo, s.nombre AS seguro,
           h.id_historia, h.fecha_creacion,
           d.descripcion AS diagnostico, d.gravedad,
           t.duracion, t.dosis, t.frecuencia, t.via_administracion,
           m.nombre AS medicamento
    FROM paciente p
    LEFT JOIN seguro s ON p.id_seguro = s.id_seguro
    LEFT JOIN historia_clinica h ON p.id_paciente = h.id_paciente
    LEFT JOIN diagnostico d ON h.id_historia = d.id_historia
    LEFT JOIN tratamiento t ON d.id_diagnostico = t.id_diagnostico
    LEFT JOIN medicamento_tratamiento mt ON t.id_tratamiento = mt.id_tratamiento
    LEFT JOIN medicamento m ON mt.id_medicamento = m.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (edad_min) {
    sql += ' AND p.edad >= ?';
    params.push(Number(edad_min));
  }
  if (edad_max) {
    sql += ' AND p.edad <= ?';
    params.push(Number(edad_max));
  }
  if (sexo) {
    sql += ' AND p.sexo = ?';
    params.push(sexo);
  }
  if (seguro) {
    sql += ' AND s.nombre LIKE ?';
    params.push(`%${seguro}%`);
  }
  if (desde && hasta) {
    sql += ' AND h.fecha_creacion BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY paciente, h.fecha_creacion';

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
  const { edad_min, edad_max, sexo, seguro, desde, hasta } = req.query;

  let sql = `
    SELECT p.id_paciente, p.dni, CONCAT(p.nombre, ' ', p.apellido) AS paciente,
           p.edad, p.sexo, s.nombre AS seguro,
           h.id_historia, h.fecha_creacion,
           d.descripcion AS diagnostico, d.gravedad,
           t.duracion, t.dosis, t.frecuencia, t.via_administracion,
           m.nombre AS medicamento
    FROM paciente p
    LEFT JOIN seguro s ON p.id_seguro = s.id_seguro
    LEFT JOIN historia_clinica h ON p.id_paciente = h.id_paciente
    LEFT JOIN diagnostico d ON h.id_historia = d.id_historia
    LEFT JOIN tratamiento t ON d.id_diagnostico = t.id_diagnostico
    LEFT JOIN medicamento_tratamiento mt ON t.id_tratamiento = mt.id_tratamiento
    LEFT JOIN medicamento m ON mt.id_medicamento = m.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (edad_min) {
    sql += ' AND p.edad >= ?';
    params.push(Number(edad_min));
  }
  if (edad_max) {
    sql += ' AND p.edad <= ?';
    params.push(Number(edad_max));
  }
  if (sexo) {
    sql += ' AND p.sexo = ?';
    params.push(sexo);
  }
  if (seguro) {
    sql += ' AND s.nombre LIKE ?';
    params.push(`%${seguro}%`);
  }
  if (desde && hasta) {
    sql += ' AND h.fecha_creacion BETWEEN ? AND ?';
    params.push(desde, hasta);
  }

  sql += ' ORDER BY paciente, h.fecha_creacion';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Reporte Pacientes');

    ws.columns = [
      { header: 'ID Paciente', key: 'id_paciente', width: 12 },
      { header: 'DNI', key: 'dni', width: 14 },
      { header: 'Paciente', key: 'paciente', width: 24 },
      { header: 'Edad', key: 'edad', width: 10 },
      { header: 'Sexo', key: 'sexo', width: 10 },
      { header: 'Seguro', key: 'seguro', width: 20 },
      { header: 'ID Historia', key: 'id_historia', width: 12 },
      { header: 'Fecha Historia', key: 'fecha_creacion', width: 20 },
      { header: 'Diagnóstico', key: 'diagnostico', width: 30 },
      { header: 'Gravedad', key: 'gravedad', width: 14 },
      { header: 'Duración', key: 'duracion', width: 14 },
      { header: 'Dosis', key: 'dosis', width: 14 },
      { header: 'Frecuencia', key: 'frecuencia', width: 18 },
      { header: 'Vía administración', key: 'via_administracion', width: 18 },
      { header: 'Medicamento', key: 'medicamento', width: 20 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_pacientes.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consolidado clínico
router.get('/consolidado', async (req, res) => {
  const { paciente, medico, gravedad, desde, hasta } = req.query;

  let sql = `
    SELECT
      p.id_paciente,
      p.dni,
      CONCAT(p.nombre, ' ', p.apellido) AS paciente,
      p.edad, p.sexo,
      s.nombre AS seguro,

      h.id_historia, h.fecha_creacion, h.observaciones,

      a.id_antecedente, a.descripcion AS antecedente, a.alergia, a.cirugia,
      a.enfermedad_cronica, a.fecha_diagnostico AS fecha_antecedente,

      d.id_diagnostico, d.descripcion AS diagnostico, d.gravedad, d.fecha AS fecha_dx, d.hora AS hora_dx,
      CONCAT(m.nombre, ' ', m.apellido) AS medico,

      t.id_tratamiento, t.duracion, t.dosis, t.frecuencia, t.via_administracion, t.observaciones AS obs_tratamiento,
      medt.nombre AS medicamento_tratamiento, medt.laboratorio AS laboratorio_tratamiento,

      r.id_receta, r.fecha_emision, r.instrucciones AS instrucciones_receta,
      medr.nombre AS medicamento_receta, medr.laboratorio AS laboratorio_receta,
      rm.dosis AS dosis_receta, rm.instrucciones AS instrucciones_medicamento_receta,

      st.cantidad AS stock_disponible, st.fecha_vencimiento
    FROM paciente p
    LEFT JOIN seguro s ON p.id_seguro = s.id_seguro

    LEFT JOIN historia_clinica h ON p.id_paciente = h.id_paciente
    LEFT JOIN antecedente a ON h.id_historia = a.id_historia

    LEFT JOIN diagnostico d ON h.id_historia = d.id_historia
    LEFT JOIN medico m ON d.id_medico = m.id_medico

    LEFT JOIN tratamiento t ON d.id_diagnostico = t.id_diagnostico
    LEFT JOIN medicamento_tratamiento mtt ON t.id_tratamiento = mtt.id_tratamiento
    LEFT JOIN medicamento medt ON mtt.id_medicamento = medt.id_medicamento

    LEFT JOIN receta r ON r.id_cita IN (
      SELECT c.id_cita
      FROM cita c
      WHERE c.id_paciente = p.id_paciente
    )
    LEFT JOIN receta_medicamento rm ON r.id_receta = rm.id_receta
    LEFT JOIN medicamento medr ON rm.id_medicamento = medr.id_medicamento

    LEFT JOIN stock st ON medr.id_medicamento = st.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (paciente && paciente.trim()) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)';
    params.push(`%${paciente.trim()}%`, `%${paciente.trim()}%`, `%${paciente.trim()}%`);
  }
  if (medico && medico.trim()) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`%${medico.trim()}%`, `%${medico.trim()}%`);
  }
  if (gravedad && gravedad.trim()) {
    sql += ' AND d.gravedad = ?';
    params.push(gravedad.trim());
  }
  if (desde && hasta) {
    sql += ' AND (h.fecha_creacion BETWEEN ? AND ? OR d.fecha BETWEEN ? AND ?)';
    params.push(desde, hasta, desde, hasta);
  }

  sql += `
    ORDER BY paciente, h.fecha_creacion, d.fecha, d.hora, t.id_tratamiento,
             r.fecha_emision, medr.nombre
  `;

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exportar consolidado
router.get('/consolidado/exportar', async (req, res) => {
  const { paciente, medico, gravedad, desde, hasta } = req.query;

  let sql = `
    SELECT
      p.id_paciente,
      p.dni,
      CONCAT(p.nombre, ' ', p.apellido) AS paciente,
      p.edad, p.sexo,
      s.nombre AS seguro,

      h.id_historia, h.fecha_creacion, h.observaciones,

      a.id_antecedente, a.descripcion AS antecedente, a.alergia, a.cirugia,
      a.enfermedad_cronica, a.fecha_diagnostico AS fecha_antecedente,

      d.id_diagnostico, d.descripcion AS diagnostico, d.gravedad, d.fecha AS fecha_dx, d.hora AS hora_dx,
      CONCAT(m.nombre, ' ', m.apellido) AS medico,

      t.id_tratamiento, t.duracion, t.dosis, t.frecuencia, t.via_administracion,
      med.nombre AS medicamento, med.laboratorio
    FROM paciente p
    LEFT JOIN seguro s ON p.id_seguro = s.id_seguro
    LEFT JOIN historia_clinica h ON p.id_paciente = h.id_paciente
    LEFT JOIN antecedente a ON h.id_historia = a.id_historia
    LEFT JOIN diagnostico d ON h.id_historia = d.id_historia
    LEFT JOIN medico m ON d.id_medico = m.id_medico
    LEFT JOIN tratamiento t ON d.id_diagnostico = t.id_diagnostico
    LEFT JOIN medicamento_tratamiento mt ON t.id_tratamiento = mt.id_tratamiento
    LEFT JOIN medicamento med ON mt.id_medicamento = med.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (paciente && paciente.trim()) {
    sql += ' AND (p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?)';
    params.push(`%${paciente.trim()}%`, `%${paciente.trim()}%`, `%${paciente.trim()}%`);
  }
  if (medico && medico.trim()) {
    sql += ' AND (m.nombre LIKE ? OR m.apellido LIKE ?)';
    params.push(`%${medico.trim()}%`, `%${medico.trim()}%`);
  }
  if (gravedad && gravedad.trim()) {
    sql += ' AND d.gravedad = ?';
    params.push(gravedad.trim());
  }
  if (desde && hasta) {
    sql += ' AND (h.fecha_creacion BETWEEN ? AND ? OR d.fecha BETWEEN ? AND ?)';
    params.push(desde, hasta, desde, hasta);
  }

  sql += ' ORDER BY paciente, h.fecha_creacion, d.fecha, d.hora';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Consolidado Pacientes');

    ws.columns = [
      { header: 'ID Paciente', key: 'id_paciente', width: 12 },
      { header: 'DNI', key: 'dni', width: 14 },
      { header: 'Paciente', key: 'paciente', width: 26 },
      { header: 'Edad', key: 'edad', width: 8 },
      { header: 'Sexo', key: 'sexo', width: 8 },
      { header: 'Seguro', key: 'seguro', width: 18 },
      { header: 'ID Historia', key: 'id_historia', width: 12 },
      { header: 'Fecha Historia', key: 'fecha_creacion', width: 14 },
      { header: 'Obs Historia', key: 'observaciones', width: 26 },
      { header: 'ID Antecedente', key: 'id_antecedente', width: 12 },
      { header: 'Antecedente', key: 'antecedente', width: 26 },
      { header: 'Alergia', key: 'alergia', width: 20 },
      { header: 'Cirugía', key: 'cirugia', width: 20 },
      { header: 'Enfermedad crónica', key: 'enfermedad_cronica', width: 22 },
      { header: 'Fecha antecedente', key: 'fecha_antecedente', width: 14 },
      { header: 'ID Diagnóstico', key: 'id_diagnostico', width: 12 },
      { header: 'Diagnóstico', key: 'diagnostico', width: 28 },
      { header: 'Gravedad', key: 'gravedad', width: 12 },
      { header: 'Fecha Dx', key: 'fecha_dx', width: 12 },
      { header: 'Hora Dx', key: 'hora_dx', width: 12 },
      { header: 'Médico', key: 'medico', width: 24 },
      { header: 'ID Tratamiento', key: 'id_tratamiento', width: 12 },
      { header: 'Duración', key: 'duracion', width: 12 },
      { header: 'Dosis', key: 'dosis', width: 16 },
      { header: 'Frecuencia', key: 'frecuencia', width: 16 },
      { header: 'Vía', key: 'via_administracion', width: 12 },
      { header: 'Medicamento', key: 'medicamento', width: 22 },
      { header: 'Laboratorio', key: 'laboratorio', width: 18 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=consolidado_pacientes.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM paciente');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM paciente WHERE id_paciente = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil, id_seguro } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO paciente (dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil, id_seguro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [dni, nombre, apellido, fecha_nacimiento, edad, sexo, telefono, tipo_sangre, correo, estado_civil, id_seguro]
    );
    res.json({ id: result.insertId, message: 'Paciente creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {dni,nombre,apellido,fecha_nacimiento,edad,sexo,telefono,tipo_sangre,correo,estado_civil,id_seguro} = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE paciente SET
        dni = ?,
        nombre = ?,
        apellido = ?,
        fecha_nacimiento = ?,
        edad = ?,
        sexo = ?,
        telefono = ?,
        tipo_sangre = ?,
        correo = ?,
        estado_civil = ?,
        id_seguro = ?
      WHERE id_paciente = ?`,
      [dni,nombre,apellido,fecha_nacimiento,edad,sexo,telefono,tipo_sangre,correo,estado_civil,id_seguro || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json({ message: 'Paciente actualizado correctamente' });
  } 
  catch (err) {
    console.error('Error actualizando paciente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM paciente WHERE id_paciente = ?', [req.params.id]);
    res.json({ message: 'Paciente eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
