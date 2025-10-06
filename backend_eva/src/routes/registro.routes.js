const { Router } = require('express');
const router = Router();
const ctrl = require('../controllers/registro.controller');

/**
 * @swagger
 * tags:
 *   name: Registro
 *   description: Registro de familiar/profesor, estado temporal y finalización por token
 */

/**
 * @swagger
 * /registro/participante:
 *   post:
 *     summary: Registra familiar o profesor usando codigo_acceso del estudiante; vincula y emite token
 *     tags: [Registro]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo_usuario, codigo_acceso, documento_identificacion]
 *             properties:
 *               tipo_usuario:
 *                 type: string
 *                 enum: [familiar, profesor]
 *               codigo_acceso:
 *                 type: string
 *               documento_identificacion:
 *                 type: string
 *               nombre: { type: string }
 *               email:  { type: string }
 *               parentesco: { type: string, description: Solo para familiar }
 *               materia:    { type: string, description: Solo para profesor }
 *               expira_min: { type: integer, default: 1440 }
 *     responses:
 *       201:
 *         description: Token emitido y participante vinculado
 */
router.post('/registro/participante', ctrl.registrarYEmitirToken);

/**
 * @swagger
 * /registro/estado/{token}:
 *   get:
 *     summary: Devuelve participante + estudiante + respuestas temporales + info temporal por token
 *     tags: [Registro]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Token inválido/expirado }
 */
router.get('/registro/estado/:token', ctrl.estadoPorToken);

/**
 * @swagger
 * /registro/estado/{token}/participante:
 *   post:
 *     summary: Guarda/mergea información temporal del participante (JSON) por token
 *     tags: [Registro]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 example: { "nombre": "María", "email": "maria@x.com", "parentesco": "Madre" }
 *     responses:
 *       200: { description: Guardado }
 *       404: { description: Token inválido/expirado }
 */
router.post('/registro/estado/:token/participante', ctrl.guardarParticipanteTemporal);

/**
 * @swagger
 * /registro/estado/{token}/respuestas:
 *   post:
 *     summary: Guarda respuestas temporales (una o varias) por token
 *     tags: [Registro]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [pregunta_id, respuesta]
 *                 properties:
 *                   pregunta_id: { type: integer }
 *                   respuesta:   { type: string }
 *               - type: object
 *                 required: [respuestas]
 *                 properties:
 *                   respuestas:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required: [pregunta_id, respuesta]
 *                       properties:
 *                         pregunta_id: { type: integer }
 *                         respuesta:   { type: string }
 *     responses:
 *       200: { description: Guardado }
 *       404: { description: Token inválido/expirado }
 */
router.post('/registro/estado/:token/respuestas', ctrl.guardarRespuestasTemporales);

/**
 * @swagger
 * /registro/estado/{token}/finalizar:
 *   post:
 *     summary: Persiste respuestas a 'respuestas', aplica datos temporales al participante y cierra token
 *     tags: [Registro]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Finalizado }
 *       404: { description: Token inválido/expirado }
 */
router.post('/registro/estado/:token/finalizar', ctrl.finalizar);


/**
 * @swagger
 * /registro/token:
 *   get:
 *     summary: Devuelve el token ACTIVO ligado a la cédula (documento_identificacion)
 *     tags: [Registro]
 *     parameters:
 *       - in: query
 *         name: documento_identificacion
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 tipo_usuario:
 *                   type: string
 *                   enum: [familiar, profesor]
 *                 estudiante_id: { type: integer }
 *                 expira_en: { type: string, format: date-time }
 *       404: { description: No hay token activo para esa cédula }
 */
router.get('/registro/token', ctrl.tokenPorCedula);


module.exports = router;
