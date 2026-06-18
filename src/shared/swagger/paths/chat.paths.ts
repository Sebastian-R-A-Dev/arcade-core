/**
 * @openapi
 * /chat/private:
 *   get:
 *     tags: [Chat]
 *     summary: List private conversations for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatPrivateConversationSummaryDto'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Token is not from a chat app
 *
 * /chat/private/{peerUserId}:
 *   get:
 *     tags: [Chat]
 *     summary: Private message history with a peer (max 50)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: peerUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ChatPrivateHistoryDto'
 *
 * /chat/presence/heartbeat:
 *   post:
 *     tags: [Chat]
 *     summary: Accumulate active time for XP (REST fallback)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatHeartbeatRequest'
 *     responses:
 *       200:
 *         description: Updated progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ChatHeartbeatResponse'
 *
 * /chat/me:
 *   get:
 *     tags: [Chat]
 *     summary: Chat player profile with progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile
 */
export {};
