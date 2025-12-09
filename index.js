const express = require('express');
const cors = require('cors');
const pool = require('./db');


const app = express();
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('ClinData funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

const citaRoutes = require('./routes/cita');
app.use('/citas', citaRoutes);

const antecedenteRoutes = require('./routes/antecedente');
app.use('/antecedentes', antecedenteRoutes);

const agendaRoutes = require('./routes/agenda');
app.use('/agendas', agendaRoutes);

const consultorioRoutes = require('./routes/consultorio');
app.use('/consultorios', consultorioRoutes);

const diagnosticoRoutes = require('./routes/diagnostico');
app.use('/diagnosticos', diagnosticoRoutes);

const especialidadRoutes = require('./routes/especialidad');
app.use('/especialidades', especialidadRoutes);

const medicamentoTratamientoRoutes = require('./routes/medicamento_tratamiento');
app.use('/medicamento-tratamientos', medicamentoTratamientoRoutes);

const medicamentoRoutes = require('./routes/medicamento');
app.use('/medicamentos', medicamentoRoutes);

const historiaClinicaRoutes = require('./routes/historia_clinica');
app.use('/historias-clinicas', historiaClinicaRoutes);

const medicoRoutes = require('./routes/medico');
app.use('/medicos', medicoRoutes);

const medicoEspecialidadRoutes = require('./routes/medico_especialidad');
app.use('/medico-especialidades', medicoEspecialidadRoutes);

const pacienteRoutes = require('./routes/paciente');
app.use('/pacientes', pacienteRoutes);

const recordatorioRoutes = require('./routes/recordatorio');
app.use('/recordatorios', recordatorioRoutes);

const recetaMedicamentoRoutes = require('./routes/receta_medicamento');
app.use('/receta-medicamentos', recetaMedicamentoRoutes);

const recetaRoutes = require('./routes/receta');
app.use('/recetas', recetaRoutes);

const seguroRoutes = require('./routes/seguro');
app.use('/seguros', seguroRoutes);

const stockRoutes = require('./routes/stock');
app.use('/stocks', stockRoutes);

const tratamientoRoutes = require('./routes/tratamiento');
app.use('/tratamientos', tratamientoRoutes);

const turnoRoutes = require('./routes/turno');
app.use('/turnos', turnoRoutes);

