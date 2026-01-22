import express from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyJWT } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// ============================================
// VENDOR MANAGEMENT ROUTES
// ============================================

/**
 * GET /api/vendors
 * Get all vendors for the tenant with optional filtering and search
 */
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const { active, search } = req.query;

        const where = {
            tenantId,
            ...(active !== undefined && { isActive: active === 'true' }),
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { tags: { some: { name: { contains: search, mode: 'insensitive' } } } }
            ];
        }

        const vendors = await prisma.vendor.findMany({
            where,
            include: {
                _count: {
                    select: { purchases: true }
                },
                tags: true,
                stats: true
            },
            orderBy: { name: 'asc' }
        });

        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});

/**
 * GET /api/vendors/:id
 * Get vendor details with purchase history
 */
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const vendor = await prisma.vendor.findFirst({
            where: {
                id: parseInt(id),
                tenantId
            },
            include: {
                tags: true,
                stats: true,
                purchases: {
                    orderBy: { purchaseDate: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        billNumber: true,
                        purchaseDate: true,
                        total: true,
                        amountPaid: true,
                        status: true
                    }
                }
            }
        });

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json({
            ...vendor,
            balance: Number(vendor.balance),
            stats: vendor.stats ? {
                ...vendor.stats,
                totalPurchases: Number(vendor.stats.totalPurchases),
                totalPaid: Number(vendor.stats.totalPaid)
            } : null,
            purchases: vendor.purchases.map(p => ({
                ...p,
                total: Number(p.total),
                amountPaid: Number(p.amountPaid),
                balance: Number(p.total) - Number(p.amountPaid)
            }))
        });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({ error: 'Failed to fetch vendor' });
    }
});

/**
 * POST /api/vendors
 * Create a new vendor
 */
router.post('/', upload.single('logo'), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { name, email, phone, address, taxId, paymentTerms, tags } = req.body;

        // Handle file upload
        let logoUrl = null;
        if (req.file) {
            // Construct the public URL for the file
            // Assuming the server serves 'public/uploads' at '/uploads' or similar
            // Adjust based on your 'express.static' configuration in app.js
            logoUrl = `/uploads/${req.file.filename}`;
        }

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Vendor name is required' });
        }

        // Parse tags if sent as string (common with FormData)
        let parsedTags = tags;
        if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                // If not JSON, treat as single tag or comma-separated
                parsedTags = tags.split(',').map(t => t.trim());
            }
        }

        const vendor = await prisma.vendor.create({
            data: {
                tenantId,
                name,
                email,
                phone,
                address,
                taxId,
                paymentTerms: paymentTerms || 'Due on Receipt',
                logoUrl,
                // Handle tags if provided
                tags: parsedTags && Array.isArray(parsedTags) ? {
                    connectOrCreate: parsedTags.map(tag => ({
                        where: {
                            tenantId_name: { tenantId, name: tag.trim() }
                        },
                        create: {
                            tenantId,
                            name: tag.trim()
                        }
                    }))
                } : undefined,
                // Create initial stats stub
                stats: {
                    create: {
                        totalPurchases: 0,
                        totalPaid: 0
                    }
                }
            },
            include: {
                tags: true,
                stats: true
            }
        });

        res.status(201).json({
            ...vendor,
            balance: Number(vendor.balance),
            stats: {
                ...vendor.stats,
                totalPurchases: Number(vendor.stats.totalPurchases),
                totalPaid: Number(vendor.stats.totalPaid)
            }
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
});

/**
 * PUT /api/vendors/:id
 * Update vendor details
 */
router.put('/:id', upload.single('logo'), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { name, email, phone, address, taxId, paymentTerms, isActive, tags } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Handle file upload
        let logoUrl = undefined;
        if (req.file) {
            logoUrl = `/uploads/${req.file.filename}`;
        }

        // Verify vendor belongs to tenant
        const existing = await prisma.vendor.findFirst({
            where: { id: parseInt(id), tenantId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        // Parse tags if sent as string (common with FormData)
        let parsedTags = tags;
        if (tags && typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                parsedTags = tags.split(',').map(t => t.trim());
            }
        }

        const vendor = await prisma.vendor.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(email !== undefined && { email }),
                ...(phone !== undefined && { phone }),
                ...(address !== undefined && { address }),
                ...(taxId !== undefined && { taxId }),
                ...(paymentTerms !== undefined && { paymentTerms }),
                ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }), // Handle FormData boolean
                ...(logoUrl !== undefined && { logoUrl }),
                // Update tags if provided
                ...(parsedTags !== undefined && Array.isArray(parsedTags) ? {
                    tags: {
                        set: [], // Clear existing relations
                        connectOrCreate: parsedTags.map(tag => ({
                            where: {
                                tenantId_name: { tenantId, name: tag.trim() }
                            },
                            create: {
                                tenantId,
                                name: tag.trim()
                            }
                        }))
                    }
                } : {})
            },
            include: {
                tags: true,
                stats: true
            }
        });

        res.json({
            ...vendor,
            balance: Number(vendor.balance),
            stats: vendor.stats ? {
                ...vendor.stats,
                totalPurchases: Number(vendor.stats.totalPurchases),
                totalPaid: Number(vendor.stats.totalPaid)
            } : null
        });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ error: 'Failed to update vendor' });
    }
});

/**
 * DELETE /api/vendors/:id
 * Delete a vendor (only if no purchases)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        // Check if vendor has purchases
        const vendor = await prisma.vendor.findFirst({
            where: { id: parseInt(id), tenantId },
            include: { _count: { select: { purchases: true } } }
        });

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        if (vendor._count.purchases > 0) {
            return res.status(400).json({
                error: 'Cannot delete vendor with existing purchases. Consider deactivating instead.'
            });
        }

        await prisma.vendor.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({ error: 'Failed to delete vendor' });
    }
});

/**
 * GET /api/vendors/:id/statement
 * Get vendor statement (purchase history and payments)
 */
router.get('/:id/statement', async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        if (!tenantId) {
            return res.status(400).json({ error: 'User is not part of any family' });
        }

        const vendor = await prisma.vendor.findFirst({
            where: { id: parseInt(id), tenantId }
        });

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        // Build date filter
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);

        const purchases = await prisma.purchase.findMany({
            where: {
                vendorId: parseInt(id),
                tenantId,
                ...(Object.keys(dateFilter).length > 0 && { purchaseDate: dateFilter })
            },
            include: {
                payments: {
                    orderBy: { paymentDate: 'asc' }
                }
            },
            orderBy: { purchaseDate: 'asc' }
        });

        // Calculate running balance
        let runningBalance = 0;
        const transactions = [];

        purchases.forEach(purchase => {
            // Add purchase
            runningBalance += Number(purchase.total);
            transactions.push({
                date: purchase.purchaseDate,
                type: 'PURCHASE',
                reference: purchase.billNumber || `Purchase #${purchase.id}`,
                debit: Number(purchase.total),
                credit: 0,
                balance: runningBalance
            });

            // Add payments
            purchase.payments.forEach(payment => {
                runningBalance -= Number(payment.amount);
                transactions.push({
                    date: payment.paymentDate,
                    type: 'PAYMENT',
                    reference: payment.reference || `Payment #${payment.id}`,
                    debit: 0,
                    credit: Number(payment.amount),
                    balance: runningBalance
                });
            });
        });

        res.json({
            vendor: {
                id: vendor.id,
                name: vendor.name,
                email: vendor.email,
                phone: vendor.phone,
                currentBalance: Number(vendor.balance)
            },
            transactions,
            summary: {
                totalPurchases: purchases.reduce((sum, p) => sum + Number(p.total), 0),
                totalPayments: purchases.reduce((sum, p) =>
                    sum + p.payments.reduce((pSum, pay) => pSum + Number(pay.amount), 0), 0
                ),
                outstandingBalance: Number(vendor.balance)
            }
        });
    } catch (error) {
        console.error('Error generating vendor statement:', error);
        res.status(500).json({ error: 'Failed to generate vendor statement' });
    }
});

export default router;
