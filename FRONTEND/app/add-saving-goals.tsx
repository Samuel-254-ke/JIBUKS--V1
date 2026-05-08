import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, Modal, SafeAreaView, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

interface FamilyMember {
    id: number;
    name: string;
    email: string;
}

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

const CATEGORIES = [
    { key: 'car',       label: 'Car',       icon: 'car-sport-outline'   as const },
    { key: 'home',      label: 'Home',      icon: 'home-outline'         as const },
    { key: 'education', label: 'Education', icon: 'school-outline'       as const },
    { key: 'travel',    label: 'Travel',    icon: 'airplane-outline'     as const },
    { key: 'business',  label: 'Business',  icon: 'briefcase-outline'    as const },
    { key: 'emergency', label: 'Emergency', icon: 'medkit-outline'       as const },
];

export default function AddSavingGoalsScreen() {
    const router = useRouter();

    // ── logic from family-dreams.tsx ──
    const [goalName, setGoalName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [monthlyContribution, setMonthlyContribution] = useState('');
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    // ── new UI state ──
    const [category, setCategory] = useState('car');
    const [showCatModal, setShowCatModal] = useState(false);

    useEffect(() => {
        loadFamilyMembers();
    }, []);

    const loadFamilyMembers = async () => {
        try {
            const family = await apiService.getFamily();
            if (family && family.users) {
                setFamilyMembers(family.users);
            }
        } catch (e) {
            console.error('Failed to load family members:', e);
        }
    };

    const updateAmount = (value: string, setter: (v: string) => void) => {
        const numeric = value.replace(/[^0-9]/g, '');
        setter(numeric);
    };

    const toggleMember = (id: number) => {
        setSelectedMembers((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const handleCreateGoal = async () => {
        if (!goalName.trim()) {
            Alert.alert('Missing Info', 'Please enter a goal name.');
            return;
        }
        if (!monthlyContribution.trim()) {
            Alert.alert('Missing Info', 'Please enter a monthly contribution amount.');
            return;
        }
        try {
            setLoading(true);
            await apiService.createGoal({
                name: goalName,
                targetAmount: parseFloat(targetAmount),
                targetDate: targetDate,
                monthlyContribution: parseFloat(monthlyContribution),
                category,
                assignedUserIds: selectedMembers.length > 0 ? selectedMembers : undefined,
            });

            setGoalName('');
            setTargetAmount('');
            setTargetDate('');
            setMonthlyContribution('');
            setSelectedMembers([]);
            setCategory('car');

            router.push('/goal-success' as any);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to create goal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const activeCat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* ── NAVY HEADER ── */}
            <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                <SafeAreaView>
                    <View style={s.headerRow}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={20} color={C.gold} />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>ADD SAVING GOALS</Text>
                        <View style={s.greenDot} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* ── WHITE CARD ── */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView style={s.card} showsVerticalScrollIndicator={false} contentContainerStyle={s.cardContent}>

                    {/* Goal Name */}
                    <Text style={s.label}>Goal Name</Text>
                    <TextInput
                        style={s.input}
                        placeholder="Enter the goal name"
                        placeholderTextColor="#D1D5DB"
                        value={goalName}
                        onChangeText={setGoalName}
                    />

                    {/* Target Amount */}
                    <Text style={s.label}>Target Amount</Text>
                    <TextInput
                        style={s.input}
                        placeholder="Enter the target amount"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="numeric"
                        value={targetAmount ? `KES ${targetAmount}` : ''}
                        onChangeText={(t) => updateAmount(t, setTargetAmount)}
                    />

                    {/* Target Date */}
                    <Text style={s.label}>Target  Date</Text>
                    <TextInput
                        style={s.input}
                        placeholder="December 2026"
                        placeholderTextColor="#D1D5DB"
                        value={targetDate}
                        onChangeText={setTargetDate}
                    />

                    {/* Monthly Contribution */}
                    <Text style={s.label}>Monthly  contribution</Text>
                    <TextInput
                        style={s.input}
                        placeholder="KES 20 000"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="numeric"
                        value={monthlyContribution ? `KES ${monthlyContribution}` : ''}
                        onChangeText={(t) => updateAmount(t, setMonthlyContribution)}
                    />

                    {/* Goal Category */}
                    <Text style={s.label}>Goal Category</Text>
                    <View style={s.catRow}>
                        <TouchableOpacity style={s.catDropdown} onPress={() => setShowCatModal(true)} activeOpacity={0.8}>
                            <Ionicons name={activeCat.icon} size={20} color={C.navy} />
                            <Text style={s.catDropdownTxt}>{activeCat.label}</Text>
                            <Ionicons name="chevron-down" size={16} color={C.sub} />
                        </TouchableOpacity>
                        <View style={s.catIconPreview}>
                            <View style={s.catIconCircle}>
                                <Ionicons name={activeCat.icon} size={22} color={C.navy} />
                            </View>
                            <TouchableOpacity style={s.editIcon} onPress={() => setShowCatModal(true)}>
                                <Ionicons name="pencil" size={12} color={C.white} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contributors */}
                    {familyMembers.length > 0 && (
                        <>
                            <Text style={[s.label, { marginTop: 8 }]}>Contributors</Text>
                            {familyMembers.map((member) => {
                                const selected = selectedMembers.includes(member.id);
                                return (
                                    <TouchableOpacity key={member.id} style={s.memberRow} onPress={() => toggleMember(member.id)} activeOpacity={0.7}>
                                        <View style={[s.radio, selected && s.radioSelected]}>
                                            {selected && <View style={s.radioDot} />}
                                        </View>
                                        <Text style={s.memberName}>{member.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}

                    {/* Create Goal Button */}
                    <TouchableOpacity style={[s.createBtn, loading && { opacity: 0.7 }]} onPress={handleCreateGoal} disabled={loading} activeOpacity={0.85}>
                        {loading ? <ActivityIndicator color={C.white} /> : <Text style={s.createBtnTxt}>Create Goal</Text>}
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={s.footer}>
                        <Text style={s.footerTxt}>Powered by </Text>
                        <Text style={s.footerBrand}>Apbc 🌍</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── CATEGORY MODAL ── */}
            <Modal visible={showCatModal} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modal}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Goal Category</Text>
                            <TouchableOpacity onPress={() => setShowCatModal(false)}>
                                <Ionicons name="close" size={22} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity key={cat.key} style={s.catItem} onPress={() => { setCategory(cat.key); setShowCatModal(false); }}>
                                <View style={[s.catItemIcon, category === cat.key && { borderColor: C.gold }]}>
                                    <Ionicons name={cat.icon} size={20} color={category === cat.key ? C.gold : C.sub} />
                                </View>
                                <Text style={[s.catItemTxt, category === cat.key && { color: C.navy, fontWeight: '700' }]}>{cat.label}</Text>
                                {category === cat.key && <Ionicons name="checkmark-circle" size={20} color={C.gold} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.navy },
    header: { paddingBottom: 0, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 18 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.gold, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    greenDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E' },
    card: { flex: 1, backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -1 },
    cardContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
    label: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.text, marginBottom: 20 },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    catDropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
    catDropdownTxt: { flex: 1, fontSize: 15, color: C.text },
    catIconPreview: { position: 'relative' },
    catIconCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, borderColor: C.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB' },
    editIcon: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
    radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.border, marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
    radioSelected: { borderColor: C.navy },
    radioDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: C.navy },
    memberName: { fontSize: 15, color: C.text },
    createBtn: { backgroundColor: C.navy, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 20 },
    createBtnTxt: { color: C.white, fontSize: 17, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerTxt: { fontSize: 12, color: C.sub },
    footerBrand: { fontSize: 12, fontWeight: '700', color: C.navy },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: C.text },
    catItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
    catItemIcon: { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    catItemTxt: { flex: 1, fontSize: 15, color: C.sub },
});
