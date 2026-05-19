import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  navy: '#1a3a8f', navyDark: '#0e2470', accent: '#F97316', gold: '#F59E0B',
  bg: '#F5F7FA', white: '#ffffff', text: '#1F2937', textMid: '#374151',
  textLight: '#6B7280', border: '#E5E7EB', success: '#22C55E', danger: '#EF4444',
  card: '#ffffff',
};

type Filter = 'ALL' | 'INCOME' | 'EXPENSE';

function txIcon(tx: any): any {
  const desc = (tx.description || tx.category || '').toLowerCase();
  if (tx.type === 'INCOME') return 'arrow-down-circle';
  if (desc.includes('uber') || desc.includes('ride') || desc.includes('transport')) return 'car';
  if (desc.includes('food') || desc.includes('grocery') || desc.includes('super')) return 'cart';
  if (desc.includes('school') || desc.includes('edu')) return 'school';
  if (desc.includes('health') || desc.includes('hospital') || desc.includes('medical')) return 'medical';
  if (desc.includes('util') || desc.includes('electric') || desc.includes('water')) return 'flash';
  return 'receipt';
}

function groupByDate(txs: any[]): { title: string; data: any[] }[] {
  const map = new Map<string, any[]>();
  txs.forEach(tx => {
    const d = new Date(tx.date);
    const key = d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  });
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export default function ActivityScreen() {
  const router = useRouter();
  const [allTx, setAllTx]     = useState<any[]>([]);
  const [filter, setFilter]   = useState<Filter>('ALL');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransactions({ limit: 100 });
      setAllTx(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load transactions:', e);
      setAllTx([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const fmt = (n: number) => `KES ${Number(n).toLocaleString('en-KE')}`;

  const filtered = allTx.filter(tx => {
    if (filter === 'INCOME'  && tx.type !== 'INCOME')  return false;
    if (filter === 'EXPENSE' && tx.type !== 'EXPENSE') return false;
    if (search) {
      const q = search.toLowerCase();
      return (tx.description || '').toLowerCase().includes(q)
          || (tx.category   || '').toLowerCase().includes(q);
    }
    return true;
  });

  const sections = groupByDate(filtered);

  const income   = allTx.filter(t => t.type === 'INCOME' ).reduce((s, t) => s + Number(t.amount), 0);
  const expenses = allTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      {/* ── HEADER ── */}
      <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Activity</Text>
            <Text style={s.headerSub}>{allTx.length} transactions</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/add-expense' as any)}>
            <Ionicons name="add" size={22} color={C.white} />
          </TouchableOpacity>
        </View>

        {/* Income / Expense summary */}
        <View style={s.summaryRow}>
          <View style={s.summaryItem}>
            <View style={s.summaryIcon}>
              <Ionicons name="arrow-down" size={14} color={C.success} />
            </View>
            <View>
              <Text style={s.summaryLabel}>Income</Text>
              <Text style={s.summaryAmt}>{fmt(income)}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.summaryItem}>
            <View style={[s.summaryIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="arrow-up" size={14} color={C.danger} />
            </View>
            <View>
              <Text style={s.summaryLabel}>Expenses</Text>
              <Text style={[s.summaryAmt, { color: C.danger }]}>{fmt(expenses)}</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.summaryItem}>
            <View style={[s.summaryIcon, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
              <Ionicons name="wallet" size={14} color={C.accent} />
            </View>
            <View>
              <Text style={s.summaryLabel}>Net</Text>
              <Text style={[s.summaryAmt, { color: income - expenses >= 0 ? C.success : C.danger }]}>
                {fmt(income - expenses)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── SEARCH + FILTERS ── */}
      <View style={s.controls}>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={16} color={C.textLight} />
          <TextInput
            style={s.searchInput}
            placeholder="Search transactions…"
            placeholderTextColor={C.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={C.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <View style={s.filterRow}>
          {(['ALL', 'INCOME', 'EXPENSE'] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>
                {f === 'ALL' ? 'All' : f === 'INCOME' ? 'Income' : 'Expenses'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── LIST ── */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      ) : sections.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
          <Text style={s.emptyTitle}>No transactions found</Text>
          <Text style={s.emptySub}>
            {allTx.length === 0 ? 'Add your first income or expense' : 'Try a different filter'}
          </Text>
          {allTx.length === 0 && (
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/add-expense' as any)}>
              <Ionicons name="add" size={18} color={C.white} />
              <Text style={s.emptyBtnTxt}>Add Transaction</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, i) => String(item.id ?? i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.navy} />}
          renderSectionHeader={({ section }) => (
            <Text style={s.dateHeader}>{section.title}</Text>
          )}
          renderItem={({ item: tx, index, section }) => {
            const isIncome = tx.type === 'INCOME';
            const amt = Number(tx.amount);
            const label = tx.description || tx.category || 'Transaction';
            const isLast = index === section.data.length - 1;
            return (
              <View style={[s.txRow, !isLast && s.txRowBorder]}>
                <View style={[s.txIcon, { backgroundColor: isIncome ? '#F0FDF4' : '#FEF2F2' }]}>
                  <Ionicons name={txIcon(tx)} size={20} color={isIncome ? C.success : C.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.txLabel} numberOfLines={1}>{label}</Text>
                  <Text style={s.txCategory}>{tx.category || tx.paymentMethod || ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.txAmt, { color: isIncome ? C.success : C.danger }]}>
                    {isIncome ? '+' : '-'}{fmt(amt)}
                  </Text>
                  {tx.user?.name && (
                    <Text style={s.txMember}>{tx.user.name}</Text>
                  )}
                </View>
              </View>
            );
          }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/add-expense' as any)} activeOpacity={0.85}>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: C.gold, fontSize: 20, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  summaryRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.3 },
  summaryAmt: { fontSize: 12, fontWeight: '800', color: C.white },
  divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  controls: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: C.text },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterTxt: { fontSize: 13, fontWeight: '600', color: C.textLight },
  filterTxtActive: { color: C.white },

  list: { paddingHorizontal: 16, paddingBottom: 110 },
  dateHeader: { fontSize: 12, fontWeight: '700', color: C.textLight, letterSpacing: 0.4, marginTop: 16, marginBottom: 6 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 13 },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  txIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  txCategory: { fontSize: 11, color: C.textLight },
  txAmt: { fontSize: 14, fontWeight: '700' },
  txMember: { fontSize: 10, color: C.textLight, marginTop: 2 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 14, color: C.textLight, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.navy, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 13, marginTop: 8 },
  emptyBtnTxt: { color: C.white, fontSize: 15, fontWeight: '700' },

  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 6 },
});
