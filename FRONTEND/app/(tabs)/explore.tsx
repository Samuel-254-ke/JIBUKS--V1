import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { confirmAndLogout } from '@/utils/logout';
import { LinearGradient } from 'expo-linear-gradient';
import FABMenu from '@/components/FABMenu';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary: '#1a3a8f',
  primaryDark: '#0e2470',
  accent: '#F97316',
  gold: '#FFAA00',
  white: '#ffffff',
  bg: '#F5F7FA',
  card: '#ffffff',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
};

// ─── Menu sections matching Figma ─────────────────────────────────────────────
const SECTIONS = [
  {
    label: 'FAMILY',
    items: [
      {
        icon: 'people', iconBg: '#EEF2FF', iconColor: '#4F46E5',
        title: 'Family Members', sub: 'Manage family members and roles',
        route: '/family-settings',
      },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      {
        icon: 'people-circle', iconBg: '#F0FDF4', iconColor: '#16A34A',
        title: 'Groups (Chama)', sub: 'Track contributions and group savings',
        route: '/groups',
      },
    ],
  },
  {
    label: 'PLANNING',
    items: [
      {
        icon: 'wallet', iconBg: '#FFF7ED', iconColor: '#F97316',
        title: 'Budgets', sub: 'Set and manage monthly budgets',
        route: '/budget-categories',
      },
      {
        icon: 'refresh-circle', iconBg: '#EEF2FF', iconColor: '#7C3AED',
        title: 'Recurring Payments', sub: 'Automate regular expenses',
        route: '/manage',
      },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      {
        icon: 'pie-chart', iconBg: '#EFF6FF', iconColor: '#3B82F6',
        title: 'Reports', sub: 'Spending breakdown and smart insights',
        route: '/reports',
      },
      {
        icon: 'trending-up', iconBg: '#F0FDF4', iconColor: '#16A34A',
        title: 'Net Worth', sub: 'Track assets and liabilities',
        route: '/manage',
      },
    ],
  },
  {
    label: 'CONNECTIONS',
    items: [
      {
        icon: 'phone-portrait', iconBg: '#F0FDF4', iconColor: '#16A34A',
        title: 'M-Pesa', sub: 'Connect and manage mobile money',
        route: '/banking',
      },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      {
        icon: 'settings', iconBg: '#F5F5F5', iconColor: '#6B7280',
        title: 'Settings', sub: 'App preferences and account settings',
        route: '/manage',
      },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    confirmAndLogout(logout, (path) => router.replace(path as any));
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ── HEADER ── */}
      <LinearGradient colors={[C.primary, C.primaryDark]} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.gold} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>MORE</Text>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Ionicons name="person" size={18} color={C.white} />
            </View>
            <View style={s.onlineDot} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ── SECTIONS ── */}
        {SECTIONS.map((section, si) => (
          <View key={si} style={s.sectionBlock}>
            <Text style={s.sectionLabel}>{section.label}</Text>
            <View style={s.card}>
              {section.items.map((item, ii) => (
                <View key={ii}>
                  <TouchableOpacity
                    style={s.row}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={[s.iconCircle, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                    </View>
                    <View style={s.rowText}>
                      <Text style={s.rowTitle}>{item.title}</Text>
                      <Text style={s.rowSub}>{item.sub}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={C.textLight} />
                  </TouchableOpacity>
                  {ii < section.items.length - 1 && <View style={s.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── LOGOUT ── */}
        <View style={s.sectionBlock}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={s.logoutTxt}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <FABMenu />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 20 },

  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17, fontWeight: '800', color: C.gold, letterSpacing: 2,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2, borderColor: C.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5, borderColor: C.primary,
  },

  sectionBlock: { paddingHorizontal: 16, marginTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: C.textLight,
    letterSpacing: 1.2, marginBottom: 8,
  },
  card: {
    backgroundColor: C.card, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 14,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 2 },
  rowSub: { fontSize: 12, color: C.textLight },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 72 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FFF5F5',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutTxt: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

});
