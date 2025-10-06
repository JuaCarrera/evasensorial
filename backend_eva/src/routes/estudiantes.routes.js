// src/routes/estudiantes.routes.js
const { Router } = require('express');
const { verifyJwt } = require('../../middleware/auth');
const ctrl = require('../controllers/estudiantes.controller');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Estudiantes
 *   description: CRUD de estudiantes, vinculación por código y reenvío/regeneración de código
 *
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message: { type: string, example: "Detalle del error" }
 *
 *     Estudiante:
 *       type: object
 *       properties:
 *         estudiante_id: { type: integer, example: 101 }
 *         nombre:        { type: string,  example: "Juan" }
 *         apellidos:     { type: string,  nullable: true, example: "García López" }
 *         email:         { type: string,  nullable: true, example: "juan@correo.com" }
 *         codigo_acceso: { type: string,  example: "AB3D7K2Q" }
 *         terapeuta_id:  { type: integer, example: 1 }
 *         documento_identificacion: { type: string, nullable: true, example: "1090123456" }
 *         fecha_nacimiento: { type: string, format: date, nullable: true, example: "2012-05-10" }
 *         edad:          { type: integer, nullable: true, example: 12 }
 *         grado:         { type: string,  nullable: true, example: "7°" }
 *         colegio:       { type: string,  nullable: true, example: "Colegio San Ignacio" }
 *
 *     EstudianteCreate:
 *       type: object
 *       required: [nombre, terapeuta_id]
 *       properties:
 *         nombre: { type: string, example: "Juan" }
 *         apellidos: { type: string, example: "García López" }
 *         email: { type: string, example: "juan@correo.com" }
 *         terapeuta_id: { type: integer, example: 1 }
 *         documento_identificacion: { type: string, example: "1090123456" }
 *         fecha_nacimiento: { type: string, format: date, example: "2012-05-10" }
 *         edad: { type: integer, example: 12 }
 *         grado: { type: string, example: "7°" }
 *         colegio: { type: string, example: "Colegio San Ignacio" }
 *         familiares:
 *           type: array
 *           description: Lista de correos de acudientes a notificar (no se guardan aquí)
 *           items: { type: string, example: "acudiente@example.com" }
 *         profesores:
 *           type: array
 *           description: Lista de correos de profesores a notificar (no se guardan aquí)
 *           items: { type: string, example: "profe@colegio.edu" }
 *
 *     EstudianteUpdate:
 *       type: object
 *       properties:
 *         nombre: { type: string }
 *         apellidos: { type: string }
 *         email: { type: string }
 *         terapeuta_id: { type: integer }
 *         documento_identificacion: { type: string }
 *         fecha_nacimiento: { type: string, format: date }
 *         edad: { type: integer }
 *         grado: { type: string }
 *         colegio: { type: string }
 *
 *     VinculoFamiliarInput:
 *       type: object
 *       required: [email, codigo_acceso]
 *       properties:
 *         email: { type: string, example: "acudiente@example.com" }
 *         nombre: { type: string, example: "Ana Gómez" }
 *         parentesco: { type: string, example: "Madre" }
 *         codigo_acceso: { type: string, example: "AB3D7K2Q" }
 *
 *     VinculoProfesorInput:
 *       type: object
 *       required: [email, codigo_acceso]
 *       properties:
 *         email: { type: string, example: "profe.mate@colegio.edu" }
 *         nombre: { type: string, example: "Carlos Ruiz" }
 *         materia: { type: string, example: "Matemáticas" }
 *         codigo_acceso: { type: string, example: "AB3D7K2Q" }
 *
 *     ReenviarCodigoInput:
 *       type: object
 *       required: [destinatarios]
 *       properties:
 *         destinatarios:
 *           type: array
 *           items: { type: string, example: "acudiente@example.com" }
 *         regenerate:
 *           type: boolean
 *           description: Si es true, genera un nuevo codigo_acceso antes de enviarlo.
 *           example: false
 */

/**
 * @swagger
 * /estudiantes:
 *   post:
 *     summary: Crea estudiante y genera codigo_acceso (no guarda ni vincula correos)
 *     tags: [Estudiantes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/EstudianteCreate' }
 *     responses:
 *       201:
 *         description: Estudiante creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estudiante_id: { type: integer, example: 101 }
 *                 codigo_acceso: { type: string, example: "AB3D7K2Q" }
 */
router.post('/estudiantes', verifyJwt, ctrl.create);

/**
 * @swagger
 * /estudiantes:
 *   get:
 *     summary: Lista todos los estudiantes
 *     tags: [Estudiantes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Estudiante' }
 */
router.get('/estudiantes', verifyJwt, ctrl.findAll);

/**
 * @swagger
 * /estudiantes/{id}:
 *   get:
 *     summary: Obtiene un estudiante por ID
 *     tags: [Estudiantes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Estudiante' }
 *       404: { description: No encontrado }
 */
router.get('/estudiantes/:id', verifyJwt, ctrl.findOne);

/**
 * @swagger
 * /estudiantes/{id}:
 *   put:
 *     summary: Actualiza parcialmente un estudiante
 *     tags: [Estudiantes]
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
 *           schema: { $ref: '#/components/schemas/EstudianteUpdate' }
 *     responses:
 *       200:
 *         description: Actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Estudiante' }
 *       404: { description: No encontrado }
 */
router.put('/estudiantes/:id', verifyJwt, ctrl.update);

/**
 * @swagger
 * /estudiantes/{id}:
 *   delete:
 *     summary: Elimina un estudiante y sus vínculos
 *     tags: [Estudiantes]
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
router.delete('/estudiantes/:id', verifyJwt, ctrl.remove);

/**
 * @swagger
 * /estudiantes/link/familiar:
 *   post:
 *     summary: Vincula un familiar a un estudiante usando el codigo_acceso (no requiere JWT)
 *     tags: [Estudiantes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VinculoFamiliarInput' }
 *     responses:
 *       200: { description: Vinculado }
 *       404: { description: Código inválido }
 */
router.post('/estudiantes/link/familiar', ctrl.linkFamiliarByCode);

/**
 * @swagger
 * /estudiantes/link/profesor:
 *   post:
 *     summary: Vincula un profesor a un estudiante usando el codigo_acceso (no requiere JWT)
 *     tags: [Estudiantes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VinculoProfesorInput' }
 *     responses:
 *       200: { description: Vinculado }
 *       404: { description: Código inválido }
 */
router.post('/estudiantes/link/profesor', ctrl.linkProfesorByCode);

/**
 * @swagger
 * /estudiantes/{id}/reenviar-codigo:
 *   post:
 *     summary: Reenvía (y opcionalmente regenera) el codigo_acceso del estudiante a una lista de emails
 *     tags: [Estudiantes]
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
 *           schema: { $ref: '#/components/schemas/ReenviarCodigoInput' }
 *           example:
 *             destinatarios: ["madre@example.com","profe@colegio.edu"]
 *             regenerate: false
 *     responses:
 *       200:
 *         description: Resultado de envío
 *       404:
 *         description: Estudiante no encontrado
 */
router.post('/estudiantes/:id/reenviar-codigo', verifyJwt, ctrl.resendCode);
/**
 * @swagger
 * /estudiantes/{id}/asignar-terapeuta:
 *   post:
 *     summary: Asigna un terapeuta a un estudiante
 *     tags: [Estudiantes]
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
 *             required: [terapeuta_id]
 *             properties:
 *               terapeuta_id: { type: integer }
 *     responses:
 *       200: { description: Asignado }
 *       404: { description: Estudiante no encontrado }
 */
router.post('/estudiantes/:id/asignar-terapeuta', verifyJwt, ctrl.assignTherapist);
/**
 * @swagger
 * /estudiantes/por-terapeuta/{terapeuta_id}:
 *   get:
 *     summary: Lista todos los estudiantes asignados a un terapeuta
 *     tags: [Estudiantes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: terapeuta_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Estudiante' }
 */
router.get('/estudiantes/por-terapeuta/:terapeuta_id', verifyJwt, ctrl.findByTherapist);

module.exports = router;
