import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import { seedFamilyPaymentMethods } from '../services/accountingService.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Get all payment methods for the user's family
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const paymentMethods = await prisma.paymentMethod.findMany({
            where: {
                tenantId,
                isActive: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(paymentMethods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
});

// Create a new payment method
router.post('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { name, type, details } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        const paymentMethod = await prisma.paymentMethod.create({
            data: {
                tenantId,
                name,
                type,
                details
            }
        });

        res.status(201).json(paymentMethod);
    } catch (error) {
        console.error('Error creating payment method:', error);
        res.status(500).json({ error: 'Failed to create payment method' });
    }
});

// Update a payment method
router.put('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.paymentMethod.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        const { name, type, details, isActive } = req.body;

        const paymentMethod = await prisma.paymentMethod.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                ...(details !== undefined && { details }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(paymentMethod);
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({ error: 'Failed to update payment method' });
    }
});

// Delete a payment method (soft delete by setting isActive to false)
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const existing = await prisma.paymentMethod.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        await prisma.paymentMethod.update({
            where: { id: parseInt(id) },
            data: { isActive: false }
        });

        res.json({ message: 'Payment method deactivated successfully' });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ error: 'Failed to delete payment method' });
    }
});

// Seed default payment methods for the family
router.post('/seed', async (req, res) => {
    try {
        const { tenantId, role } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Only owners and admins can seed payment methods
        if (role !== 'OWNER' && role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only owners or admins can seed payment methods' });
        }

        const { force = false } = req.body;

        // Check existing payment methods
        const existingCount = await prisma.paymentMethod.count({
            where: { tenantId }
        });

        if (existingCount > 0 && !force) {
            return res.status(400).json({
                error: 'Payment methods already exist. Use force=true to reseed.',
                existingCount
            });
        }

        // If force, delete all existing payment methods (careful!)
        if (force && existingCount > 0) {
            await prisma.paymentMethod.deleteMany({
                where: { tenantId }
            });
        }

        // Seed payment methods
        const count = await seedFamilyPaymentMethods(tenantId);

        res.json({
            message: 'Payment methods seeded successfully',
            paymentMethodsCreated: count
        });
    } catch (error) {
        console.error('Error seeding payment methods:', error);
        res.status(500).json({ error: 'Failed to seed payment methods' });
    }
});

export default router;
