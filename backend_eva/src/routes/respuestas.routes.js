const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/respuestas.controller');

/**
 * @swagger
 * tags:
 *   name: Respuestas
 *   description: Consulta de respuestas por estudiante
 */

/**
 * @swagger
 * /respuestas/por-codigo/{codigo_acceso}:
 *   get:
 *     summary: Lista respuestas del estudiante usando su codigo_acceso
 *     tags: [Respuestas]
 *     parameters:
 *       - in: path
 *         name: codigo_acceso
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: respondido_por
 *         schema:
 *           type: string
 *           enum: [familiar, profesor, terapeuta, estudiante]
 *       - in: query
 *         name: formulario_id
 *         schema: { type: integer }
 *       - in: query
 *         name: seccion_id
 *         schema: { type: integer }
 *       - in: query
 *         name: modulo_id
 *         schema: { type: integer }
 *       - in: query
 *         name: desde
 *         description: ISO date (YYYY-MM-DD) inclusive
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         description: ISO date (YYYY-MM-DD) inclusive
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 200 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/respuestas/por-codigo/:codigo_acceso', ctrl.listByCodigo);

/**
 * @swagger
 * /respuestas/por-estudiante/{estudiante_id}:
 *   get:
 *     summary: Lista respuestas del estudiante por ID
 *     tags: [Respuestas]
 *     parameters:
 *       - in: path
 *         name: estudiante_id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: respondido_por
 *         schema:
 *           type: string
 *           enum: [familiar, profesor, terapeuta, estudiante]
 *       - in: query
 *         name: formulario_id
 *         schema: { type: integer }
 *       - in: query
 *         name: seccion_id
 *         schema: { type: integer }
 *       - in: query
 *         name: modulo_id
 *         schema: { type: integer }
 *       - in: query
 *         name: desde
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: hasta
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, minimum: 1, maximum: 200 }
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/respuestas/por-estudiante/:estudiante_id', ctrl.listByEstudiante);
/**
 * @swagger
 * /respuestas/por-terapeuta/{terapeuta_id}:
 *   get:
 *     summary: Lista estudiantes y respuestas vinculados a un terapeuta
 *     tags: [Respuestas]
 *     parameters:
 *       - in: path
 *         name: terapeuta_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
router.get('/respuestas/por-terapeuta/:terapeuta_id', ctrl.listByTerapeuta);
module.exports = router;
