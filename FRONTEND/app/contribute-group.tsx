import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
};

// ── Circular ring (View-based, no SVG) ────────────────────────────────────
function ProgressRing({ pct, color = C.navy, size = 60, thickness = 6 }: { pct: number; color?: string; size?: number; thickness?: number }) {
    const p = Math.min(Math.max(pct, 0), 100);
    const half = size / 2;
    const rightAngle = Math.min(p, 50) / 50 * 180;
    const leftAngle  = p > 50 ? (p - 50) / 50 * 180 : 0;
    return (
        <View style={{ width: size, height: size }}>
            <View style={{ position: 'absolute', width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: '#E8ECF0' }} />
            <View style={{ position: 'absolute', width: half, height: size, right: 0, overflow: 'hidden' }}>
                <View style={{ width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: 'transparent', borderRightColor: color, borderTopColor: rightAngle > 90 ? color : 'transparent', position: 'absolute', right: 0, transform: [{ rotate: `${rightAngle - 180}deg` }] }} />
            </View>
            {p > 50 && (
                <View style={{ position: 'absolute', width: half, height: size, left: 0, overflow: 'hidden' }}>
                    <View style={{ width: size, height: size, borderRadius: half, borderWidth: thickness, borderColor: 'transparent', borderLeftColor: color, borderBottomColor: leftAngle > 90 ? color : 'transparent', position: 'absolute', left: 0, transform: [{ rotate: `${leftAngle}deg` }] }} />
                </View>
            )}
            <View style={{ position: 'absolute', margin: thickness, width: size - thickness * 2, height: size - thickness * 2, borderRadius: half - thickness, backgroundColor: C.white }} />
            <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: size * 0.22, fontWeight: '800', color }}>{p}%</Text>
            </View>
        </View>
    );
}

const QUICK_CHIPS = [500, 1000, 2000];

const PAYMENT_METHODS = [
    { key: 'mpesa',     label: 'M-Pesa',     sub: 'Direct from mobile money', icon: 'phone-portrait', iconBg: '#DCFCE7', iconColor: '#16A34A' },
    { key: 'pettycash', label: 'Petty Cash',  sub: 'Balance: KES 12,450.00',   icon: 'wallet',         iconBg: '#EEF2FF', iconColor: '#4F46E5' },
];

export default function ContributeGroupScreen() {
    const router = useRouter();
    const { groupId } = useLocalSearchParams<{ groupId: string }>();

    const [group, setGroup]       = useState<any>(null);
    const [loading, setLoading]   = useState(true);
    const [amount, setAmount]     = useState('5000');
    const [method, setMethod]     = useState('mpesa');
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        try {
            const g = await apiService.getGroupDetails(groupId!);
            setGroup(g);
        } catch (e) { console.error('contribute-group load:', e); }
        finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { if (groupId) load(); }, [groupId]));

    const handleSubmit = async () => {
        const num = parseFloat(amount);
        if (!num || num <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.'); return; }
        try {
            setSubmitting(true);
            await apiService.contributeToGroupSavings(groupId!, { amount: num, method });
            Alert.alert('Success! 🎉', `KES ${num.toLocaleString()} contribution recorded.`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e?.error || 'Failed to record contribution.');
        } finally {
            setSubmitting(false);
        }
    };

    const pct = group?.target > 0 ? Math.round((group.saved / group.target) * 100) : 0;

    if (loading) {
        return (
            <View style={s.root}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                    <SafeAreaView><View style={s.headerRow}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color={C.gold} /></TouchableOpacity>
                        <Text style={s.headerTitle}>Contribute</Text>
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
                    <Text style={s.headerTitle}>Contribute</Text>
                    <View style={{ width: 36 }} />
                </View></SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* GROUP INFO CARD */}
                <View style={s.card}>
                    <View style={s.groupRow}>
                        <ProgressRing pct={pct} color={group?.color || C.navy} size={64} thickness={6} />
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={s.groupName}>{group?.name || 'Group'}</Text>
                            <Text style={s.groupSub}>Group Contribution</Text>
                        </View>
                        <View style={s.groupIcon}><Ionicons name="people" size={18} color={C.navy} /></View>
                    </View>
                </View>

                {/* CONTRIBUTION AMOUNT */}
                <View style={s.card}>
                    <Text style={s.sectionLabel}>Contribution Amount</Text>
                    <View style={s.amountRow}>
                        <Text style={s.amountKes}>KES</Text>
                        <TextInput
                            style={s.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="number-pad"
                            placeholder="0"
                            placeholderTextColor="#CBD5E1"
                        />
                    </View>
                    <View style={s.chipRow}>
                        {QUICK_CHIPS.map((c) => (
                            <TouchableOpacity key={c} style={s.chip}
                                onPress={() => setAmount((prev) => String((parseFloat(prev) || 0) + c))}>
                                <Text style={s.chipTxt}>+ KES {c.toLocaleString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* PAYMENT METHOD */}
                <View style={s.card}>
                    <Text style={s.sectionLabel}>Payment Method</Text>
                    {PAYMENT_METHODS.map((pm) => {
                        const active = method === pm.key;
                        return (
                            <TouchableOpacity key={pm.key}
                                style={[s.pmCard, active && s.pmCardActive]}
                                onPress={() => setMethod(pm.key)} activeOpacity={0.8}>
                                <View style={[s.pmIconCircle, { backgroundColor: pm.iconBg }]}>
                                    <Ionicons name={pm.icon as any} size={20} color={pm.iconColor} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.pmLabel}>{pm.label}</Text>
                                    <Text style={s.pmSub}>{pm.sub}</Text>
                                </View>
                                <View style={[s.radioOuter, active && s.radioOuterActive]}>
                                    {active && <View style={s.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* CONTRIBUTE BUTTON */}
                <TouchableOpacity style={[s.contributeBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                    {submitting
                        ? <ActivityIndicator color={C.white} />
                        : (<>
                            <Text style={s.contributeBtnTxt}>Contribute Now</Text>
                            <Ionicons name="chevron-forward" size={18} color={C.white} />
                        </>)
                    }
                </TouchableOpacity>

                <View style={s.captionRow}>
                    <Ionicons name="shield-checkmark" size={13} color={C.sub} />
                    <Text style={s.captionTxt}>CONTRIBUTION WILL BE INSTANTLY RECORDED</Text>
                </View>

                <View style={{ height: 30 }} />
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
    scroll: { padding: 20 },
    card: { backgroundColor: C.white, borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10, elevation: 2 },
    groupRow: { flexDirection: 'row', alignItems: 'center' },
    groupName: { fontSize: 18, fontWeight: '800', color: C.text },
    groupSub: { fontSize: 13, color: C.sub, marginTop: 2 },
    groupIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
    amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 14 },
    amountKes: { fontSize: 20, fontWeight: '600', color: C.sub },
    amountInput: { flex: 1, fontSize: 40, fontWeight: '900', color: C.text },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F1F5F9' },
    chipTxt: { fontSize: 12, fontWeight: '700', color: C.sub },
    pmCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, marginBottom: 10, gap: 12 },
    pmCardActive: { borderColor: C.navy, backgroundColor: '#F8FAFF' },
    pmIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    pmLabel: { fontSize: 15, fontWeight: '700', color: C.text },
    pmSub: { fontSize: 12, color: C.sub, marginTop: 2 },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    radioOuterActive: { borderColor: C.navy },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.navy },
    contributeBtn: { backgroundColor: C.gold, borderRadius: 30, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
    contributeBtnTxt: { color: C.white, fontSize: 17, fontWeight: '800' },
    captionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    captionTxt: { fontSize: 11, color: C.sub, fontWeight: '600', letterSpacing: 0.3 },
});
