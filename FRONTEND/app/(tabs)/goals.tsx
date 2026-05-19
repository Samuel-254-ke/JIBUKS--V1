import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import apiService from '@/services/api';

const C = {
    navy: '#1a3a8f',
    navyDark: '#0e2470',
    gold: '#F59E0B',
    accent: '#F97316',
    bg: '#F5F7FA',
    white: '#ffffff',
    text: '#1F2937',
    sub: '#6B7280',
    border: '#E5E7EB',
    success: '#22C55E',
};

const GOAL_ICONS: Record<string, { name: any; color: string }> = {
    car:        { name: 'car-sport',  color: C.gold },
    home:       { name: 'home',       color: C.navy },
    education:  { name: 'school',     color: '#8B5CF6' },
    travel:     { name: 'airplane',   color: '#06B6D4' },
    business:   { name: 'briefcase',  color: '#10B981' },
    emergency:  { name: 'medkit',     color: '#EF4444' },
    default:    { name: 'flag',       color: C.navy },
};

function GoalIcon({ category, size = 28 }: { category?: string; size?: number }) {
    const key = (category || '').toLowerCase();
    const icon = GOAL_ICONS[key] || GOAL_ICONS.default;
    return (
        <View style={{
            width: size + 20, height: size + 20, borderRadius: (size + 20) / 2,
            backgroundColor: icon.color + '20', borderWidth: 2.5, borderColor: icon.color,
            alignItems: 'center', justifyContent: 'center',
        }}>
            <Ionicons name={icon.name} size={size} color={icon.color} />
        </View>
    );
}

export default function GoalsTabScreen() {
    const router = useRouter();
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(useCallback(() => {
        loadGoals();
    }, []));

    const loadGoals = async () => {
        try {
            setLoading(true);
            const data = await apiService.getGoals();
            setGoals(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load goals:', e);
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadGoals();
        setRefreshing(false);
    };

    const fmt = (n: any) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;

    const totalSaved = goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);
    const overallPct = totalTarget > 0
        ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100)
        : 0;

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" backgroundColor={C.navy} />

            {/* ── HEADER ── */}
            <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                <SafeAreaView>
                    <View style={s.headerRow}>
                        <View>
                            <Text style={s.headerTitle}>Savings Goals</Text>
                            <Text style={s.headerSub}>{goals.length} active goal{goals.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add-saving-goals' as any)}>
                            <Ionicons name="add" size={22} color={C.white} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color={C.navy} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scroll}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
                >
                    {/* ── TOTAL SAVED CARD ── */}
                    <View style={s.totalCard}>
                        <View style={s.totalRow}>
                            <View>
                                <Text style={s.totalLabel}>TOTAL SAVED</Text>
                                <Text style={s.totalAmount}>{fmt(totalSaved)}</Text>
                                <Text style={s.totalTarget}>of {fmt(totalTarget)} target</Text>
                            </View>
                            <View style={s.ringWrap}>
                                <View style={s.ringOuter}>
                                    <Text style={s.ringPct}>{overallPct}%</Text>
                                    <Text style={s.ringLabel}>overall</Text>
                                </View>
                            </View>
                        </View>
                        <View style={s.progressBg}>
                            <View style={[s.progressFill, {
                                width: `${overallPct}%` as any,
                                backgroundColor: overallPct >= 100 ? C.success : C.gold,
                            }]} />
                        </View>
                    </View>

                    {/* ── GOALS LIST ── */}
                    {goals.length === 0 ? (
                        <View style={s.emptyWrap}>
                            <Ionicons name="trophy-outline" size={72} color="#CBD5E1" />
                            <Text style={s.emptyTitle}>No Goals Yet</Text>
                            <Text style={s.emptySub}>Create your first savings goal to get started</Text>
                            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/add-saving-goals' as any)}>
                                <Ionicons name="add" size={18} color={C.white} />
                                <Text style={s.emptyBtnTxt}>Create Goal</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={s.grid}>
                            {goals.map((goal) => {
                                const current = Number(goal.currentAmount) || 0;
                                const target  = Number(goal.targetAmount)  || 0;
                                const pct     = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
                                const done    = pct >= 100;
                                return (
                                    <TouchableOpacity
                                        key={goal.id}
                                        style={[s.goalCard, done && s.goalCardDone]}
                                        onPress={() => router.push({ pathname: '/goal-detail', params: { goalId: goal.id.toString() } } as any)}
                                        activeOpacity={0.85}
                                    >
                                        <GoalIcon category={goal.category} size={26} />
                                        <Text style={s.goalName} numberOfLines={2}>{goal.name}</Text>
                                        {goal.targetDate && (
                                            <Text style={s.goalDue}>
                                                DUE {new Date(goal.targetDate).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }).toUpperCase()}
                                            </Text>
                                        )}
                                        <Text style={s.goalCurrent}>{fmt(current)}</Text>
                                        <Text style={s.goalTarget}>of {fmt(target)}</Text>
                                        <View style={s.barBg}>
                                            <View style={[s.barFill, {
                                                width: `${pct}%` as any,
                                                backgroundColor: done ? C.success : C.gold,
                                            }]} />
                                        </View>
                                        <Text style={[s.pctTxt, done && { color: C.success }]}>{pct}%</Text>
                                        <TouchableOpacity
                                            style={[s.topUpBtn, done && { backgroundColor: C.success }]}
                                            onPress={() => router.push({ pathname: '/add-to-goal', params: { goalId: goal.id.toString() } } as any)}
                                        >
                                            <Text style={s.topUpTxt}>{done ? 'COMPLETED ✓' : 'TOP UP'}</Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    <View style={{ height: 110 }} />
                </ScrollView>
            )}

            {/* ── FAB ── */}
            <TouchableOpacity style={s.fab} onPress={() => router.push('/add-saving-goals' as any)} activeOpacity={0.85}>
                <Ionicons name="add" size={28} color={C.white} />
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
        paddingHorizontal: 20, paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? 50 : 54,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: C.gold, fontSize: 20, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },
    addBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },

    scroll: { padding: 16 },

    totalCard: {
        backgroundColor: C.white, borderRadius: 20, padding: 20, marginBottom: 20,
        shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { fontSize: 11, fontWeight: '600', color: C.sub, letterSpacing: 0.5, marginBottom: 4 },
    totalAmount: { fontSize: 28, fontWeight: '800', color: C.navy },
    totalTarget: { fontSize: 12, color: C.sub, marginTop: 2 },
    ringWrap: { alignItems: 'center', justifyContent: 'center' },
    ringOuter: {
        width: 70, height: 70, borderRadius: 35,
        borderWidth: 5, borderColor: C.gold,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFFBEB',
    },
    ringPct: { fontSize: 16, fontWeight: '800', color: C.navy },
    ringLabel: { fontSize: 9, color: C.sub, fontWeight: '600' },
    progressBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    goalCard: {
        width: '47%',
        backgroundColor: C.white, borderRadius: 18, padding: 14,
        alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
    },
    goalCardDone: { borderWidth: 1.5, borderColor: C.success + '60', backgroundColor: '#F0FDF4' },
    goalName: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center', marginTop: 8, marginBottom: 3 },
    goalDue: { fontSize: 9, color: C.sub, fontWeight: '600', marginBottom: 6 },
    goalCurrent: { fontSize: 14, fontWeight: '800', color: C.navy, marginBottom: 1 },
    goalTarget: { fontSize: 10, color: C.sub, marginBottom: 8 },
    barBg: { width: '100%', height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
    barFill: { height: '100%', borderRadius: 2 },
    pctTxt: { fontSize: 11, fontWeight: '700', color: C.gold, marginBottom: 10 },
    topUpBtn: {
        backgroundColor: C.gold, borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 7,
        width: '100%', alignItems: 'center',
    },
    topUpTxt: { color: C.white, fontSize: 11, fontWeight: '800' },

    emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
    emptySub: { fontSize: 14, color: C.sub, textAlign: 'center', paddingHorizontal: 30 },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: C.navy, borderRadius: 14,
        paddingHorizontal: 22, paddingVertical: 13, marginTop: 8,
    },
    emptyBtnTxt: { color: C.white, fontSize: 15, fontWeight: '700' },

    fab: {
        position: 'absolute', bottom: 90, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: C.gold,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: C.gold, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6,
    },
});
