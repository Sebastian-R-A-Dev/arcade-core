/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (admin)
 *     description: |
 *       Requiere JWT válido cuyo `appId` coincida con la app cuyo nombre es `ADMIN_APP` (resuelto en BD).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminUserListItemDto'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token not issued for ADMIN_APP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: ADMIN_APP row missing in database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /admin/apps:
 *   get:
 *     tags: [Admin]
 *     summary: List all apps (admin)
 *     description: |
 *       Requiere JWT válido cuyo `appId` coincida con la app `ADMIN_APP` en BD.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AppDto'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token not issued for ADMIN_APP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: ADMIN_APP row missing in database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /admin/questions:
 *   get:
 *     tags: [Admin]
 *     summary: List questions (all or filtered)
 *     description: |
 *       Token ADMIN_APP. Sin query devuelve todas las preguntas; `app_id` y/o `difficulty_id` opcionales para filtrar.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: app_id
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: difficulty_id
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionDto'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token not issued for ADMIN_APP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: ADMIN_APP row missing in database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Admin]
 *     summary: Create question for a target app
 *     description: |
 *       Token ADMIN_APP. El cuerpo incluye `app_id` de la app a la que se asocia la pregunta.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/QuestionDto'
 *       400:
 *         description: Validation or business rule error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token not issued for ADMIN_APP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Target app not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: ADMIN_APP row missing in database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * /admin/difficulties:
 *   get:
 *     tags: [Admin]
 *     summary: List difficulties for an app
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: app_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: include_inactive
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DifficultyDto'
 *   post:
 *     tags: [Admin]
 *     summary: Create difficulty for an app
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DifficultyCreateRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DifficultyDto'
 * /admin/difficulties/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update difficulty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DifficultyUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Admin]
 *     summary: Delete difficulty (only if no linked questions)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: No content
 */

export {};
