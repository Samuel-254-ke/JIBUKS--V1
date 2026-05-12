import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, TextInput, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

const C = {
    navy: '#1a3a8f', navyDark: '#0e2470', gold: '#F59E0B',
    bg: '#F5F7FA', white: '#ffffff', text: '#1F2937',
    sub: '#6B7280', border: '#E5E7EB',
};

const CATEGORIES = [
    { key: 'food',          label: 'Food',          icon: 'restaurant'      as const, color: '#FF6B6B', bg: '#FFF0F0' },
    { key: 'transport',     label: 'Transport',     icon: 'car'             as const, color: '#4ECDC4', bg: '#F0FAFA' },
    { key: 'housing',       label: 'Housing',       icon: 'home'            as const, color: '#3B82F6', bg: '#EFF6FF' },
    { key: 'education',     label: 'Education',     icon: 'school'          as const, color: '#8B5CF6', bg: '#F5F3FF' },
    { key: 'entertainment', label: 'Entertainment', icon: 'game-controller' as const, color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'healthcare',    label: 'Healthcare',    icon: 'medkit'          as const, color: '#10B981', bg: '#ECFDF5' },
    { key: 'clothing',      label: 'Clothing',      icon: 'shirt'           as const, color: '#EC4899', bg: '#FDF2F8' },
    { key: 'savings',       label: 'Savings',       icon: 'save'            as const, color: '#6366F1', bg: '#EEF2FF' },
];

export default function AddBudgetCategoryScreen() {
    const router = useRouter();

    const [selectedCat, setSelectedCat] = useState('food');
    const [limit, setLimit] = useState('20000');
    const [budgetType, setBudgetType] = useState<'monthly' | 'flexible'>('monthly');
    const [alertAt80, setAlertAt80] = useState(true);
    const [alertExceeded, setAlertExceeded] = useState(true);
    const [saving, setSaving] = useState(false);

    const activeCat = CATEGORIES.find(c => c.key === selectedCat) || CATEGORIES[0];
    const limitNum = parseFloat(limit) || 0;
    const previewSpent = Math.round(limitNum * 0.8);
    const previewPct = limitNum > 0 ? Math.round((previewSpent / limitNum) * 100) : 0;

    const handleCreate = async () => {
        if (!limit || limitNum <= 0) {
            Alert.alert('Invalid Limit', 'Please enter a valid monthly limit.');
            return;
        }
        try {
            setSaving(true);
            await apiService.createFamilyBudget({
                category: selectedCat,
                label: activeCat.label,
                icon: activeCat.icon,
                color: activeCat.color,
                limit: limitNum,
                type: budgetType,
                alertAt80,
                alertExceeded,
            });
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e?.error || 'Failed to create budget. Please try again.');
        } finally {
            setSaving(false);
        }
    };

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
                        <Text style={s.headerTitle}>ADD BUDGET CATEGORY</Text>
                        <View style={{ width: 36 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* ICON DISPLAY */}
                <View style={s.iconSection}>
                    <View style={[s.bigIconCircle, { backgroundColor: activeCat.bg, borderColor: activeCat.color }]}>
                        <Ionicons name={activeCat.icon} size={42} color={activeCat.color} />
                    </View>
                    <Text style={s.changeIconTxt}>Change Icon</Text>
                </View>

                {/* ICON SELECTOR ROW */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.iconScroll} contentContainerStyle={s.iconScrollContent}>
                    {CATEGORIES.map((cat) => {
                        const active = cat.key === selectedCat;
                        return (
                            <TouchableOpacity key={cat.key} style={[s.iconChip, active && { borderColor: C.gold, backgroundColor: '#FFFBEB' }]}
                                onPress={() => setSelectedCat(cat.key)} activeOpacity={0.8}>
                                <Ionicons name={cat.icon} size={22} color={active ? C.gold : cat.color} />
                                <Text style={[s.iconChipLabel, active && { color: C.gold, fontWeight: '700' }]}>{cat.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

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

                {/* BUDGET TYPE */}
                <View style={s.card}>
                    <Text style={s.fieldLabel}>Budget Type</Text>
                    <View style={s.typeRow}>
                        <TouchableOpacity style={[s.typeBtn, budgetType === 'monthly' && s.typeBtnActive]}
                            onPress={() => setBudgetType('monthly')} activeOpacity={0.8}>
                            <Text style={[s.typeBtnTxt, budgetType === 'monthly' && s.typeBtnTxtActive]}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.typeBtn, budgetType === 'flexible' && s.typeBtnActive]}
                            onPress={() => setBudgetType('flexible')} activeOpacity={0.8}>
                            <Text style={[s.typeBtnTxt, budgetType === 'flexible' && s.typeBtnTxtActive]}>Flexible</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ALERTS */}
                <View style={s.card}>
                    <View style={s.alertRow}>
                        <View style={s.alertText}>
                            <Text style={s.alertTitle}>Alert at 80% usage</Text>
                            <Text style={s.alertSub}>Notify family when limit is near</Text>
                        </View>
                        <Switch value={alertAt80} onValueChange={setAlertAt80}
                            trackColor={{ false: '#E5E7EB', true: C.gold }} thumbColor={C.white} />
                    </View>
                    <View style={[s.alertRow, { marginBottom: 0 }]}>
                        <View style={s.alertText}>
                            <Text style={s.alertTitle}>Budget exceeded alert</Text>
                            <Text style={s.alertSub}>Critical alert for overspending</Text>
                        </View>
                        <Switch value={alertExceeded} onValueChange={setAlertExceeded}
                            trackColor={{ false: '#E5E7EB', true: C.gold }} thumbColor={C.white} />
                    </View>
                </View>

                {/* PREVIEW */}
                <View style={s.card}>
                    <Text style={s.previewLabel}>PREVIEW</Text>
                    <View style={s.previewRow}>
                        <View style={[s.previewIcon, { backgroundColor: activeCat.bg }]}>
                            <Ionicons name={activeCat.icon} size={18} color={activeCat.color} />
                        </View>
                        <Text style={s.previewName}>{activeCat.label} Budget</Text>
                        <Text style={s.previewAmounts}>KES {previewSpent.toLocaleString()} / {limitNum.toLocaleString()}</Text>
                    </View>
                    <View style={s.previewProgressBg}>
                        <View style={[s.previewProgressFill, { width: `${previewPct}%` as any, backgroundColor: activeCat.color }]} />
                    </View>
                    <Text style={s.previewHint}>This is how your family will see this budget category</Text>
                </View>

                {/* ACTIONS */}
                <View style={s.btnRow}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
                        <Text style={s.cancelTxt}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.createBtn, saving && { opacity: 0.7 }]}
                        onPress={handleCreate} disabled={saving} activeOpacity={0.85}>
                        {saving ? <ActivityIndicator color={C.white} /> : <Text style={s.createTxt}>Create Budget</Text>}
                    </TouchableOpacity>
                </View>

                {/* FOOTER */}
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
    header: { paddingBottom: 16, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.gold, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
    scroll: { padding: 16, paddingBottom: 40 },
    iconSection: { alignItems: 'center', marginBottom: 16 },
    bigIconCircle: { width: 86, height: 86, borderRadius: 43, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    changeIconTxt: { fontSize: 13, fontWeight: '700', color: C.gold },
    iconScroll: { marginBottom: 14 },
    iconScrollContent: { paddingHorizontal: 4, gap: 8 },
    iconChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, minWidth: 72, gap: 5 },
    iconChipLabel: { fontSize: 11, color: C.sub, fontWeight: '600' },
    card: { backgroundColor: C.white, borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 10 },
    limitRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
    limitKes: { fontSize: 16, fontWeight: '600', color: C.sub },
    limitInput: { flex: 1, fontSize: 20, fontWeight: '700', color: C.text },
    typeRow: { flexDirection: 'row', gap: 12 },
    typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
    typeBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
    typeBtnTxt: { fontSize: 15, fontWeight: '600', color: C.sub },
    typeBtnTxtActive: { color: C.white },
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    alertText: { flex: 1 },
    alertTitle: { fontSize: 15, fontWeight: '600', color: C.text },
    alertSub: { fontSize: 12, color: C.sub, marginTop: 2 },
    previewLabel: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 12 },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    previewIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    previewName: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
    previewAmounts: { fontSize: 13, color: C.sub, fontWeight: '600' },
    previewProgressBg: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    previewProgressFill: { height: '100%', borderRadius: 3 },
    previewHint: { fontSize: 12, color: C.sub, textAlign: 'center' },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 16 },
    cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 28, paddingVertical: 15, alignItems: 'center' },
    cancelTxt: { fontSize: 15, fontWeight: '600', color: C.text },
    createBtn: { flex: 1, backgroundColor: C.gold, borderRadius: 28, paddingVertical: 15, alignItems: 'center' },
    createTxt: { fontSize: 15, fontWeight: '700', color: C.white },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerTxt: { fontSize: 12, color: C.sub },
    footerBrand: { fontSize: 12, fontWeight: '700', color: C.navy },
});
