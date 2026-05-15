import { prisma } from '../lib/prisma.js';
import path from 'path';

/**
 * Update family profile (name and/or avatar)
 */
export async function updateFamilyProfile(req, res, next) {
    try {
        const { tenantId, role } = req.user;
        const { name } = req.body;

        if (!tenantId) return res.status(404).json({ error: 'Not part of a family' });

        // Only OWNER and ADMIN can update family profile
        if (!['OWNER', 'ADMIN'].includes(role)) {
            return res.status(403).json({ error: 'Only family owner or admin can update profile' });
        }

        const updateData = {};

        // Update name if provided
        if (name && name.trim()) {
            updateData.name = name.trim();
        }

        // Handle avatar upload if provided
        if (req.file) {
            const avatarUrl = `/uploads/${req.file.filename}`;
            updateData.metadata = {
                avatar: avatarUrl
            };
        }

        const updatedFamily = await prisma.tenant.update({
            where: { id: tenantId },
            data: updateData
        });

        res.json({
            message: 'Family profile updated successfully',
            family: {
                id: updatedFamily.id,
                name: updatedFamily.name,
                avatar: updatedFamily.metadata?.avatar || null
            }
        });
    } catch (err) {
        next(err);
    }
}


/**
 * Get detailed family settings with members and permissions
 */
export async function getFamilySettings(req, res, next) {
    try {
        const { tenantId, id: userId } = req.user;

        if (!tenantId) return res.status(404).json({ error: 'Not part of a family' });

        const family = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatarUrl: true,
                        isActive: true,
                        permissions: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'asc' }
                },
                goals: {
                    where: { status: 'ACTIVE' },
                    select: { id: true }
                }
            }
        });

        if (!family) return res.status(404).json({ error: 'Family not found' });

        // Get owner/creator
        const owner = family.users.find(u => u.role === 'OWNER');

        res.json({
            family: {
                id: family.id,
                name: family.name,
                avatar: null, // TODO: Add family avatar support
                createdAt: family.createdAt,
                totalMembers: family.users.length,
                activeGoals: family.goals.length,
                creatorId: owner?.id || family.users[0]?.id
            },
            members: family.users.map(user => ({
                id: user.id.toString(),
                name: user.name || 'Unknown',
                email: user.email,
                role: user.role,
                status: user.isActive ? 'Active' : 'Inactive',
                avatar: user.avatarUrl,
                joinedAt: user.createdAt,
                permissions: user.permissions || getDefaultPermissions(user.role)
            })),
            pendingInvitations: [] // TODO: Implement invitation system
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update member permissions
 */
export async function updateMemberPermissions(req, res, next) {
    try {
        const { tenantId, role: requesterRole } = req.user;
        const { memberId } = req.params;
        const { permissions } = req.body;

        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        // Only OWNER and ADMIN can update permissions
        if (!['OWNER', 'ADMIN'].includes(requesterRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const member = await prisma.user.findFirst({
            where: { id: parseInt(memberId), tenantId }
        });

        if (!member) return res.status(404).json({ error: 'Member not found' });

        // Cannot modify OWNER permissions
        if (member.role === 'OWNER') {
            return res.status(403).json({ error: 'Cannot modify owner permissions' });
        }

        const updated = await prisma.user.update({
            where: { id: parseInt(memberId) },
            data: { permissions }
        });

        res.json({ message: 'Permissions updated successfully', permissions: updated.permissions });
    } catch (err) {
        next(err);
    }
}

/**
 * Update member role
 */
export async function updateMemberRole(req, res, next) {
    try {
        const { tenantId, role: requesterRole } = req.user;
        const { memberId } = req.params;
        const { role } = req.body;

        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        // Only OWNER can change roles
        if (requesterRole !== 'OWNER') {
            return res.status(403).json({ error: 'Only family owner can change roles' });
        }

        const member = await prisma.user.findFirst({
            where: { id: parseInt(memberId), tenantId }
        });

        if (!member) return res.status(404).json({ error: 'Member not found' });

        // Cannot change OWNER role
        if (member.role === 'OWNER' || role === 'OWNER') {
            return res.status(403).json({ error: 'Cannot modify owner role' });
        }

        const updated = await prisma.user.update({
            where: { id: parseInt(memberId) },
            data: {
                role,
                permissions: getDefaultPermissions(role)
            }
        });

        res.json({ message: 'Role updated successfully', role: updated.role });
    } catch (err) {
        next(err);
    }
}

/**
 * Remove member from family
 */
export async function removeMember(req, res, next) {
    try {
        const { tenantId, role: requesterRole, id: requesterId } = req.user;
        const { memberId } = req.params;

        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        // Only OWNER and ADMIN can remove members
        if (!['OWNER', 'ADMIN'].includes(requesterRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const member = await prisma.user.findFirst({
            where: { id: parseInt(memberId), tenantId }
        });

        if (!member) return res.status(404).json({ error: 'Member not found' });

        // Cannot remove OWNER
        if (member.role === 'OWNER') {
            return res.status(403).json({ error: 'Cannot remove family owner' });
        }

        // Cannot remove yourself
        if (member.id === requesterId) {
            return res.status(403).json({ error: 'Cannot remove yourself. Use leave family instead.' });
        }

        await prisma.user.delete({
            where: { id: parseInt(memberId) }
        });

        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        next(err);
    }
}

/**
 * Leave family (for non-owners)
 */
export async function leaveFamily(req, res, next) {
    try {
        const { tenantId, role, id: userId } = req.user;

        if (!tenantId) return res.status(404).json({ error: 'Not part of a family' });

        // OWNER cannot leave, must delete family or transfer ownership first
        if (role === 'OWNER') {
            return res.status(403).json({
                error: 'Family owner cannot leave. Transfer ownership or delete the family.'
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { tenantId: null, isActive: false }
        });

        res.json({ message: 'Successfully left the family' });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete entire family (OWNER only)
 */
export async function deleteFamily(req, res, next) {
    try {
        const { tenantId, role } = req.user;

        if (!tenantId) return res.status(404).json({ error: 'Not part of a family' });

        // Only OWNER can delete family
        if (role !== 'OWNER') {
            return res.status(403).json({ error: 'Only family owner can delete the family' });
        }

        // Delete will cascade to users, goals, budgets due to schema
        await prisma.tenant.delete({
            where: { id: tenantId }
        });

        res.json({ message: 'Family deleted successfully' });
    } catch (err) {
        next(err);
    }
}

/**
 * Get member details with permissions
 */
export async function getMemberDetails(req, res, next) {
    try {
        const { tenantId } = req.user;
        const { memberId } = req.params;

        if (!tenantId) return res.status(403).json({ error: 'Not part of a family' });

        const member = await prisma.user.findFirst({
            where: { id: parseInt(memberId), tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                permissions: true,
                createdAt: true
            }
        });

        if (!member) return res.status(404).json({ error: 'Member not found' });

        res.json({
            id: member.id.toString(),
            name: member.name || 'Unknown',
            email: member.email,
            role: member.role,
            avatar: member.avatarUrl,
            permissions: member.permissions || getDefaultPermissions(member.role)
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats(req, res, next) {
    try {
        const { tenantId } = req.user;

        if (!tenantId) return res.status(404).json({ error: 'Not part of a family' });

        // Current month boundaries
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const [family, goals, budgets, transactions] = await Promise.all([
            prisma.tenant.findUnique({
                where: { id: tenantId },
                include: { users: { select: { id: true } } }
            }),
            prisma.goal.findMany({
                where: { tenantId, status: 'ACTIVE' },
                select: { id: true, name: true, targetAmount: true, currentAmount: true, targetDate: true },
                orderBy: { createdAt: 'desc' },
                take: 4
            }),
            prisma.budget.findMany({ where: { tenantId } }),
            prisma.transaction.findMany({
                where: { tenantId, date: { gte: monthStart, lte: monthEnd } },
                orderBy: { date: 'desc' },
            })
        ]);

        if (!family) return res.status(404).json({ error: 'Family not found' });

        // ── Summary ──────────────────────────────────────────────────────────
        const totalIncome   = transactions.filter(t => t.type === 'INCOME')
            .reduce((s, t) => s + Number(t.amount), 0);
        const totalExpenses = transactions.filter(t => t.type === 'EXPENSE')
            .reduce((s, t) => s + Number(t.amount), 0);

        // ── Spending per category ─────────────────────────────────────────────
        const spendMap = {};
        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            spendMap[t.category] = (spendMap[t.category] || 0) + Number(t.amount);
        });

        const categorySpending = budgets.map(b => {
            const spent  = spendMap[b.category] || 0;
            const budget = Number(b.amount);
            return {
                category: b.category,
                budget,
                spent,
                pct: budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0,
            };
        });

        // ── Budget alerts (≥80 % used) ────────────────────────────────────────
        const budgetAlerts = categorySpending
            .filter(b => b.pct >= 80)
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 3)
            .map(b => ({
                type:  b.pct >= 100 ? 'over' : 'warn',
                title: b.pct >= 100 ? `${b.category} Over Budget` : `${b.category} Budget Low`,
                sub:   b.pct >= 100
                    ? `KES ${(b.spent - b.budget).toLocaleString()} over`
                    : `KES ${(b.budget - b.spent).toLocaleString()} remaining`,
                pct: b.pct,
            }));

        // ── Recent transactions ───────────────────────────────────────────────
        const recentTransactions = transactions.slice(0, 5).map(t => ({
            id:            t.id,
            type:          t.type,
            amount:        Number(t.amount),
            description:   t.description,
            category:      t.category,
            date:          t.date,
            paymentMethod: t.paymentMethod,
        }));

        res.json({
            familyName:   family.name,
            totalMembers: family.users.length,
            summary: {
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses,
            },
            goals: goals.map(g => ({
                id:            g.id,
                name:          g.name,
                targetAmount:  Number(g.targetAmount),
                currentAmount: Number(g.currentAmount),
                targetDate:    g.targetDate,
            })),
            categorySpending,
            recentTransactions,
            budgetAlerts,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Helper function to get default permissions based on role
 */
function getDefaultPermissions(role) {
    const defaults = {
        OWNER: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canViewBudgets: true,
            canEditBudgets: true,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: true,
            canRemove: true
        },
        ADMIN: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canViewBudgets: true,
            canEditBudgets: true,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: true,
            canRemove: false
        },
        PARENT: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
            canViewBudgets: true,
            canEditBudgets: true,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: false,
            canRemove: false
        },
        CHILD: {
            canView: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canViewBudgets: true,
            canEditBudgets: false,
            canViewGoals: true,
            canContributeGoals: true,
            canInvite: false,
            canRemove: false
        },
        MEMBER: {
            canView: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canViewBudgets: true,
            canEditBudgets: false,
            canViewGoals: true,
            canContributeGoals: false,
            canInvite: false,
            canRemove: false
        }
    };

    return defaults[role] || defaults.MEMBER;
}
