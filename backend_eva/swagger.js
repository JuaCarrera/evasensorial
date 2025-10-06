const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Eva Sensorial',
      version: '1.0.0',
      description: 'Backend completo evasensorial'
    },
    servers: [
      { url: 'http://localhost:3000/api' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js'] // Escanea anotaciones en rutas
};

const swaggerSpec = swaggerJSDoc(options);

function swaggerDocs(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swaggerDocs;
