import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get all transactions for the user's family
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { type, startDate, endDate, category, limit = 50 } = req.query;

        const where = {
            tenantId,
            ...(type && { type }),
            ...(category && { category }),
            ...(startDate || endDate ? {
                date: {
                    ...(startDate && { gte: new Date(startDate) }),
                    ...(endDate && { lte: new Date(endDate) })
                }
            } : {})
        };

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            },
            take: parseInt(limit)
        });

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get transaction statistics
router.get('/stats', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { startDate, endDate } = req.query;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const dateFilter = {
            date: {
                gte: startDate ? new Date(startDate) : firstDayOfMonth,
                lte: endDate ? new Date(endDate) : lastDayOfMonth
            }
        };

        // Get income and expense totals
        const [income, expenses] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'INCOME',
                    ...dateFilter
                },
                _sum: {
                    amount: true
                }
            }),
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'EXPENSE',
                    ...dateFilter
                },
                _sum: {
                    amount: true
                }
            })
        ]);

        // Get category breakdown
        const categoryBreakdown = await prisma.transaction.groupBy({
            by: ['category', 'type'],
            where: {
                tenantId,
                ...dateFilter
            },
            _sum: {
                amount: true
            },
            _count: {
                id: true
            }
        });

        const totalIncome = income._sum.amount || 0;
        const totalExpenses = expenses._sum.amount || 0;
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        res.json({
            totalIncome,
            totalExpenses,
            netSavings,
            savingsRate: Math.round(savingsRate * 100) / 100,
            categoryBreakdown
        });
    } catch (error) {
        console.error('Error fetching transaction stats:', error);
        res.status(500).json({ error: 'Failed to fetch transaction statistics' });
    }
});

// Create a new transaction
router.post('/', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const {
            type,
            amount,
            category,
            description,
            date,
            paymentMethod,
            notes
        } = req.body;

        if (!type || !amount || !category) {
            return res.status(400).json({ error: 'Type, amount, and category are required' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                tenantId,
                userId,
                type,
                amount,
                category,
                description,
                date: date ? new Date(date) : new Date(),
                paymentMethod,
                notes
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// Update a transaction
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Verify transaction belongs to user's family
        const existing = await prisma.transaction.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const {
            type,
            amount,
            category,
            description,
            date,
            paymentMethod,
            notes
        } = req.body;

        const transaction = await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: {
                ...(type && { type }),
                ...(amount !== undefined && { amount }),
                ...(category && { category }),
                ...(description !== undefined && { description }),
                ...(date && { date: new Date(date) }),
                ...(paymentMethod !== undefined && { paymentMethod }),
                ...(notes !== undefined && { notes })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Verify transaction belongs to user's family
        const existing = await prisma.transaction.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await prisma.transaction.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

export default router;
