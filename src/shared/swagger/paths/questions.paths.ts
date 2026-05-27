/**
 * @openapi
 * /questions:
 *   get:
 *     tags: [Questions]
 *     summary: List questions for the app in the JWT
 *     description: |
 *       Usa `appId` del access token (sin `app_id` en query). Filtro opcional `difficulty_id`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: difficulty_id
 *         required: false
 *         schema:
 *           type: string
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
 *       400:
 *         description: Validation error
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
 */

/**
 * @openapi
 * /questions/random:
 *   get:
 *     tags: [Questions]
 *     summary: Random question for the app in the JWT
 *     description: Misma app que el token; filtro opcional `difficulty_id`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: difficulty_id
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/QuestionDto'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No matching questions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

export {};
