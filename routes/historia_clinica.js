const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/historia/reporte/:id', async (req, res) => {
  const { id } = req.params; // id_historia
  try {
    const [historia] = await pool.query(
      `SELECT h.id_historia, h.observaciones, h.fecha_creacion,
              p.id_paciente, p.nombre, p.apellido, p.dni
       FROM historia_clinica h
       INNER JOIN paciente p ON h.id_paciente = p.id_paciente
       WHERE h.id_historia = ?`,
      [id]
    );

    if (historia.length === 0) {
      return res.status(404).json({ error: 'Historia clínica no encontrada' });
    }

    const [antecedentes] = await pool.query(
      `SELECT id_antecedente, descripcion, alergia, cirugia, enfermedad_cronica, fecha_diagnostico
       FROM antecedente
       WHERE id_historia = ?`,
      [id]
    );

    const [diagnosticos] = await pool.query(
      `SELECT d.id_diagnostico, d.descripcion, d.fecha, d.hora, d.gravedad,
              m.id_medico, m.nombre AS nombre_medico, m.apellido AS apellido_medico
       FROM diagnostico d
       INNER JOIN medico m ON d.id_medico = m.id_medico
       WHERE d.id_historia = ?`,
      [id]
    );

    const [tratamientos] = await pool.query(
      `SELECT t.id_tratamiento, t.id_diagnostico, t.duracion, t.dosis, t.frecuencia,
              t.via_administracion, t.observaciones
       FROM tratamiento t
       INNER JOIN diagnostico d ON t.id_diagnostico = d.id_diagnostico
       WHERE d.id_historia = ?`,
      [id]
    );

    const respuesta = {
      historia: historia[0],
      antecedentes,
      diagnosticos: diagnosticos.map(d => ({
        ...d,
        tratamientos: tratamientos.filter(t => t.id_diagnostico === d.id_diagnostico)
      }))
    };

    res.json(respuesta);
  } catch (err) {
    console.error('Error en reporte historia clínica:', err);
    res.status(500).json({ error: 'Error interno al generar reporte' });
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
