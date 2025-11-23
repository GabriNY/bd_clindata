const express = require('express');
const router = express.Router();
const pool = require('../db');

// Reporte
router.get('/reporte', async (req, res) => {
  const { nombre, laboratorio, umbral } = req.query;

  let sql = `
    SELECT med.id_medicamento, med.nombre, med.laboratorio,
           s.id_stock, s.lote, s.cantidad, s.fecha_vencimiento,
           s.precio_compra, s.precio_venta
    FROM medicamento med
    LEFT JOIN stock s ON med.id_medicamento = s.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (nombre && nombre.trim()) {
    sql += ' AND med.nombre LIKE ?';
    params.push(`${nombre.trim()}%`);
  }
  if (laboratorio && laboratorio.trim()) {
    sql += ' AND med.laboratorio LIKE ?';
    params.push(`${laboratorio.trim()}%`);
  }
  if (umbral) {
    sql += ' AND s.cantidad < ?';
    params.push(Number(umbral));
  }

  sql += ' ORDER BY med.nombre, s.fecha_vencimiento';

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
  const { nombre, laboratorio, umbral } = req.query;

  let sql = `
    SELECT med.id_medicamento, med.nombre, med.laboratorio,
           s.id_stock, s.lote, s.cantidad, s.fecha_vencimiento,
           s.precio_compra, s.precio_venta
    FROM medicamento med
    LEFT JOIN stock s ON med.id_medicamento = s.id_medicamento
    WHERE 1=1
  `;
  const params = [];

  if (nombre && nombre.trim()) {
    sql += ' AND med.nombre LIKE ?';
    params.push(`${nombre.trim()}%`);
  }
  if (laboratorio && laboratorio.trim()) {
    sql += ' AND med.laboratorio LIKE ?';
    params.push(`${laboratorio.trim()}%`);
  }
  if (umbral) {
    sql += ' AND s.cantidad < ?';
    params.push(Number(umbral));
  }

  sql += ' ORDER BY med.nombre, s.fecha_vencimiento';

  try {
    const [rows] = await pool.query(sql, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inventario');

    ws.columns = [
      { header: 'ID Medicamento', key: 'id_medicamento', width: 16 },
      { header: 'Medicamento', key: 'nombre', width: 26 },
      { header: 'Laboratorio', key: 'laboratorio', width: 26 },
      { header: 'ID Stock', key: 'id_stock', width: 12 },
      { header: 'Lote', key: 'lote', width: 16 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Vencimiento', key: 'fecha_vencimiento', width: 16 },
      { header: 'Precio compra', key: 'precio_compra', width: 14 },
      { header: 'Precio venta', key: 'precio_venta', width: 14 }
    ];
    ws.getRow(1).font = { bold: true };

    rows.forEach(r => ws.addRow(r));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_stock.xlsx');

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stock');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stock WHERE id_stock = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Registro de stock no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { cantidad, fecha_ingreso, id_medicamento } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO stock (cantidad, fecha_ingreso, id_medicamento) VALUES (?, ?, ?)',
      [cantidad, fecha_ingreso, id_medicamento]
    );
    res.json({ id: result.insertId, message: 'Registro de stock creado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { cantidad, fecha_ingreso, id_medicamento } = req.body;
  try {
    await pool.query(
      'UPDATE stock SET cantidad=?, fecha_ingreso=?, id_medicamento=? WHERE id_stock=?',
      [cantidad, fecha_ingreso, id_medicamento, req.params.id]
    );
    res.json({ message: 'Registro de stock actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM stock WHERE id_stock = ?', [req.params.id]);
    res.json({ message: 'Registro de stock eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
