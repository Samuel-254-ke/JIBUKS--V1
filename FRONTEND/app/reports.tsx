import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import apiService from '@/services/api';

// ── Colors ────────────────────────────────────────────────────────────────
const C = {
    navy: '#1a3a8f', navyDark: '#0e2470', gold: '#F59E0B',
    bg: '#F5F7FA', white: '#ffffff', text: '#1F2937', sub: '#6B7280', border: '#E5E7EB',
};

const TABS = ['Overview', 'Categories', 'Cash Flow', 'Trends', 'Top'];

// Category mock (also used as DonutChart data)
const CATEGORIES = [
    { label: 'Food & Dining',    icon: 'restaurant', iconBg: '#FFF7ED', iconColor: '#F97316', amount: 32450, transactions: 42, pct: 38.5, color: '#EF4444',  badgeBg: '#FEF3C7', badgeColor: '#92400E' },
    { label: 'Transport',        icon: 'car',         iconBg: '#EFF6FF', iconColor: '#3B82F6', amount: 21800, transactions: 18, pct: 25.8, color: '#1a3a8f',  badgeBg: '#DBEAFE', badgeColor: '#1E40AF' },
    { label: 'Monthly Bills',    icon: 'receipt',     iconBg: '#F0FDF4', iconColor: '#22C55E', amount: 18200, transactions: 5,  pct: 21.6, color: '#22C55E',  badgeBg: '#DCFCE7', badgeColor: '#166534' },
    { label: 'Health & Fitness', icon: 'fitness',     iconBg: '#FEF2F2', iconColor: '#EF4444', amount: 11800, transactions: 12, pct: 14.1, color: '#F59E0B',  badgeBg: '#FEE2E2', badgeColor: '#991B1B' },
];

// ── Donut Chart (View-based, no SVG) ─────────────────────────────────────
function ProgressArc({ pct, color, size, thickness }: { pct: number; color: string; size: number; thickness: number }) {
    const p = Math.min(Math.max(pct, 0), 100);
    const half = size / 2;
    const rightAngle = Math.min(p, 50) / 50 * 180;
    const leftAngle  = p > 50 ? (p - 50) / 50 * 180 : 0;
    return (
        <View style={{ position: 'absolute', width: size, height: size }}>
            <View style={{ position: 'absolute', width: half, height: size, right: 0, overflow: 'hidden' }}>
                <View style={{ width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: 'transparent', borderRightColor: color, borderTopColor: rightAngle > 90 ? color : 'transparent', position: 'absolute', right: 0, transform: [{ rotate: `${rightAngle - 180}deg` }] }} />
            </View>
            {p > 50 && (
                <View style={{ position: 'absolute', width: half, height: size, left: 0, overflow: 'hidden' }}>
                    <View style={{ width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: 'transparent', borderLeftColor: color, borderBottomColor: leftAngle > 90 ? color : 'transparent', position: 'absolute', left: 0, transform: [{ rotate: `${leftAngle}deg` }] }} />
                </View>
            )}
        </View>
    );
}

function DonutChart({ segments, size = 200, thickness = 55 }: {
    segments: { color: string; pct: number }[];
    size?: number; thickness?: number;
}) {
    let cumPct = 0;
    const layers = segments.map(s => { cumPct += s.pct; return { color: s.color, cumPct }; }).reverse();
    const half = size / 2;
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {/* Gray base ring */}
            <View style={{ position: 'absolute', width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: '#E8ECF0' }} />
            {/* Colored arcs — largest to smallest cumPct */}
            {layers.map((l, i) => (
                <ProgressArc key={i} pct={l.cumPct} color={l.color} size={size} thickness={thickness} />
            ))}
            {/* Center hole */}
            <View style={{ position: 'absolute', width: size - thickness * 2 - 4, height: size - thickness * 2 - 4, borderRadius: half - thickness, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.navy }} />
                    <Text style={{ fontSize: 9, fontWeight: '700', color: C.sub, letterSpacing: 0.3 }}>CURRENT PERIOD</Text>
                </View>
            </View>
        </View>
    );
}

// ── Small Ring ──────────────────────────────────────────────────────────
function SmallRing({ pct, color, size = 64, thickness = 10 }: { pct: number; color: string; size?: number; thickness?: number }) {
    return (
        <View style={{ width: size, height: size }}>
            <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: '#E8ECF0' }} />
            <ProgressArc pct={pct} color={color} size={size} thickness={thickness} />
            <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color }}>{pct}%</Text>
            </View>
        </View>
    );
}

// ── Bar Chart ────────────────────────────────────────────────────────────
const CF_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'];
const CF_INCOME  = [80, 95, 72, 88, 68, 120];
const CF_EXPENSE = [65, 82, 88, 62, 92, 95];
const CF_MAX = 120;

function BarChart() {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingTop: 10 }}>
            {CF_MONTHS.map((m, i) => (
                <View key={m} style={{ alignItems: 'center', gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
                        <View style={{ width: 13, backgroundColor: '#22C55E', borderRadius: 4, height: CF_INCOME[i] / CF_MAX * 80 }} />
                        <View style={{ width: 13, backgroundColor: C.gold, borderRadius: 4, height: CF_EXPENSE[i] / CF_MAX * 80 }} />
                    </View>
                    <Text style={{ fontSize: 9, color: m === 'JUN' ? C.navy : C.sub, fontWeight: m === 'JUN' ? '800' : '400' }}>{m}</Text>
                </View>
            ))}
        </View>
    );
}

// ── Trend Line ────────────────────────────────────────────────────────────
const TREND_Y = [55, 48, 42, 30, 20, 10];

function TrendLine() {
    const spacing = 46;
    const H = 80;
    return (
        <View style={{ height: H, backgroundColor: '#FFFBEB', borderRadius: 12, overflow: 'hidden', position: 'relative', marginVertical: 8 }}>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.55, backgroundColor: '#FEF3C7', borderTopLeftRadius: 40, borderTopRightRadius: 40 }} />
            {TREND_Y.map((y, i) => (
                <View key={i} style={{ position: 'absolute', left: i * spacing + 8, bottom: H - y, width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold, borderWidth: 2, borderColor: C.white, zIndex: 2 }} />
            ))}
        </View>
    );
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: typeof CATEGORIES }) {
    const budgetPct = 79;
    return (
        <>
            <View style={s.section}>
                <Text style={s.statLabel}>AVAILABLE THIS MONTH</Text>
                <Text style={s.bigAmount}>KES 142,500</Text>
                <View style={{ flexDirection: 'row', gap: 14, marginVertical: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="arrow-up" size={12} color="#22C55E" />
                        <Text style={{ fontSize: 13, color: '#22C55E', fontWeight: '700' }}>+KES 12,000</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="arrow-down" size={12} color="#EF4444" />
                        <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '700' }}>-KES 8,000</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, color: C.sub }}>MONTHLY BUDGET USED</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: C.text }}>{budgetPct}%</Text>
                </View>
                <View style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 }}>
                    <View style={{ height: 6, width: `${budgetPct}%`, backgroundColor: C.gold, borderRadius: 3 }} />
                </View>
            </View>

            <View style={s.section}>
                <Text style={s.sectionTitle}>Spend Overview</Text>
                <View style={{ alignItems: 'center', marginVertical: 16 }}>
                    <DonutChart segments={data.map(c => ({ color: c.color, pct: c.pct }))} size={190} thickness={72} />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {data.map((c, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.color }} />
                            <View>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>{c.label.split(' ')[0]}</Text>
                                <Text style={{ fontSize: 11, color: C.sub }}>{c.pct}% · KES {Math.round(c.amount / 1000)}k</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <View style={[s.section, { flex: 1, marginBottom: 0 }]}>
                    <Text style={s.miniTitle}>INCOME VS EXP</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 50, marginTop: 8 }}>
                        {[55, 40, 55, 28].map((h, i) => (
                            <View key={i} style={{ flex: 1, height: h, borderRadius: 3, backgroundColor: i % 2 === 0 ? '#22C55E' : C.gold }} />
                        ))}
                    </View>
                </View>
                <View style={[s.section, { flex: 1, marginBottom: 0 }]}>
                    <Text style={s.miniTitle}>SPENDING TREND</Text>
                    <View style={{ height: 50, marginTop: 8, overflow: 'hidden', position: 'relative' }}>
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, backgroundColor: '#EFF6FF', borderRadius: 8 }} />
                        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 18, height: 2.5, backgroundColor: C.navy, borderRadius: 2, transform: [{ rotate: '-8deg' }] }} />
                    </View>
                </View>
            </View>

            <View style={s.section}>
                <View style={s.breakdownHeader}>
                    <Text style={s.sectionTitle}>Top Expenses</Text>
                    <TouchableOpacity><Text style={s.exportTxt}>VIEW ALL</Text></TouchableOpacity>
                </View>
                {[...data].sort((a, b) => b.amount - a.amount).map((cat, idx) => (
                    <View key={idx} style={s.catRow}>
                        <View style={[s.catIcon, { backgroundColor: cat.iconBg }]}>
                            <Ionicons name={cat.icon as any} size={20} color={cat.iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.catLabel}>{cat.label}</Text>
                            <Text style={s.catSub}>Groceries & Dining</Text>
                        </View>
                        <Text style={[s.catAmount, { color: C.navy }]}>KES {Number(cat.amount).toLocaleString()}</Text>
                    </View>
                ))}
            </View>
        </>
    );
}

// ── CASH FLOW TAB ─────────────────────────────────────────────────────────
function CashFlowTab() {
    return (
        <>
            <View style={s.section}>
                <Text style={s.statLabel}>NET BALANCE</Text>
                <Text style={[s.bigAmount, { marginBottom: 10 }]}>KES 24,580</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Ionicons name="trending-up" size={13} color="#22C55E" />
                        <Text style={{ fontSize: 12, color: '#166534', fontWeight: '700' }}>Positive Outcome</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: C.sub }}>Since Jan 2024</Text>
                </View>
            </View>

            <View style={s.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: C.navy }}>In vs Out</Text>
                        <Text style={{ fontSize: 12, color: C.sub }}>6-Month Comparison</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {[{ dot: '#22C55E', label: 'INCOME' }, { dot: C.gold, label: 'EXPENSE' }].map(l => (
                            <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.dot }} />
                                <Text style={{ fontSize: 10, color: C.sub }}>{l.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <BarChart />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                {[{ dir: 'arrow-down-circle' as const, col: '#22C55E', label: 'INCOME',   amt: 'KES 120,000', change: '+12.6%', up: true },
                  { dir: 'arrow-up-circle'   as const, col: '#EF4444', label: 'EXPENSES', amt: 'KES 95,420',  change: '-2.1%',  up: false }].map(item => (
                    <View key={item.label} style={[s.section, { flex: 1, marginBottom: 0 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                            <Ionicons name={item.dir} size={16} color={item.col} />
                            <Text style={{ fontSize: 10, fontWeight: '700', color: C.sub }}>{item.label}</Text>
                        </View>
                        <Text style={s.bigAmount}>{item.amt}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                            <Ionicons name={item.up ? 'trending-up' : 'trending-down'} size={12} color={item.col} />
                            <Text style={{ fontSize: 12, color: item.col, fontWeight: '600' }}>{item.change}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={s.section}>
                <Text style={s.sectionTitle}>Budget Health</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <Text style={{ fontSize: 14, color: C.sub, flex: 1, lineHeight: 22 }}>
                        You saved <Text style={{ fontWeight: '800', color: C.text }}>20% more</Text> than last month.
                    </Text>
                    <SmallRing pct={80} color="#22C55E" size={72} thickness={10} />
                </View>
            </View>
        </>
    );
}

// ── TRENDS TAB ────────────────────────────────────────────────────────────
function TrendsTab({ toggle, setToggle }: { toggle: 'WEEKLY' | 'MONTHLY'; setToggle: (v: 'WEEKLY' | 'MONTHLY') => void }) {
    return (
        <>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 14 }}>
                {(['WEEKLY', 'MONTHLY'] as const).map(t => (
                    <TouchableOpacity key={t} style={[s.toggleBtn, toggle === t && s.toggleBtnActive]} onPress={() => setToggle(t)}>
                        <Text style={[s.toggleTxt, toggle === t && s.toggleTxtActive]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.statLabel}>TOTAL SPENDING</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                        <Ionicons name="trending-down" size={11} color="#22C55E" />
                        <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700' }}>-12%</Text>
                    </View>
                </View>
                <Text style={s.bigAmount}>KES 48,250</Text>
                <TrendLine />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                    {['WK 1', 'WK 2', 'WK 3', 'WK 4'].map(w => (
                        <Text key={w} style={{ fontSize: 10, color: C.sub }}>{w}</Text>
                    ))}
                </View>
            </View>

            <View style={[s.insightBanner, { backgroundColor: '#FFF7ED', borderLeftWidth: 3, borderLeftColor: C.gold }]}>
                <View style={[s.insightBannerIcon, { backgroundColor: '#FDE68A' }]}>
                    <Ionicons name="location" size={16} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[s.catLabel, { marginBottom: 4 }]}>Spending increased this week</Text>
                    <Text style={{ fontSize: 12, color: C.sub, lineHeight: 18 }}>Your grocery expenses are 15% higher than last month's average.</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <View style={[s.section, { flex: 1, marginBottom: 0 }]}>
                    <Text style={s.statLabel}>LARGEST SPIKE</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: C.navy, marginTop: 4 }}>Dining</Text>
                    <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600', marginTop: 2 }}>+KES 4,200</Text>
                </View>
                <View style={[s.section, { flex: 1, marginBottom: 0 }]}>
                    <Text style={s.statLabel}>PREDICTION</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#22C55E', marginTop: 4 }}>On Track</Text>
                    <Text style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Within Budget</Text>
                </View>
            </View>

            <View style={s.section}>
                <View style={s.breakdownHeader}>
                    <Text style={s.sectionTitle}>GROWTH BREAKDOWN</Text>
                    <TouchableOpacity><Text style={s.exportTxt}>VIEW ALL</Text></TouchableOpacity>
                </View>
                {[
                    { icon: 'cart', iconBg: '#EEF2FF', iconColor: '#4F46E5', label: 'Retail Therapy', sub: '3 Transactions',  amount: 12400, badge: 'STABLE', badgeBg: '#D1FAE5', badgeColor: '#166534' },
                    { icon: 'restaurant', iconBg: '#FFF7ED', iconColor: '#F97316', label: 'Food & Drink', sub: '12 Transactions', amount: 8150,  badge: 'HIGH',   badgeBg: '#FEE2E2', badgeColor: '#991B1B' },
                ].map((item, idx) => (
                    <View key={idx} style={s.catRow}>
                        <View style={[s.catIcon, { backgroundColor: item.iconBg }]}>
                            <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.catLabel}>{item.label}</Text>
                            <Text style={s.catSub}>{item.sub}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={s.catAmount}>KES {item.amount.toLocaleString()}</Text>
                            <View style={[s.pctBadge, { backgroundColor: item.badgeBg }]}>
                                <Text style={[s.pctTxt, { color: item.badgeColor }]}>{item.badge}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </>
    );
}

// ── TOP TAB ───────────────────────────────────────────────────────────────
function TopTab({ data }: { data: typeof CATEGORIES }) {
    const sorted = [...data].sort((a, b) => b.amount - a.amount);
    return (
        <View style={s.section}>
            <View style={s.breakdownHeader}>
                <Text style={s.sectionTitle}>Top Spending Categories</Text>
                <TouchableOpacity style={s.exportBtn}>
                    <Text style={s.exportTxt}>Export</Text>
                    <Ionicons name="download-outline" size={14} color={C.gold} />
                </TouchableOpacity>
            </View>
            {sorted.map((cat, idx) => (
                <View key={idx} style={s.catRow}>
                    <View style={[s.catIcon, { backgroundColor: cat.iconBg }]}>
                        <Ionicons name={cat.icon as any} size={20} color={cat.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.catLabel}>#{idx + 1}  {cat.label}</Text>
                        <Text style={s.catSub}>{cat.transactions} Transactions</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={s.catAmount}>KES {Number(cat.amount).toLocaleString()}</Text>
                        <View style={[s.pctBadge, { backgroundColor: cat.badgeBg }]}>
                            <Text style={[s.pctTxt, { color: cat.badgeColor }]}>{cat.pct}%</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}

// Visual palette cycled by index for real (backend) categories, which only
// carry a name/amount/percentage — icon/color are presentation-only and
// don't come from the API.
const CATEGORY_PALETTE = [
    { icon: 'restaurant',  iconBg: '#FFF7ED', iconColor: '#F97316', color: '#EF4444', badgeBg: '#FEF3C7', badgeColor: '#92400E' },
    { icon: 'car',         iconBg: '#EFF6FF', iconColor: '#3B82F6', color: '#1a3a8f', badgeBg: '#DBEAFE', badgeColor: '#1E40AF' },
    { icon: 'receipt',     iconBg: '#F0FDF4', iconColor: '#22C55E', color: '#22C55E', badgeBg: '#DCFCE7', badgeColor: '#166534' },
    { icon: 'fitness',     iconBg: '#FEF2F2', iconColor: '#EF4444', color: '#F59E0B', badgeBg: '#FEE2E2', badgeColor: '#991B1B' },
    { icon: 'pricetag',    iconBg: '#F5F3FF', iconColor: '#8B5CF6', color: '#8B5CF6', badgeBg: '#EDE9FE', badgeColor: '#5B21B6' },
    { icon: 'briefcase',   iconBg: '#ECFEFF', iconColor: '#06B6D4', color: '#06B6D4', badgeBg: '#CFFAFE', badgeColor: '#155E75' },
];

// Backend returns { category, code, amount, transactionCount, percentage } —
// map that onto the display shape the tab components expect.
function toDisplayCategories(apiCategories: any[]) {
    return apiCategories.map((c, i) => {
        const palette = CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
        return {
            label: c.category ?? c.label ?? 'Uncategorized',
            amount: Number(c.amount) || 0,
            transactions: c.transactionCount ?? c.transactions ?? 0,
            pct: Number(c.percentage ?? c.pct) || 0,
            ...palette,
        };
    });
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function ReportsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab]   = useState('Overview');
    const [loading, setLoading]       = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [categoryData, setCategoryData] = useState(CATEGORIES);
    const [trendsToggle, setTrendsToggle] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');

    const load = async () => {
        try {
            const analysis = await apiService.getCategoryAnalysis();
            if (analysis?.categories?.length) setCategoryData(toDisplayCategories(analysis.categories));
        } catch { /* use mock */ }
        finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { load(); }, []));

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    if (loading) {
        return (
            <View style={s.root}><StatusBar barStyle="light-content" />
                <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                    <SafeAreaView><View style={s.headerRow}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={C.gold} /></TouchableOpacity>
                        <Text style={s.headerTitle}>Reports</Text>
                        <View style={{ width: 36 }} />
                    </View></SafeAreaView>
                </LinearGradient>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={C.navy} /></View>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                <SafeAreaView><View style={s.headerRow}>
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={20} color={C.gold} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Reports</Text>
                    <View style={{ width: 36 }} />
                </View></SafeAreaView>
            </LinearGradient>

            {/* FILTER TABS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabContent}>
                {TABS.map((tab) => (
                    <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]}
                        onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
                        <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}>

                {activeTab === 'Overview'    && <OverviewTab  data={categoryData} />}
                {activeTab === 'Categories'  && (
                    <>
                        <View style={s.chartCard}>
                            <DonutChart segments={categoryData.map(c => ({ color: c.color, pct: c.pct }))} size={200} thickness={52} />
                        </View>
                        <View style={s.section}>
                            <View style={s.breakdownHeader}>
                                <Text style={s.sectionTitle}>Breakdown</Text>
                                <TouchableOpacity style={s.exportBtn}>
                                    <Text style={s.exportTxt}>Export</Text>
                                    <Ionicons name="download-outline" size={14} color={C.gold} />
                                </TouchableOpacity>
                            </View>
                            {categoryData.map((cat, idx) => (
                                <View key={idx} style={s.catRow}>
                                    <View style={[s.catIcon, { backgroundColor: cat.iconBg }]}>
                                        <Ionicons name={cat.icon as any} size={20} color={cat.iconColor} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.catLabel}>{cat.label}</Text>
                                        <Text style={s.catSub}>{cat.transactions} Transactions</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <Text style={s.catAmount}>KES {Number(cat.amount).toLocaleString()}</Text>
                                        <View style={[s.pctBadge, { backgroundColor: cat.badgeBg }]}>
                                            <Text style={[s.pctTxt, { color: cat.badgeColor }]}>{cat.pct}%</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                        <View style={s.insightBanner}>
                            <View style={s.insightBannerIcon}>
                                <Ionicons name="location" size={18} color={C.gold} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.insightBannerTxt}>
                                    You spent <Text style={{ fontWeight: '800' }}>18% more</Text> on Food this month compared to July.
                                </Text>
                                <TouchableOpacity>
                                    <Text style={s.reviewLink}>REVIEW TRANSACTIONS {'→'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <LinearGradient colors={[C.navy, C.navyDark]} style={s.smartCard}>
                            <View style={s.smartHeader}>
                                <Ionicons name="bulb" size={18} color={C.gold} />
                                <Text style={s.smartTitle}>Smart Insight</Text>
                            </View>
                            <Text style={s.smartBody}>
                                You've spent <Text style={{ color: C.gold, fontWeight: '800' }}>15% less</Text> on Dining out this week compared to last month. Keep it up to reach your KES 200k savings goal!
                            </Text>
                        </LinearGradient>
                    </>
                )}
                {activeTab === 'Cash Flow'   && <CashFlowTab />}
                {activeTab === 'Trends'      && <TrendsTab toggle={trendsToggle} setToggle={setTrendsToggle} />}
                {activeTab === 'Top'         && <TopTab data={categoryData} />}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { paddingBottom: 16, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.gold, fontSize: 16, fontWeight: '800' },
    tabBar: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexGrow: 0 },
    tabContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F5F9' },
    tabActive: { backgroundColor: C.navy },
    tabTxt: { fontSize: 13, fontWeight: '600', color: C.sub },
    tabTxtActive: { color: C.white },
    scroll: { padding: 16 },
    chartCard: { alignItems: 'center', backgroundColor: C.white, borderRadius: 20, padding: 24, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10, elevation: 2 },
    section: { backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
    breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: C.text },
    exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    exportTxt: { fontSize: 13, color: C.gold, fontWeight: '700' },
    catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
    catIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    catLabel: { fontSize: 15, fontWeight: '700', color: C.text },
    catSub: { fontSize: 12, color: C.sub, marginTop: 2 },
    catAmount: { fontSize: 15, fontWeight: '800', color: C.text },
    pctBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    pctTxt: { fontSize: 11, fontWeight: '700' },
    insightBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1 },
    insightBannerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF9C3', alignItems: 'center', justifyContent: 'center' },
    insightBannerTxt: { fontSize: 14, color: C.text, lineHeight: 20, marginBottom: 6 },
    reviewLink: { fontSize: 12, color: C.gold, fontWeight: '800', letterSpacing: 0.3 },
    smartCard: { borderRadius: 20, padding: 20, marginBottom: 8 },
    smartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    smartTitle: { fontSize: 15, fontWeight: '800', color: C.white },
    smartBody: { fontSize: 13, color: '#CBD5E1', lineHeight: 20 },
    statLabel: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 2 },
    bigAmount: { fontSize: 26, fontWeight: '900', color: C.text },
    miniTitle: { fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 0.4 },
    toggleBtn: { paddingHorizontal: 24, paddingVertical: 9, borderRadius: 20, backgroundColor: '#F1F5F9' },
    toggleBtnActive: { backgroundColor: C.navy },
    toggleTxt: { fontSize: 13, fontWeight: '700', color: C.sub },
    toggleTxtActive: { color: C.white },
});

// (end of file)
