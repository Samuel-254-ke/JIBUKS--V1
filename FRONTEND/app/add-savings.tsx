import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

const C = {
    navy: '#1a3a8f',
    navyDark: '#0e2470',
    gold: '#F59E0B',
    bg: '#F5F7FA',
    white: '#ffffff',
    text: '#1F2937',
    sub: '#6B7280',
    border: '#E5E7EB',
    goldLight: '#FFFBEB',
};

export default function AddSavingsScreen() {
    const router = useRouter();
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [streak, setStreak] = useState(4);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            setLoading(false);
            const data = await apiService.getGoals();
            setGoals(data || []);
        } catch {
            setGoals([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTopUpGoal = () => {
        if (goals.length === 1) {
            router.push({ pathname: '/add-to-goal', params: { goalId: goals[0].id.toString() } } as any);
        } else {
            router.push('/financial-goals' as any);
        }
    };

    const handleContributeGroup = () => {
        router.push('/contribute-group' as any);
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* ── HEADER ── */}
            <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                <SafeAreaView>
                    <View style={s.headerRow}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color={C.gold} />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>Add to Savings</Text>
                        <View style={{ width: 38 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* ── INTRO ── */}
                <View style={s.introWrap}>
                    <View style={s.pigWrap}>
                        <Ionicons name="wallet" size={34} color={C.navy} />
                    </View>
                    <Text style={s.introTitle}>How would you like to save?</Text>
                    <Text style={s.introSub}>
                        Select where you want to add your funds.{'\n'}Your progress helps you reach financial freedom faster.
                    </Text>
                </View>

                {/* ── OPTION 1: TOP UP GOAL ── */}
                <TouchableOpacity style={s.optionCard} onPress={handleTopUpGoal} activeOpacity={0.85}>
                    <View style={s.optionIconWrap}>
                        <Ionicons name="trending-up" size={28} color={C.navy} />
                    </View>
                    <View style={s.optionText}>
                        <Text style={s.optionTitle}>Top Up Goal</Text>
                        <Text style={s.optionSub}>Add money to your personal goal</Text>
                        <Text style={s.optionBadge}>PERSONAL SAVINGS</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={C.sub} />
                </TouchableOpacity>

                {/* ── OPTION 2: CONTRIBUTE TO GROUP ── */}
                <TouchableOpacity style={s.optionCard} onPress={handleContributeGroup} activeOpacity={0.85}>
                    <View style={[s.optionIconWrap, { backgroundColor: '#FFF7ED' }]}>
                        <Ionicons name="people" size={28} color={C.gold} />
                    </View>
                    <View style={s.optionText}>
                        <Text style={s.optionTitle}>Contribute to Group</Text>
                        <Text style={s.optionSub}>Add money to your chama</Text>
                        <Text style={[s.optionBadge, { color: C.gold }]}>SHARED WEALTH</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={C.sub} />
                </TouchableOpacity>

                {/* ── ACTIVE STREAK ── */}
                <View style={s.streakCard}>
                    <View style={s.streakIconWrap}>
                        <Ionicons name="flash" size={20} color={C.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.streakLabel}>ACTIVE STREAK</Text>
                        <Text style={s.streakText}>
                            You've saved for {streak} consecutive weeks. Keep it up!
                        </Text>
                    </View>
                </View>

                {/* ── FOOTER ── */}
                <View style={s.footer}>
                    <Text style={s.footerTxt}>Powered by </Text>
                    <Text style={s.footerBrand}>Apbc 🌍</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { paddingBottom: 20, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.gold, fontSize: 18, fontWeight: '700' },
    scroll: { padding: 20, paddingBottom: 40 },
    introWrap: { alignItems: 'center', marginBottom: 28, paddingTop: 8 },
    pigWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    introTitle: { fontSize: 20, fontWeight: '700', color: C.navy, textAlign: 'center', marginBottom: 8 },
    introSub: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 20 },
    optionCard: { backgroundColor: C.white, borderRadius: 16, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2, gap: 14 },
    optionIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    optionText: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 2 },
    optionSub: { fontSize: 13, color: C.sub, marginBottom: 6 },
    optionBadge: { fontSize: 11, fontWeight: '700', color: C.navy, letterSpacing: 0.5 },
    streakCard: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#FDE68A' },
    streakIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
    streakLabel: { fontSize: 10, fontWeight: '700', color: C.gold, letterSpacing: 0.5 },
    streakText: { fontSize: 13, color: '#92400E', marginTop: 2 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 8 },
    footerTxt: { fontSize: 12, color: C.sub },
    footerBrand: { fontSize: 12, fontWeight: '700', color: C.navy },
});
