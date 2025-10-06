require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const estudiantesRoutes = require('./src/routes/estudiantes.routes');
const routes = require('./src/routes/terapeutas.routes');
const formularios = require('./src/routes/formularios.routes');
const registro = require('./src/routes/registro.routes');
const swaggerDocs = require('./swagger');
const respuestas = require("./src/routes/respuestas.routes");

const app = express();

// Configuración CORS
const corsOptions = {
  origin: "*", // aquí defines tu frontend, ej: "http://localhost:5173"
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization' ,'idempotency-key']
};
app.use(cors(corsOptions));

app.use(morgan('dev'));
app.use(express.json());  

// Rutas
app.use('/api', registro);
app.use('/api', formularios);
app.use('/api', routes);
app.use('/api', estudiantesRoutes);
app.use('/api', respuestas);

// Swagger docs
swaggerDocs(app); // Documentación en /docs

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => 
  console.log(`API escuchando en puerto ${PORT} - Docs en http://localhost:${PORT}/docs`)
);
