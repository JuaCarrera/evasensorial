// src/routes/formularios.routes.js
const { Router } = require('express');
const { verifyJwt } = require('../../middleware/auth');
const ctrl = require('../controllers/formularios.controller');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Formularios
 *   description: CRUD de formularios con secciones, módulos y preguntas
 */

/**
 * @swagger
 * /formularios:
 *   post:
 *     summary: Crea un formulario con secciones, módulos y preguntas
 *     tags: [Formularios]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre: { type: string }
 *               descripcion: { type: string }
 *               categoria: { type: string }
 *               destinatario: { type: string }
 *               estado: { type: string, example: "Activo" }
 *               version: { type: integer, example: 1 }
 *               secciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [titulo, orden]
 *                   properties:
 *                     titulo: { type: string }
 *                     orden: { type: integer }
 *                     modulos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required: [titulo, orden]
 *                         properties:
 *                           titulo: { type: string }
 *                           orden: { type: integer }
 *                           preguntas:
 *                             type: array
 *                             items:
 *                               type: object
 *                               required: [texto, tipo, orden]
 *                               properties:
 *                                 texto: { type: string }
 *                                 tipo: { type: string, example: "likert_1_5" }
 *                                 orden: { type: integer }
 *                                 opciones:
 *                                   oneOf:
 *                                     - type: array
 *                                       items: { type: integer }
 *                                     - type: array
 *                                       items: { type: string }
 *     responses:
 *       201:
 *         description: Creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 formulario_id: { type: integer }
 */
router.post('/formularios', verifyJwt, ctrl.create);

/**
 * @swagger
 * /formularios:
 *   get:
 *     summary: Lista formularios (cabecera)
 *     tags: [Formularios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/formularios', verifyJwt, ctrl.list);

/**
 * @swagger
 * /formularios/{id}:
 *   get:
 *     summary: Obtiene un formulario con secciones, módulos y preguntas
 *     tags: [Formularios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: No encontrado }
 */
router.get('/formularios/:id', ctrl.getOne);

/**
 * @swagger
 * /formularios/{id}:
 *   put:
 *     summary: Actualiza campos top-level del formulario (no estructura)
 *     tags: [Formularios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               descripcion: { type: string }
 *               categoria: { type: string }
 *               destinatario: { type: string }
 *               estado: { type: string }
 *               version: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: No encontrado }
 */
router.put('/formularios/:id', verifyJwt, ctrl.update);

/**
 * @swagger
 * /formularios/{id}:
 *   delete:
 *     summary: Elimina un formulario y toda su estructura (secciones, módulos y preguntas vinculadas)
 *     tags: [Formularios]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Eliminado }
 *       404: { description: No encontrado }
 */
router.delete('/formularios/:id', verifyJwt, ctrl.remove);

module.exports = router;
