import { Router } from 'express';
import {
  getMessagingClients,
  getConversations,
  createOrOpenConversation,
  getMessages,
  sendAdminMessage,
  markConversationRead,
} from '../controllers/adminMessagingController.js';

const router = Router();

/**
 * Admin messaging (super admin inbox) — mounted under /api/admin/messaging with verifyAdminJWT.
 *
 * JSON shapes:
 *
 * GET /clients?page=1&limit=30&search=&tenantId=&status=active|inactive|all
 * → { data: ClientRow[], meta: { page, limit, total } }
 * ClientRow: { id, name, email, avatarUrl, tenantId, tenantName, tenantSlug, isActive, role }
 *
 * GET /conversations
 * → { data: ConversationRow[] }
 * ConversationRow: { id, clientId, clientName, clientEmail, avatarUrl, tenantId, tenantName,
 *   tenantSlug, clientIsActive, lastMessage, lastMessageAt, unreadCount }
 *
 * POST /conversations  { clientId }
 * → { id, clientId, clientName, clientEmail, avatarUrl, tenantId }
 *
 * GET /conversations/:conversationId/messages?limit=30&beforeId=
 * → { data: MessageRow[], meta: { hasMore, nextBeforeId } }
 *
 * POST /conversations/:conversationId/messages  { body, attachments? }
 * → MessageRow
 *
 * POST /conversations/:conversationId/read
 * → { success: true }
 */

router.get('/clients', getMessagingClients);
router.get('/conversations', getConversations);
router.post('/conversations', createOrOpenConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendAdminMessage);
router.post('/conversations/:conversationId/read', markConversationRead);

export default router;
