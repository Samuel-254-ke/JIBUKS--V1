import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#1a3a8f',
  primaryDark: '#0e2470',
  accent: '#F97316',
  gold: '#FFAA00',
  success: '#22C55E',
  danger: '#EF4444',
  warn: '#F59E0B',
  white: '#ffffff',
  bg: '#F5F7FA',
  card: '#ffffff',
  text: '#1F2937',
  textMid: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  track: '#E9ECEF',
};

// ─── Mock fallbacks ──────────────────────────────────────────────────────────
const MOCK_BUDGETS = [
  { name: 'Food & Groceries', pct: 60 },
  { name: 'Housing', pct: 100 },
];
const MOCK_GOALS = [
  { name: 'Emergency Fund', currentAmount: 45000, targetAmount: 100000 },
  { name: 'New Car Fund', currentAmount: 200000, targetAmount: 500000 },
];
const MOCK_TX = [
  { type: 'EXPENSE', amount: 8450, description: 'Carrefour Supermarket', date: new Date().toISOString() },
  { type: 'INCOME', amount: 120000, description: 'Salary Deposit', date: new Date(Date.now() - 86400000).toISOString() },
  { type: 'EXPENSE', amount: 1200, description: 'Uber Ride', date: new Date(Date.now() - 2 * 86400000).toISOString() },
];

// ─── Circular progress ring (quadrant-based, no SVG needed) ──────────────────
function RingProgress({ pct, size = 88, color = C.accent }: { pct: number; size?: number; color?: string }) {
  const bw = 7;
  const p = Math.min(Math.max(pct, 0), 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: bw,
        borderTopColor:    p > 12  ? color : C.track,
        borderRightColor:  p > 37  ? color : C.track,
        borderBottomColor: p > 62  ? color : C.track,
        borderLeftColor:   p > 87  ? color : C.track,
        transform: [{ rotate: '-45deg' }],
      }} />
      <Text style={{ fontSize: 15, fontWeight: '800', color: C.text }}>{p}%</Text>
    </View>
  );
}

// ─── Budget row ──────────────────────────────────────────────────────────────
function BudgetRow({ name, pct }: { name: string; pct: number }) {
  const over = pct >= 100;
  const icon: any = name.toLowerCase().includes('food') ? 'restaurant'
    : name.toLowerCase().includes('hous') ? 'home'
    : name.toLowerCase().includes('trans') ? 'car'
    : 'wallet';
  return (
    <View style={[s.budRow, over && s.budRowOver]}>
      <View style={s.budIcon}>
        <Ionicons name={icon} size={18} color={over ? C.danger : C.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.budTopRow}>
          <Text style={s.budName}>{name}</Text>
          <Text style={[s.budPct, over && { color: C.danger }]}>{pct}%</Text>
        </View>
        <View style={s.trackSm}>
          <View style={[s.fillSm, {
            width: `${Math.min(pct, 100)}%` as any,
            backgroundColor: over ? C.danger : C.accent,
          }]} />
        </View>
      </View>
    </View>
  );
}

// ─── Alert row ───────────────────────────────────────────────────────────────
function AlertRow({
  icon, iconBg, iconColor, title, sub,
  action, arrow,
}: {
  icon: any; iconBg: string; iconColor: string; title: string; sub: string;
  action?: { label: string; onPress: () => void };
  arrow?: boolean;
}) {
  return (
    <View style={[s.alertRow, action ? s.alertRowWarm : s.alertRowRed]}>
      <View style={[s.alertIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.alertTitle}>{title}</Text>
        <Text style={s.alertSub}>{sub}</Text>
      </View>
      {action && (
        <TouchableOpacity style={s.alertBtn} onPress={action.onPress}>
          <Text style={s.alertBtnText}>{action.label}</Text>
        </TouchableOpacity>
      )}
      {arrow && <Ionicons name="chevron-forward" size={18} color={C.textLight} />}
    </View>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────
function ActivityRow({ tx }: { tx: any }) {
  const isIncome = tx.type === 'INCOME';
  const amt: number = typeof tx.amount === 'number' ? tx.amount : 0;
  const label = tx.description || tx.category || 'Transaction';
  const icon: any = isIncome ? 'arrow-down-circle'
    : label.toLowerCase().includes('uber') || label.toLowerCase().includes('ride') ? 'car'
    : label.toLowerCase().includes('super') || label.toLowerCase().includes('shop') ? 'cart'
    : 'receipt';
  const dateTxt = tx.date
    ? new Date(tx.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={s.actRow}>
      <View style={[s.actIcon, { backgroundColor: isIncome ? '#F0FDF4' : '#FEF2F2' }]}>
        <Ionicons name={icon} size={22} color={isIncome ? C.success : C.danger} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.actName} numberOfLines={1}>{label}</Text>
        <Text style={s.actDate}>{dateTxt}</Text>
      </View>
      <Text style={[s.actAmt, { color: isIncome ? C.success : C.danger }]}>
        {isIncome ? '+' : ''}KES {amt.toLocaleString('en-KE')}
      </Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    loadDashboard();
  }, [user?.tenantId]));

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiService.getDashboard();
      setDashData(res);
    } catch {
      // falls back to mock data below
    } finally {
      setLoading(false);
    }
  };

  const summary = dashData?.summary ?? { totalIncome: 142500, totalExpenses: 8000, balance: 142500 };
  const goals = dashData?.goals?.slice(0, 4) ?? MOCK_GOALS;
  const budgets = dashData?.categorySpending?.slice(0, 3) ?? MOCK_BUDGETS;
  const recentTx = dashData?.recentTransactions?.slice(0, 3) ?? MOCK_TX;
  const budgetUsedPct = summary.totalIncome > 0
    ? Math.min(Math.round((summary.totalExpenses / summary.totalIncome) * 100), 100)
    : 79;
  const familyName = dashData?.familyName
    ?? (user?.name ? `The ${user.name.split(' ').pop()} Family` : 'The Otieno Family');

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <LinearGradient colors={[C.primary, C.primaryDark]} style={s.header}>
          <View style={s.headerRow}>
            {/* Avatar + family name */}
            <View style={s.avatarGroup}>
              <View style={s.avatarCircle}>
                <Ionicons name="people" size={22} color={C.accent} />
              </View>
              <Text style={s.familyName}>{familyName}</Text>
            </View>

            {/* Bell */}
            <TouchableOpacity style={s.bell}>
              <Ionicons name="notifications" size={20} color={C.white} />
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>6</Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        )}

        {/* ── AVAILABLE THIS MONTH ─────────────────────────────────── */}
        <View style={s.balCard}>
          <Text style={s.balLabel}>AVAILABLE THIS MONTH</Text>
          <Text style={s.balAmount}>
            KES {summary.balance.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
          </Text>
          <View style={s.balStats}>
            <View style={s.balStat}>
              <Ionicons name="arrow-up" size={13} color={C.success} />
              <Text style={[s.balStatTxt, { color: C.success }]}>
                +KES {(summary.totalIncome / 1000).toFixed(0)}k
              </Text>
            </View>
            <View style={s.balStat}>
              <Ionicons name="arrow-down" size={13} color={C.danger} />
              <Text style={[s.balStatTxt, { color: C.danger }]}>
                -KES {(summary.totalExpenses / 1000).toFixed(0)}k
              </Text>
            </View>
          </View>
          <View style={s.budgetMeta}>
            <Text style={s.budgetMetaLabel}>MONTHLY BUDGET USED</Text>
            <Text style={s.budgetMetaPct}>{budgetUsedPct}%</Text>
          </View>
          <View style={s.trackLg}>
            <View style={[s.fillLg, {
              width: `${budgetUsedPct}%` as any,
              backgroundColor: budgetUsedPct >= 90 ? C.danger : C.accent,
            }]} />
          </View>
        </View>

        {/* ── BUDGET SNAPSHOT ──────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Budget Snapshot</Text>
            <TouchableOpacity onPress={() => router.push('/expenses' as any)}>
              <Text style={s.link}>View all</Text>


            {/* Creative Financial Dashboard Card */}
            <View style={styles.financialCard}>

              {/* Main Balance */}
              <View style={styles.mainBalanceSection}>
                <Text style={styles.balanceLabel}>REAL AVAILABLE CASH</Text>
                <Text style={styles.balanceAmount}>
                  KES {chequeSummary.realAvailable.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Three-Column Stats Grid */}
              <View style={styles.statsGrid}>
                {/* Money In */}
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="arrow-down" size={14} color="#15803d" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Money In</Text>
                    <Text style={styles.statValue}>1.5M</Text>
                  </View>
                </View>

                <View style={styles.verticalDivider} />

                {/* Money Out */}
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="arrow-up" size={14} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Money Out</Text>
                    <Text style={styles.statValue}>320k</Text>
                  </View>
                </View>

                <View style={styles.verticalDivider} />

                {/* Cash */}
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#e0f2fe' }]}>
                    <Ionicons name="wallet" size={14} color="#0284c7" />
                  </View>
                  <View>
                    <Text style={styles.statLabel}>Bank Bal</Text>
                    <Text style={styles.statValue}>
                      {chequeSummary.bankBalance >= 1000
                        ? (chequeSummary.bankBalance / 1000).toFixed(1) + 'k'
                        : chequeSummary.bankBalance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.actionsGrid}>



            {/* 1. Invoices */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/invoices' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
                <MaterialCommunityIcons name="file-document-edit-outline" size={26} color="#0284c7" />
              </View>
              <Text style={styles.actionLabel}>Invoices</Text>
            </TouchableOpacity>

            {/* 2. Expenses & Bills */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/expenses-and-bills' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons name="receipt-text-outline" size={26} color="#ef4444" />
              </View>
              <Text style={styles.actionLabel}>Expenses & Bills</Text>
            </TouchableOpacity>

            {/* 3. Debt Tracker */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/lending')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="account-clock-outline" size={26} color="#9333EA" />
              </View>
              <Text style={styles.actionLabel}>Debt Tracker</Text>
            </TouchableOpacity>

            {/* 4. Add Loan */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-loan')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="bank-transfer-in" size={26} color="#EF4444" />
              </View>
              <Text style={styles.actionLabel}>Add Loan</Text>
            </TouchableOpacity>

            {/* 5. Stock & Inventory */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/inventory' as any)}>
              <View style={[styles.actionIcon, { backgroundColor: '#fffbe6' }]}>
                <MaterialCommunityIcons name="cube-outline" size={26} color="#d4b106" />
              </View>
              <Text style={styles.actionLabel}>Stock & Inventory</Text>
            </TouchableOpacity>

            {/* 6. Create Cheque */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/write-cheque')}>
              <View style={[styles.actionIcon, { backgroundColor: '#eef2ff' }]}>
                <MaterialCommunityIcons name="checkbook" size={26} color="#4338ca" />
              </View>
              <Text style={styles.actionLabel}>Write Cheque</Text>
            </TouchableOpacity>

            {/* 7. Cash Purchase */}
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/cash-purchase')}>
              <View style={[styles.actionIcon, { backgroundColor: '#ecfdf5' }]}>
                <MaterialCommunityIcons name="cash-minus" size={26} color="#059669" />
              </View>
              <Text style={styles.actionLabel}>Cash Out</Text>

            </TouchableOpacity>
          </View>
          {budgets.map((b: any, i: number) => (
            <BudgetRow
              key={i}
              name={b.category || b.name}
              pct={b.pct ?? (b.budget > 0 ? Math.min(Math.round((b.spent / b.budget) * 100), 100) : 0)}
            />
          ))}
        </View>


        {/* ── SAVINGS GOALS ────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Savings Goals</Text>
            <TouchableOpacity onPress={() => router.push('/financial-goals' as any)}>
              <Text style={s.link}>Manage</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
            {goals.map((g: any, i: number) => {
              const pct = g.targetAmount > 0
                ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100)
                : 0;
              const color = [C.success, C.accent, C.warn, C.primary][i % 4];
              return (
                <TouchableOpacity key={i} style={s.goalCard} onPress={() => router.push('/financial-goals' as any)}>
                  <RingProgress pct={pct} size={85} color={color} />
                  <Text style={s.goalName} numberOfLines={1}>{g.name}</Text>
                  <Text style={s.goalSub}>
                    KES {(g.currentAmount / 1000).toFixed(0)}k / {(g.targetAmount / 1000).toFixed(0)}k




        {/* Pending Cheques Widget */}
        {chequeSummary.count > 0 && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.pendingChequesWidget}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <View style={styles.pendingChequesLeft}>
                <View style={styles.pendingChequesIcon}>
                  <Ionicons name="time-outline" size={24} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingChequesTitle}>Pending Cheques</Text>
                  <Text style={styles.pendingChequesSubtitle}>
                    {chequeSummary.count} {chequeSummary.count === 1 ? 'cheque' : 'cheques'} waiting to clear

                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={[s.goalCard, s.goalAdd]} onPress={() => router.push('/financial-goals' as any)}>
              <View style={s.goalAddIcon}>
                <Ionicons name="add" size={28} color={C.primary} />
              </View>
              <Text style={s.goalName}>Add Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── UPCOMING ALERTS ──────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Upcoming Alerts</Text>
            <TouchableOpacity>
              <Text style={s.link}>View all</Text>
            </TouchableOpacity>
          </View>
          <AlertRow
            icon="flash"
            iconBg="#FFF9E6"
            iconColor={C.warn}
            title="Electricity Bill"
            sub="Due in 3 days · KES 4,200"
            action={{ label: 'Pay Now', onPress: () => router.push('/add-expense' as any) }}
          />
          <View style={{ height: 10 }} />
          <AlertRow
            icon="warning"
            iconBg="#FFF0F0"
            iconColor={C.danger}
            title="Food Budget Low"
            sub="KES 800 remaining"
            arrow
          />
        </View>

        {/* ── RECENT ACTIVITY ──────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions' as any)}>
              <Text style={s.link}>See History</Text>
            </TouchableOpacity>
          </View>
          <View style={s.actList}>
            {recentTx.map((tx: any, i: number, arr: any[]) => (
              <View key={i}>
                <ActivityRow tx={tx} />
                {i < arr.length - 1 && <View style={s.sep} />}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom padding for FAB + tab bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────────────── */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/add-expense' as any)}>
        <Ionicons name="add" size={30} color={C.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 54,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  familyName: { fontSize: 18, fontWeight: '700', color: C.gold },
  bell: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.primary,
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800', color: C.white },

  // Balance card
  balCard: {
    marginHorizontal: 16, marginTop: -2, marginBottom: 20,
    backgroundColor: C.card, borderRadius: 20,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  balLabel: { fontSize: 10, color: C.textLight, letterSpacing: 1.2, fontWeight: '600', marginBottom: 6 },
  balAmount: { fontSize: 32, fontWeight: '800', color: C.text, marginBottom: 10 },
  balStats: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  balStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balStatTxt: { fontSize: 13, fontWeight: '600' },
  budgetMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetMetaLabel: { fontSize: 10, color: C.textLight, letterSpacing: 1, fontWeight: '600' },
  budgetMetaPct: { fontSize: 12, fontWeight: '700', color: C.text },
  trackLg: { height: 8, backgroundColor: C.track, borderRadius: 4, overflow: 'hidden' },
  fillLg: { height: 8, borderRadius: 4 },

  // Section
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  link: { fontSize: 13, fontWeight: '600', color: C.primary },

  // Budget row
  budRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  budRowOver: { borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  budIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center', justifyContent: 'center',
  },
  budTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budName: { fontSize: 14, fontWeight: '600', color: C.text },
  budPct: { fontSize: 13, fontWeight: '700', color: C.textMid },
  trackSm: { height: 6, backgroundColor: C.track, borderRadius: 3, overflow: 'hidden' },
  fillSm: { height: 6, borderRadius: 3 },

  // Goals
  goalCard: {
    width: 130, marginRight: 12, marginHorizontal: 4,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  goalAdd: { justifyContent: 'center', borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', backgroundColor: '#FAFAFA' },
  goalAddIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  goalName: { fontSize: 12, fontWeight: '600', color: C.text, marginTop: 8, textAlign: 'center' },
  goalSub: { fontSize: 11, color: C.textLight, marginTop: 3, textAlign: 'center' },

  // Alerts
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  alertRowWarm: { backgroundColor: '#FFFBF0', borderColor: '#FDE68A' },
  alertRowRed: { backgroundColor: '#FFF5F5', borderColor: '#FECACA' },
  alertIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  alertSub: { fontSize: 12, color: C.textLight },
  alertBtn: {
    backgroundColor: C.accent, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  alertBtnText: { fontSize: 12, fontWeight: '700', color: C.white },

  // Activity
  actList: {
    backgroundColor: C.card, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  actIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actName: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  actDate: { fontSize: 11, color: C.textLight },
  actAmt: { fontSize: 14, fontWeight: '700' },
  sep: { height: 1, backgroundColor: C.border, marginLeft: 72 },

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
