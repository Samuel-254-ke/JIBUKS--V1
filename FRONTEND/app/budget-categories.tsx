import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import apiService from '@/services/api';

const C = {
    navy: '#1a3a8f', navyDark: '#0e2470', gold: '#F59E0B',
    bg: '#F5F7FA', white: '#ffffff', text: '#1F2937',
    sub: '#6B7280', border: '#E5E7EB', green: '#22C55E', red: '#EF4444',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CAT_META: Record<string, { icon: string; color: string }> = {
    'Food & Groceries':  { icon: 'restaurant',     color: '#EF4444' },
    'Housing & Rent':    { icon: 'home',            color: '#3B82F6' },
    'Transport':         { icon: 'car',             color: '#8B5CF6' },
    'Utilities':         { icon: 'flash',           color: '#F59E0B' },
    'Education':         { icon: 'school',          color: '#10B981' },
    'Health':            { icon: 'medical',         color: '#EC4899' },
    'Entertainment':     { icon: 'game-controller', color: '#6366F1' },
    'Clothing':          { icon: 'shirt',           color: '#14B8A6' },
    'Savings':           { icon: 'wallet',          color: '#22C55E' },
    'Personal Care':     { icon: 'happy',           color: '#F97316' },
};

function getCatMeta(category: string) {
    const exact = CAT_META[category];
    if (exact) return exact;
    const key = Object.keys(CAT_META).find(k => category.toLowerCase().includes(k.toLowerCase()));
    return key ? CAT_META[key] : { icon: 'wallet', color: '#6B7280' };
}

export default function BudgetCategoriesScreen() {
    const router = useRouter();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBudgets = async () => {
        try {
            const data = await apiService.getFamilyBudgets();
            setBudgets(data || []);
        } catch (e) {
            console.error('Failed to load budgets:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadBudgets(); }, []));

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBudgets();
        setRefreshing(false);
    };

    const now = new Date();
    const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

    const totalLimit = budgets.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const totalSpent = budgets.reduce((s, b) => s + (Number(b.spent)  || 0), 0);
    const totalRemaining = Math.max(totalLimit - totalSpent, 0);
    const totalPct = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
    const isOnTrack = totalSpent <= totalLimit;

    const fmt = (n: number) => `KES ${Number(n).toLocaleString()}`;

    if (loading) {
        return (
            <View style={s.root}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                    <SafeAreaView>
                        <View style={s.headerRow}>
                            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={20} color={C.gold} />
                            </TouchableOpacity>
                            <Text style={s.headerTitle}>BUDGET CATEGORIES</Text>
                            <View style={{ width: 36 }} />
                        </View>
                    </SafeAreaView>
                </LinearGradient>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={C.navy} />
                </View>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                <SafeAreaView>
                    <View style={s.headerRow}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={20} color={C.gold} />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>BUDGET CATEGORIES</Text>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.push('/budget-alerts' as any)}>
                            <Ionicons name="notifications" size={20} color={C.gold} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
            >
                {/* TOTAL BUDGET CARD */}
                <View style={s.totalCard}>
                    <View style={s.totalCardTop}>
                        <View>
                            <Text style={s.budgetMonthTitle}>Budgets – {monthLabel}</Text>
                            <Text style={s.budgetMonthSub}>Monthly Family Overview</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/budget-history' as any)}>
                            <Text style={s.historyLink}>History</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={s.totalLabel}>TOTAL MONTHLY BUDGET</Text>
                    <View style={s.totalAmountRow}>
                        <Text style={s.totalAmount}>{fmt(totalLimit)}</Text>
                        <TouchableOpacity style={s.copyBtn}>
                            <Ionicons name="copy-outline" size={18} color={C.sub} />
                        </TouchableOpacity>
                    </View>
                    <View style={s.spentRemainingRow}>
                        <View>
                            <Text style={s.spentLabel}>Spent</Text>
                            <Text style={s.spentValue}>{fmt(totalSpent)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={s.remainingLabel}>Remaining</Text>
                            <Text style={s.remainingValue}>{fmt(totalRemaining)}</Text>
                        </View>
                    </View>
                    <View style={s.bigProgressBg}>
                        <View style={[s.bigProgressFill, {
                            width: `${totalPct}%` as any,
                            backgroundColor: isOnTrack ? C.green : C.red,
                        }]} />
                    </View>
                    <View style={[s.trackBadge, { backgroundColor: isOnTrack ? '#DCFCE7' : '#FEE2E2' }]}>
                        <Text style={[s.trackText, { color: isOnTrack ? '#166534' : '#991B1B' }]}>
                            {isOnTrack ? '👍' : '⚠️'} {isOnTrack ? 'On track' : 'Over budget'} this month ({Math.round(totalPct)}% used)
                        </Text>
                    </View>
                </View>

                {/* CATEGORY BUDGETS */}
                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Category Budgets</Text>
                    <TouchableOpacity>
                        <Text style={s.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.catList}>
                    {budgets.map((b) => {
                        const spent = Number(b.spent)  || 0;
                        const limit = Number(b.amount) || 0;
                        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                        const over = spent > limit;
                        const meta = getCatMeta(b.category);
                        const barColor = over ? C.red : meta.color;

                        return (
                            <TouchableOpacity key={b.id} style={s.catRow}
                                onPress={() => router.push({ pathname: '/edit-budget', params: { budgetId: b.id.toString() } } as any)}
                                activeOpacity={0.8}>
                                <View style={[s.catIcon, { backgroundColor: meta.color + '20' }]}>
                                    <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                                </View>
                                <View style={s.catInfo}>
                                    <View style={s.catNameRow}>
                                        <Text style={s.catName}>{b.category}</Text>
                                        {over
                                            ? <Text style={s.overBadge}>OVER BUDGET</Text>
                                            : <Text style={s.catPct}>{Math.round(pct)}%</Text>
                                        }
                                    </View>
                                    <View style={s.catProgressBg}>
                                        <View style={[s.catProgressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                                    </View>
                                    <Text style={s.catAmounts}>{fmt(spent)} / {fmt(limit)}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={C.sub} />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ADD CATEGORY FAB */}
            <TouchableOpacity style={s.fab}
                onPress={() => router.push('/add-budget-category' as any)}
                activeOpacity={0.85}>
                <Ionicons name="add" size={18} color={C.white} />
                <Text style={s.fabTxt}>Add Category</Text>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { paddingBottom: 16, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.gold, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    scroll: { padding: 16 },
    totalCard: { backgroundColor: C.white, borderRadius: 18, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3 },
    totalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    budgetMonthTitle: { fontSize: 15, fontWeight: '700', color: C.text },
    budgetMonthSub: { fontSize: 12, color: C.sub, marginTop: 2 },
    historyLink: { fontSize: 13, color: C.navy, fontWeight: '700', textDecorationLine: 'underline' },
    totalLabel: { fontSize: 11, fontWeight: '600', color: C.sub, letterSpacing: 0.5, marginBottom: 4 },
    totalAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    totalAmount: { fontSize: 32, fontWeight: '800', color: C.navy },
    copyBtn: { padding: 6 },
    spentRemainingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    spentLabel: { fontSize: 12, color: C.sub },
    spentValue: { fontSize: 14, fontWeight: '700', color: C.text },
    remainingLabel: { fontSize: 12, color: C.sub },
    remainingValue: { fontSize: 14, fontWeight: '700', color: C.green },
    bigProgressBg: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', marginBottom: 12 },
    bigProgressFill: { height: '100%', borderRadius: 5 },
    trackBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
    trackText: { fontSize: 13, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: C.text },
    viewAll: { fontSize: 13, color: C.navy, fontWeight: '700' },
    catList: { gap: 2 },
    catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1 },
    catIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    catInfo: { flex: 1 },
    catNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    catName: { fontSize: 15, fontWeight: '700', color: C.text },
    catPct: { fontSize: 13, fontWeight: '600', color: C.sub },
    overBadge: { fontSize: 11, fontWeight: '800', color: C.red, backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    catProgressBg: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: 5 },
    catProgressFill: { height: '100%', borderRadius: 3 },
    catAmounts: { fontSize: 12, color: C.sub },
    fab: { position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.navy, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 30, shadowColor: C.navy, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6 },
    fabTxt: { color: C.white, fontSize: 14, fontWeight: '700' },
});
