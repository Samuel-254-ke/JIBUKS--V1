import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get comprehensive dashboard data
router.get('/', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Get current month transactions
        const [currentMonthIncome, currentMonthExpenses, lastMonthIncome, lastMonthExpenses] = await Promise.all([
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'INCOME',
                    date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'EXPENSE',
                    date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'INCOME',
                    date: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'EXPENSE',
                    date: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
                },
                _sum: { amount: true }
            })
        ]);

        const totalIncome = Number(currentMonthIncome._sum.amount || 0);
        const totalExpenses = Number(currentMonthExpenses._sum.amount || 0);
        const balance = totalIncome - totalExpenses;

        // Get recent transactions
        const recentTransactions = await prisma.transaction.findMany({
            where: { tenantId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 10
        });

        // Get active goals
        const goals = await prisma.goal.findMany({
            where: {
                tenantId,
                status: 'ACTIVE'
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // Get budgets
        const budgets = await prisma.budget.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate spending by category for current month
        const categorySpending = await prisma.transaction.groupBy({
            by: ['category'],
            where: {
                tenantId,
                type: 'EXPENSE',
                date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
            },
            _sum: { amount: true },
            _count: { id: true }
        });

        // Get family members
        const familyMembers = await prisma.user.findMany({
            where: {
                tenantId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true
            }
        });

        // Calculate trends
        const lastMonthIncomeTotal = Number(lastMonthIncome._sum.amount || 0);
        const lastMonthExpensesTotal = Number(lastMonthExpenses._sum.amount || 0);

        const incomeChange = lastMonthIncomeTotal > 0
            ? ((totalIncome - lastMonthIncomeTotal) / lastMonthIncomeTotal) * 100
            : 0;

        const expenseChange = lastMonthExpensesTotal > 0
            ? ((totalExpenses - lastMonthExpensesTotal) / lastMonthExpensesTotal) * 100
            : 0;

        res.json({
            summary: {
                totalIncome,
                totalExpenses,
                balance,
                savingsRate: totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0
            },
            trends: {
                incomeChange: incomeChange.toFixed(1),
                expenseChange: expenseChange.toFixed(1)
            },
            recentTransactions: recentTransactions.map(t => ({
                ...t,
                amount: Number(t.amount)
            })),
            goals: goals.map(g => ({
                ...g,
                targetAmount: Number(g.targetAmount),
                currentAmount: Number(g.currentAmount),
                monthlyContribution: g.monthlyContribution ? Number(g.monthlyContribution) : null,
                progress: Number(g.targetAmount) > 0
                    ? ((Number(g.currentAmount) / Number(g.targetAmount)) * 100).toFixed(1)
                    : 0
            })),
            budgets: budgets.map(b => ({
                ...b,
                amount: Number(b.amount)
            })),
            categorySpending: categorySpending.map(c => ({
                category: c.category,
                amount: Number(c._sum.amount || 0),
                count: c._count.id
            })),
            familyMembers
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Fetch Data
        const [
            // ALL TIME Income
            allTimeIncome,
            // ALL TIME Expenses
            allTimeExpenses,
            // Current Month Income (for trends)
            currentMonthIncome,
            // Current Month Expenses (for trends)
            currentMonthExpenses,
            // Last Month Income (for comparison)
            lastMonthIncome,
            // Last Month Expenses (for comparison)
            lastMonthExpenses,
            // Spending by Category (Current Month - strictly for monthly analysis)
            categorySpending
        ] = await Promise.all([
            // 1. All Time Income
            prisma.transaction.aggregate({
                where: { tenantId, type: 'INCOME' },
                _sum: { amount: true }
            }),
            // 2. All Time Expenses
            prisma.transaction.aggregate({
                where: { tenantId, type: 'EXPENSE' },
                _sum: { amount: true }
            }),
            // 3. Current Month Income
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'INCOME',
                    date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
                },
                _sum: { amount: true }
            }),
            // 4. Current Month Expenses
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'EXPENSE',
                    date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
                },
                _sum: { amount: true }
            }),
            // 5. Last Month Income
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'INCOME',
                    date: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
                },
                _sum: { amount: true }
            }),
            // 6. Last Month Expenses
            prisma.transaction.aggregate({
                where: {
                    tenantId,
                    type: 'EXPENSE',
                    date: { gte: firstDayOfLastMonth, lte: lastDayOfLastMonth }
                },
                _sum: { amount: true }
            }),
            // 7. Spending by Category (This Month)
            prisma.transaction.groupBy({
                by: ['category'],
                where: {
                    tenantId,
                    type: 'EXPENSE',
                    date: { gte: firstDayOfMonth, lte: lastDayOfMonth }
                },
                _sum: { amount: true }
            })
        ]);

        // Process Totals (ALL TIME)
        const totalIncome = Number(allTimeIncome._sum.amount || 0);
        const totalExpenses = Number(allTimeExpenses._sum.amount || 0);
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

        // Process Category Spending (Current Month)
        const currentMonthExpTotal = Number(currentMonthExpenses._sum.amount || 0);
        const colorPalette = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

        const spendingByCategory = categorySpending
            .map((cat, index) => ({
                category: cat.category,
                amount: Number(cat._sum.amount),
                percentage: currentMonthExpTotal > 0
                    ? Math.round((Number(cat._sum.amount) / currentMonthExpTotal) * 100)
                    : 0,
                color: colorPalette[index % colorPalette.length]
            }))
            .sort((a, b) => b.amount - a.amount);

        // Response Object
        const responseData = {
            summary: {
                totalIncome,      // All Time
                totalExpenses,    // All Time
                netSavings,       // All Time
                savingsRate       // All Time
            },
            monthlyComparison: {
                thisMonth: {
                    income: Number(currentMonthIncome._sum.amount || 0),
                    expenses: Number(currentMonthExpenses._sum.amount || 0)
                },
                lastMonth: {
                    income: Number(lastMonthIncome._sum.amount || 0),
                    expenses: Number(lastMonthExpenses._sum.amount || 0)
                }
            },
            spendingByCategory
        };

        res.json(responseData);
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

export default router;
