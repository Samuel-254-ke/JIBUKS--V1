import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get all budgets for the user's family
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const budgets = await prisma.budget.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        // Get current month's spending for each budget category
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const budgetsWithSpending = await Promise.all(
            budgets.map(async (budget) => {
                const spending = await prisma.transaction.aggregate({
                    where: {
                        tenantId,
                        type: 'EXPENSE',
                        category: budget.category,
                        date: {
                            gte: firstDayOfMonth,
                            lte: lastDayOfMonth
                        }
                    },
                    _sum: {
                        amount: true
                    }
                });

                const spent = Number(spending._sum.amount || 0);
                const allocated = Number(budget.amount);
                const remaining = allocated - spent;
                const progress = allocated > 0 ? (spent / allocated) * 100 : 0;
                const isOverBudget = spent > allocated;

                return {
                    ...budget,
                    amount: allocated,
                    spent,
                    remaining,
                    progress: progress.toFixed(1),
                    isOverBudget,
                    status: isOverBudget ? 'OVER_BUDGET' : remaining < allocated * 0.2 ? 'WARNING' : 'GOOD'
                };
            })
        );

        res.json(budgetsWithSpending);
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// Get a single budget by ID
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const budget = await prisma.budget.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        // Get current month's spending
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const spending = await prisma.transaction.aggregate({
            where: {
                tenantId,
                type: 'EXPENSE',
                category: budget.category,
                date: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                }
            },
            _sum: {
                amount: true
            }
        });

        // Get recent transactions for this category
        const recentTransactions = await prisma.transaction.findMany({
            where: {
                tenantId,
                type: 'EXPENSE',
                category: budget.category,
                date: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            },
            take: 10
        });

        const spent = Number(spending._sum.amount || 0);
        const allocated = Number(budget.amount);
        const remaining = allocated - spent;
        const progress = allocated > 0 ? (spent / allocated) * 100 : 0;
        const isOverBudget = spent > allocated;

        res.json({
            ...budget,
            amount: allocated,
            spent,
            remaining,
            progress: progress.toFixed(1),
            isOverBudget,
            status: isOverBudget ? 'OVER_BUDGET' : remaining < allocated * 0.2 ? 'WARNING' : 'GOOD',
            recentTransactions: recentTransactions.map(t => ({
                ...t,
                amount: Number(t.amount)
            }))
        });
    } catch (error) {
        console.error('Error fetching budget:', error);
        res.status(500).json({ error: 'Failed to fetch budget' });
    }
});

// Create a new budget
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { category, amount, period = 'monthly' } = req.body;

        if (!category || !amount) {
            return res.status(400).json({ error: 'Category and amount are required' });
        }

        // Check if budget already exists for this category
        const existing = await prisma.budget.findFirst({
            where: {
                tenantId,
                category
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Budget already exists for this category' });
        }

        const budget = await prisma.budget.create({
            data: {
                tenantId,
                category,
                amount,
                period
            }
        });

        res.status(201).json({
            ...budget,
            amount: Number(budget.amount),
            spent: 0,
            remaining: Number(budget.amount),
            progress: '0.0',
            isOverBudget: false,
            status: 'GOOD'
        });
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});

// Update a budget
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.budget.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        const { category, amount, period } = req.body;

        const budget = await prisma.budget.update({
            where: { id: parseInt(id) },
            data: {
                ...(category && { category }),
                ...(amount !== undefined && { amount }),
                ...(period && { period })
            }
        });

        // Get current spending
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const spending = await prisma.transaction.aggregate({
            where: {
                tenantId,
                type: 'EXPENSE',
                category: budget.category,
                date: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth
                }
            },
            _sum: {
                amount: true
            }
        });

        const spent = Number(spending._sum.amount || 0);
        const allocated = Number(budget.amount);
        const remaining = allocated - spent;
        const progress = allocated > 0 ? (spent / allocated) * 100 : 0;
        const isOverBudget = spent > allocated;

        res.json({
            ...budget,
            amount: allocated,
            spent,
            remaining,
            progress: progress.toFixed(1),
            isOverBudget,
            status: isOverBudget ? 'OVER_BUDGET' : remaining < allocated * 0.2 ? 'WARNING' : 'GOOD'
        });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ error: 'Failed to update budget' });
    }
});

// Delete a budget
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.budget.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        await prisma.budget.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

export default router;
