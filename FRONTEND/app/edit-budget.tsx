import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, TextInput, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiService from '@/services/api';

const C = {
    navy: '#1a3a8f', navyDark: '#0e2470', gold: '#F59E0B',
    bg: '#F5F7FA', white: '#ffffff', text: '#1F2937',
    sub: '#6B7280', border: '#E5E7EB', green: '#22C55E', red: '#EF4444',
};

const CATEGORIES = [
    { key: 'food',          label: 'Food & Groceries', icon: 'restaurant'      as const },
    { key: 'transport',     label: 'Transport',        icon: 'car'             as const },
    { key: 'housing',       label: 'Housing',          icon: 'home'            as const },
    { key: 'education',     label: 'Education',        icon: 'school'          as const },
    { key: 'entertainment', label: 'Entertainment',    icon: 'game-controller' as const },
    { key: 'healthcare',    label: 'Healthcare',       icon: 'medkit'          as const },
    { key: 'clothing',      label: 'Clothing',         icon: 'shirt'           as const },
    { key: 'savings',       label: 'Savings',          icon: 'save'            as const },
];

export default function EditBudgetScreen() {
    const router = useRouter();
    const { budgetId } = useLocalSearchParams<{ budgetId: string }>();

    const [budget, setBudget] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // form state
    const [limit, setLimit] = useState('');
    const [alertAt80, setAlertAt80] = useState(true);
    const [alertExceeded, setAlertExceeded] = useState(true);
    const [showCatModal, setShowCatModal] = useState(false);
    const [selectedCat, setSelectedCat] = useState('food');

    useEffect(() => { if (budgetId) loadBudget(); }, [budgetId]);

    const loadBudget = async () => {
        try {
            const all = await apiService.getFamilyBudgets();
            const found = all.find((b: any) => b.id.toString() === budgetId);
            if (found) {
                setBudget(found);
                setLimit(found.limit?.toString() || '');
                setAlertAt80(found.alertAt80 ?? true);
                setAlertExceeded(found.alertExceeded ?? true);
                setSelectedCat(found.category || 'food');
            }
        } catch (e) {
            console.error('Failed to load budget:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!limit || parseFloat(limit) <= 0) {
            Alert.alert('Invalid Limit', 'Please enter a valid monthly limit.');
            return;
        }
        try {
            setSaving(true);
            await apiService.updateFamilyBudget(budgetId!, {
                category: selectedCat,
                limit: parseFloat(limit),
                alertAt80,
                alertExceeded,
            });
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e?.error || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const catInfo = CATEGORIES.find(c => c.key === selectedCat) || CATEGORIES[0];
    const spent = Number(budget?.spent) || 0;
    const lim = parseFloat(limit) || Number(budget?.limit) || 0;
    const remaining = Math.max(lim - spent, 0);
    const pct = lim > 0 ? Math.min(Math.round((spent / lim) * 100), 100) : 0;

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
                            <Text style={s.headerTitle}>EDIT BUDGET</Text>
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
                        <Text style={s.headerTitle}>EDIT BUDGET</Text>
                        <View style={{ width: 36 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* CATEGORY SELECTOR */}
                <View style={s.card}>
                    <Text style={s.fieldLabel}>Category</Text>
                    <TouchableOpacity style={s.catDropdown} onPress={() => setShowCatModal(true)} activeOpacity={0.8}>
                        <Ionicons name={catInfo.icon} size={20} color={C.navy} />
                        <Text style={s.catDropdownTxt}>{catInfo.label}</Text>
                        <Ionicons name="chevron-down" size={16} color={C.sub} />
                    </TouchableOpacity>
                </View>

                {/* SPENDING SUMMARY */}
                <View style={s.card}>
                    <View style={s.spendRow}>
                        <View>
                            <Text style={s.spendHeader}>Current Spending</Text>
                            <Text style={s.spendValue}>KES {spent.toLocaleString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={s.spendHeader}>Remaining</Text>
                            <Text style={[s.spendValue, { color: C.gold }]}>KES {remaining.toLocaleString()}</Text>
                        </View>
                    </View>
                    <View style={s.pctRow}>
                        <Text style={s.pctTxt}>Spent: {pct}%</Text>
                        <Text style={s.pctTxt}>Limit: KES {lim.toLocaleString()}</Text>
                    </View>
                    <View style={s.progressBg}>
                        <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: pct >= 100 ? C.red : C.navy }]} />
                    </View>
                    <View style={s.infoBox}>
                        <Ionicons name="information-circle" size={16} color={C.navy} />
                        <Text style={s.infoTxt}>
                            You have spent {pct}% of your {catInfo.label.split(' ')[0].toLowerCase()} budget this month.
                        </Text>
                    </View>
                </View>

                {/* MONTHLY LIMIT */}
                <View style={s.card}>
                    <Text style={s.fieldLabel}>Monthly Limit</Text>
                    <View style={s.limitRow}>
                        <Text style={s.limitKes}>KES</Text>
                        <TextInput
                            style={s.limitInput}
                            value={limit}
                            onChangeText={(t) => setLimit(t.replace(/[^0-9]/g, ''))}
                            keyboardType="numeric"
                            placeholder="20,000"
                            placeholderTextColor="#CBD5E1"
                        />
                    </View>
                </View>

                {/* NOTIFICATIONS */}
                <View style={s.card}>
                    <Text style={s.notifLabel}>NOTIFICATIONS</Text>
                    <View style={s.toggleRow}>
                        <View style={s.toggleIcon}>
                            <Ionicons name="notifications" size={20} color={C.gold} />
                        </View>
                        <Text style={s.toggleTxt}>Alert at 80% usage</Text>
                        <Switch
                            value={alertAt80}
                            onValueChange={setAlertAt80}
                            trackColor={{ false: '#E5E7EB', true: C.gold }}
                            thumbColor={C.white}
                        />
                    </View>
                    <View style={[s.toggleRow, { marginBottom: 0 }]}>
                        <View style={[s.toggleIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Ionicons name="warning" size={20} color={C.red} />
                        </View>
                        <Text style={s.toggleTxt}>Alert when exceeded</Text>
                        <Switch
                            value={alertExceeded}
                            onValueChange={setAlertExceeded}
                            trackColor={{ false: '#E5E7EB', true: C.gold }}
                            thumbColor={C.white}
                        />
                    </View>
                </View>

                {/* ACTIONS */}
                <View style={s.btnRow}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
                        <Text style={s.cancelTxt}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                        {saving ? <ActivityIndicator color={C.white} /> : <Text style={s.saveTxt}>Save</Text>}
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* CATEGORY MODAL */}
            {showCatModal && (
                <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowCatModal(false)}>
                    <View style={s.modal}>
                        <Text style={s.modalTitle}>Select Category</Text>
                        {CATEGORIES.map((c) => (
                            <TouchableOpacity key={c.key} style={s.modalItem}
                                onPress={() => { setSelectedCat(c.key); setShowCatModal(false); }}>
                                <Ionicons name={c.icon} size={20} color={selectedCat === c.key ? C.gold : C.sub} />
                                <Text style={[s.modalItemTxt, selectedCat === c.key && { color: C.navy, fontWeight: '700' }]}>{c.label}</Text>
                                {selectedCat === c.key && <Ionicons name="checkmark-circle" size={18} color={C.gold} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: { paddingBottom: 16, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.gold, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    scroll: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: C.white, borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10 },
    catDropdown: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
    catDropdownTxt: { flex: 1, fontSize: 15, color: C.text },
    spendRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    spendHeader: { fontSize: 12, color: C.sub, marginBottom: 4 },
    spendValue: { fontSize: 20, fontWeight: '800', color: C.text },
    pctRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    pctTxt: { fontSize: 12, color: C.sub, fontWeight: '600' },
    progressBg: { height: 7, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
    progressFill: { height: '100%', borderRadius: 4 },
    infoBox: { flexDirection: 'row', gap: 8, backgroundColor: '#EEF2FF', padding: 12, borderRadius: 10, alignItems: 'flex-start' },
    infoTxt: { flex: 1, fontSize: 13, color: C.navy, lineHeight: 18 },
    limitRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
    limitKes: { fontSize: 16, fontWeight: '600', color: C.sub },
    limitInput: { flex: 1, fontSize: 20, fontWeight: '700', color: C.text },
    notifLabel: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 14 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    toggleIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center' },
    toggleTxt: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 28, paddingVertical: 15, alignItems: 'center' },
    cancelTxt: { fontSize: 16, fontWeight: '600', color: C.text },
    saveBtn: { flex: 1, backgroundColor: C.gold, borderRadius: 28, paddingVertical: 15, alignItems: 'center' },
    saveTxt: { fontSize: 16, fontWeight: '700', color: C.white },
    modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 16 },
    modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
    modalItemTxt: { flex: 1, fontSize: 15, color: C.sub },
});
