const { Router } = require('express');
const ctrl = require('../controllers/terapeutas.controller');
const { verifyJwt } = require('../../middleware/auth');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Login y manejo de tokens
 */

/**
 * @swagger
 * tags:
 *   name: Terapeutas
 *   description: CRUD de terapeutas
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               contraseña:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post('/auth/login', ctrl.login);

/**
 * @swagger
 * /terapeutas:
 *   get:
 *     summary: Lista todos los terapeutas
 *     tags: [Terapeutas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de terapeutas
 */
router.get('/terapeutas', verifyJwt, ctrl.findAll);

/**
 * @swagger
 * /terapeutas/{id}:
 *   get:
 *     summary: Obtiene un terapeuta por ID
 *     tags: [Terapeutas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Terapeuta encontrado
 */
router.get('/terapeutas/:id', verifyJwt, ctrl.findOne);

/**
 * @swagger
 * /terapeutas:
 *   post:
 *     summary: Crea un nuevo terapeuta
 *     tags: [Terapeutas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               contraseña:
 *                 type: string
 *               es_superadmin:
 *                 type: boolean
 *               Cargo:
 *                 type: string
 *               identificacion:
 *                 type: string
 *               especialidad:
 *                 type: string
 *               telefono:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               estado:
 *                 type: string
 *     responses:
 *       201:
 *         description: Terapeuta creado
 */
router.post('/terapeutas', verifyJwt, ctrl.create);

/**
 * @swagger
 * /terapeutas/{id}:
 *   put:
 *     summary: Actualiza un terapeuta por ID
 *     tags: [Terapeutas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               contraseña:
 *                 type: string
 *               es_superadmin:
 *                 type: boolean
 *               Cargo:
 *                 type: string
 *               identificacion:
 *                 type: string
 *               especialidad:
 *                 type: string
 *               telefono:
 *                 type: string
 *               ubicacion:
 *                 type: string
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Terapeuta actualizado
 */
router.put('/terapeutas/:id', verifyJwt, ctrl.update);

/**
 * @swagger
 * /terapeutas/{id}:
 *   delete:
 *     summary: Elimina un terapeuta por ID
 *     tags: [Terapeutas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Terapeuta eliminado
 */
router.delete('/terapeutas/:id', verifyJwt, ctrl.remove);


module.exports = router;
