import { prisma } from '../lib/prisma.js';

/**
 * Get all tenants with extensive aggregate data
 */
export async function getAllTenants(req, res, next) {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        transactions: true,
                        invoices: true,
                        expenses: true,
                        accounts: true,
                        categories: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Enrich with financial totals (manual aggregation because Prisma doesn't support sum in include)
        const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
            const transactionStats = await prisma.transaction.aggregate({
                where: { tenantId: tenant.id },
                _sum: { amount: true },
                _max: { date: true }
            });

            const invoiceStats = await prisma.invoice.aggregate({
                where: { tenantId: tenant.id },
                _sum: { total: true }
            });

            const expenseStats = await prisma.expense.aggregate({
                where: { tenantId: tenant.id },
                _sum: { totalAmount: true }
            });

            return {
                ...tenant,
                stats: {
                    userCount: tenant._count.users,
                    transactionCount: tenant._count.transactions,
                    invoiceCount: tenant._count.invoices,
                    expenseCount: tenant._count.expenses,
                    accountCount: tenant._count.accounts,
                    totalTransactionVolume: transactionStats._sum.amount || 0,
                    totalInvoiceVolume: invoiceStats._sum.total || 0,
                    totalExpenseVolume: expenseStats._sum.totalAmount || 0,
                    lastActivity: transactionStats._max.date || tenant.createdAt
                }
            };
        }));

        res.json(enrichedTenants);
    } catch (err) {
        next(err);
    }
}

/**
 * Get detailed data for a specific tenant
 */
export async function getTenantById(req, res, next) {
    try {
        const { id } = req.params;
        const tenantId = parseInt(id);

        if (isNaN(tenantId)) {
            return res.status(400).json({ error: 'Invalid tenant ID' });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true
                    }
                },
                _count: true
            }
        });

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Aggregate some deeper stats
        const [transStats, invStats, expStats] = await Promise.all([
            prisma.transaction.aggregate({
                where: { tenantId },
                _sum: { amount: true },
                _count: true,
                _max: { date: true }
            }),
            prisma.invoice.aggregate({
                where: { tenantId },
                _sum: { total: true },
                _count: true
            }),
            prisma.expense.aggregate({
                where: { tenantId },
                _sum: { totalAmount: true },
                _count: true
            })
        ]);

        res.json({
            ...tenant,
            extendedStats: {
                transactions: {
                    count: transStats._count,
                    totalVolume: transStats._sum.amount || 0,
                    lastActivity: transStats._max.date
                },
                invoices: {
                    count: invStats._count,
                    totalVolume: invStats._sum.total || 0
                },
                expenses: {
                    count: expStats._count,
                    totalVolume: expStats._sum.totalAmount || 0
                }
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update tenant configuration
 */
export async function updateTenant(req, res, next) {
    try {
        const { id } = req.params;
        const { name, slug, tenantType, ownerEmail, metadata } = req.body;
        const tenantId = parseInt(id);

        if (isNaN(tenantId)) {
            return res.status(400).json({ error: 'Invalid tenant ID' });
        }

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name,
                slug,
                tenantType,
                ownerEmail,
                metadata
            }
        });

        res.json({ message: 'Tenant updated successfully', tenant: updated });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a tenant and all associated data
 */
export async function deleteTenant(req, res, next) {
    try {
        const { id } = req.params;
        const tenantId = parseInt(id);

        if (isNaN(tenantId)) {
            return res.status(400).json({ error: 'Invalid tenant ID' });
        }

        // Hard delete with Prisma cascading (if configured in schema)
        await prisma.tenant.delete({
            where: { id: tenantId }
        });

        res.json({ message: 'Tenant and all associated data deleted successfully' });
    } catch (err) {
        next(err);
    }
}

/**
 * Get platform-wide overview statistics
 */
export async function getPlatformStats(req, res, next) {
    try {
        const [tenantCount, userCount, transStats, invStats] = await Promise.all([
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.transaction.aggregate({
                _sum: { amount: true },
                _count: true
            }),
            prisma.invoice.aggregate({
                _sum: { total: true },
                _count: true
            })
        ]);

        // Break down by type
        const tenantsByType = await prisma.tenant.groupBy({
            by: ['tenantType'],
            _count: true
        });

        res.json({
            summary: {
                totalTenants: tenantCount,
                totalUsers: userCount,
                totalTransactions: transStats._count,
                totalTransactionVolume: transStats._sum.amount || 0,
                totalInvoiceVolume: invStats._sum.total || 0
            },
            breakdown: {
                tenantsByType
            },
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        next(err);
    }
}
