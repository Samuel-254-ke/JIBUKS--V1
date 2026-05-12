import { prisma } from '../lib/prisma.js';

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const n = parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return n;
}

/**
 * GET /admin/messaging/clients
 * Query: page, limit, search, tenantId, status (active|inactive|all)
 */
export async function getMessagingClients(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const tenantIdParam = req.query.tenantId;
    const status = req.query.status === 'inactive' ? 'inactive' : req.query.status === 'all' ? 'all' : 'active';

    const where = {
      tenantId: { not: null },
    };

    if (tenantIdParam !== undefined && tenantIdParam !== '') {
      const tid = parseInt(String(tenantIdParam), 10);
      if (!Number.isNaN(tid)) where.tenantId = tid;
    }

    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ name: 'asc' }, { email: 'asc' }],
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          tenantId: true,
          isActive: true,
          role: true,
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
    ]);

    const data = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      tenantId: u.tenantId,
      tenantName: u.tenant?.name ?? null,
      tenantSlug: u.tenant?.slug ?? null,
      isActive: u.isActive,
      role: u.role,
    }));

    res.json({
      data,
      meta: { page, limit, total },
    });
  } catch (err) {
    next(err);
  }
}

async function unreadCountForAdmin(conversation) {
  const base = {
    conversationId: conversation.id,
    senderRole: 'CLIENT',
  };
  if (conversation.adminLastReadAt) {
    return prisma.adminMessagingMessage.count({
      where: {
        ...base,
        createdAt: { gt: conversation.adminLastReadAt },
      },
    });
  }
  return prisma.adminMessagingMessage.count({ where: base });
}

/**
 * GET /admin/messaging/conversations
 */
export async function getConversations(req, res, next) {
  try {
    const conversations = await prisma.adminMessagingConversation.findMany({
      include: {
        clientUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            tenantId: true,
            isActive: true,
            tenant: { select: { id: true, name: true, slug: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const data = await Promise.all(
      conversations.map(async (c) => {
        const last = c.messages[0];
        const unreadCount = await unreadCountForAdmin(c);
        return {
          id: c.id,
          clientId: c.clientUser.id,
          clientName: c.clientUser.name,
          clientEmail: c.clientUser.email,
          avatarUrl: c.clientUser.avatarUrl,
          tenantId: c.clientUser.tenantId,
          tenantName: c.clientUser.tenant?.name ?? null,
          tenantSlug: c.clientUser.tenant?.slug ?? null,
          clientIsActive: c.clientUser.isActive,
          lastMessage: last
            ? {
                id: last.id,
                body: last.body,
                senderRole: last.senderRole,
                createdAt: last.createdAt.toISOString(),
              }
            : null,
          lastMessageAt: last ? last.createdAt.toISOString() : c.createdAt.toISOString(),
          unreadCount,
        };
      })
    );

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/messaging/conversations
 * Body: { clientId: number }
 */
export async function createOrOpenConversation(req, res, next) {
  try {
    const clientId = parseInt(String(req.body?.clientId), 10);
    if (Number.isNaN(clientId)) {
      return res.status(400).json({ error: 'clientId is required and must be a number' });
    }

    const user = await prisma.user.findUnique({
      where: { id: clientId },
      select: { id: true, tenantId: true, name: true, email: true, avatarUrl: true },
    });

    if (!user || user.tenantId == null) {
      return res.status(404).json({ error: 'Client user not found or has no tenant' });
    }

    const existing = await prisma.adminMessagingConversation.findUnique({
      where: { clientUserId: clientId },
    });

    const now = new Date();
    const conversation = existing
      ? existing
      : await prisma.adminMessagingConversation.create({
          data: {
            clientUserId: clientId,
            adminLastReadAt: now,
          },
        });

    res.status(existing ? 200 : 201).json({
      id: conversation.id,
      clientId: user.id,
      clientName: user.name,
      clientEmail: user.email,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/messaging/conversations/:conversationId/messages
 * Query: limit, beforeId (load older messages than this id)
 */
export async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const beforeId = req.query.beforeId != null && req.query.beforeId !== ''
      ? parseInt(String(req.query.beforeId), 10)
      : null;

    const conv = await prisma.adminMessagingConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const where = { conversationId };
    if (beforeId != null && !Number.isNaN(beforeId)) {
      where.id = { lt: beforeId };
    }

    const batch = await prisma.adminMessagingMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = batch.length > limit;
    const slice = hasMore ? batch.slice(0, limit) : batch;
    slice.reverse();

    const data = slice.map((m) => ({
      id: m.id,
      senderRole: m.senderRole,
      body: m.body,
      attachments: m.attachments,
      adminId: m.adminId,
      createdAt: m.createdAt.toISOString(),
    }));

    const nextBeforeId = slice.length > 0 ? slice[0].id : null;

    res.json({
      data,
      meta: {
        hasMore,
        nextBeforeId: hasMore ? nextBeforeId : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/messaging/conversations/:conversationId/messages
 * Body: { body: string, attachments?: unknown }
 */
export async function sendAdminMessage(req, res, next) {
  try {
    const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const { conversationId } = req.params;
    const text = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    const attachments = req.body?.attachments ?? null;

    if (!text && (attachments == null || (Array.isArray(attachments) && attachments.length === 0))) {
      return res.status(400).json({ error: 'body or attachments is required' });
    }

    const conv = await prisma.adminMessagingConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = await prisma.adminMessagingMessage.create({
      data: {
        conversationId,
        senderRole: 'ADMIN',
        adminId,
        body: text || '(attachment)',
        attachments: attachments === undefined ? undefined : attachments,
      },
    });

    res.status(201).json({
      id: message.id,
      senderRole: message.senderRole,
      body: message.body,
      attachments: message.attachments,
      adminId: message.adminId,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/messaging/conversations/:conversationId/read
 */
export async function markConversationRead(req, res, next) {
  try {
    const { conversationId } = req.params;

    const conv = await prisma.adminMessagingConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await prisma.adminMessagingConversation.update({
      where: { id: conversationId },
      data: { adminLastReadAt: new Date() },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
