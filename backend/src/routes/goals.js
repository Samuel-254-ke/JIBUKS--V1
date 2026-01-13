import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get all goals for the user's family
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const goals = await prisma.goal.findMany({
            where: { tenantId },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate progress for each goal
        const goalsWithProgress = goals.map(goal => ({
            ...goal,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
            progress: Number(goal.targetAmount) > 0
                ? ((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100).toFixed(1)
                : 0,
            remaining: Number(goal.targetAmount) - Number(goal.currentAmount)
        }));

        res.json(goalsWithProgress);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Get a single goal by ID
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const goal = await prisma.goal.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const goalWithProgress = {
            ...goal,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
            progress: Number(goal.targetAmount) > 0
                ? ((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100).toFixed(1)
                : 0,
            remaining: Number(goal.targetAmount) - Number(goal.currentAmount)
        };

        res.json(goalWithProgress);
    } catch (error) {
        console.error('Error fetching goal:', error);
        res.status(500).json({ error: 'Failed to fetch goal' });
    }
});

// Create a new goal
router.post('/', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const {
            name,
            description,
            targetAmount,
            currentAmount = 0,
            targetDate,
            monthlyContribution,
            assignedUserId
        } = req.body;

        if (!name || !targetAmount) {
            return res.status(400).json({ error: 'Name and target amount are required' });
        }

        const goal = await prisma.goal.create({
            data: {
                tenantId,
                name,
                description,
                targetAmount,
                currentAmount,
                targetDate: targetDate ? new Date(targetDate) : null,
                monthlyContribution,
                assignedUserId: assignedUserId || userId,
                status: 'ACTIVE'
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.status(201).json({
            ...goal,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
            progress: 0,
            remaining: Number(goal.targetAmount)
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Add contribution to a goal
router.post('/:id/contribute', async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const { id } = req.params;
        const { amount, description } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // Verify goal exists and belongs to user's family
        const goal = await prisma.goal.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        // Update goal's current amount
        const newCurrentAmount = Number(goal.currentAmount) + Number(amount);
        const updatedGoal = await prisma.goal.update({
            where: { id: parseInt(id) },
            data: {
                currentAmount: newCurrentAmount,
                // Mark as completed if target reached
                status: newCurrentAmount >= Number(goal.targetAmount) ? 'COMPLETED' : goal.status
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Create a transaction record for this contribution
        await prisma.transaction.create({
            data: {
                tenantId,
                userId,
                type: 'EXPENSE',
                amount: Number(amount),
                category: 'Savings',
                description: description || `Contribution to ${goal.name}`,
                paymentMethod: 'Savings',
                notes: `Goal: ${goal.name}`
            }
        });

        const goalWithProgress = {
            ...updatedGoal,
            targetAmount: Number(updatedGoal.targetAmount),
            currentAmount: Number(updatedGoal.currentAmount),
            monthlyContribution: updatedGoal.monthlyContribution ? Number(updatedGoal.monthlyContribution) : null,
            progress: Number(updatedGoal.targetAmount) > 0
                ? ((Number(updatedGoal.currentAmount) / Number(updatedGoal.targetAmount)) * 100).toFixed(1)
                : 0,
            remaining: Number(updatedGoal.targetAmount) - Number(updatedGoal.currentAmount),
            contributionAmount: Number(amount)
        };

        res.json(goalWithProgress);
    } catch (error) {
        console.error('Error adding contribution:', error);
        res.status(500).json({ error: 'Failed to add contribution' });
    }
});

// Update a goal
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.goal.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        const {
            name,
            description,
            targetAmount,
            currentAmount,
            targetDate,
            monthlyContribution,
            status
        } = req.body;

        const goal = await prisma.goal.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(targetAmount !== undefined && { targetAmount }),
                ...(currentAmount !== undefined && { currentAmount }),
                ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
                ...(monthlyContribution !== undefined && { monthlyContribution }),
                ...(status && { status })
            },
            include: {
                assignedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.json({
            ...goal,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : null,
            progress: Number(goal.targetAmount) > 0
                ? ((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100).toFixed(1)
                : 0,
            remaining: Number(goal.targetAmount) - Number(goal.currentAmount)
        });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

// Delete a goal
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.goal.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        await prisma.goal.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

export default router;
