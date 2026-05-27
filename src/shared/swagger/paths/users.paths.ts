/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Current user for this app (from JWT)
 *     description: Uses Bearer access token; returns the row for `sub` scoped to token `appId`. Optional query expected_app_name must match the user's App.name.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: expected_app_name
 *         required: false
 *         schema:
 *           type: string
 *         description: If set, must equal App.name for this user (isolates apps sharing one API origin).
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Token app mismatch, or expected_app_name query does not match user's application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

export {};
