import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, SafeAreaView, StatusBar, Alert, ActivityIndicator,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import apiService from '@/services/api';

const C = {
    navy: '#1a3a8f', navyDark: '#0e2470', gold: '#F59E0B',
    bg: '#F5F7FA', white: '#ffffff', text: '#1F2937',
    sub: '#6B7280', border: '#E5E7EB',
};

const FREQUENCIES = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'];
const AVATAR_COLORS = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#EDE9FE'];

export default function CreateGroupScreen() {
    const router = useRouter();

    // ── form state ──
    const [groupName, setGroupName]       = useState('');
    const [groupGoal, setGroupGoal]       = useState('');
    const [contribType, setContribType]   = useState<'fixed' | 'flexible'>('fixed');
    const [contribAmount, setContribAmount] = useState('5000');
    const [frequency, setFrequency]       = useState('Monthly');
    const [treasurerName, setTreasurerName] = useState('');
    const [mpesaNumber, setMpesaNumber]   = useState('');

    // ── members state ──
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showFreqModal, setShowFreqModal] = useState(false);
    const [submitting, setSubmitting]     = useState(false);

    useFocusEffect(useCallback(() => {
        apiService.getFamilySettings()
            .then((s) => setFamilyMembers(s.members || []))
            .catch(() => {});
    }, []));

    const toggleMember = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectedMembers = familyMembers.filter((m: any) => selectedIds.has(m.id.toString()));
    const extraCount = Math.max(0, selectedMembers.length - 3);

    const handleCreate = async () => {
        if (!groupName.trim()) { Alert.alert('Missing Info', 'Please enter a group name.'); return; }
        try {
            setSubmitting(true);
            await apiService.createFamilyGroup({
                name: groupName,
                description: groupName,
                target: parseFloat(groupGoal) || 0,
                type: contribType,
            });
            Alert.alert('Group Created! 🎉', `${groupName} is ready.`, [
                { text: 'OK', onPress: () => router.replace('/groups' as any) },
            ]);
        } catch (e: any) {
            Alert.alert('Error', e?.error || 'Failed to create group.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                <SafeAreaView><View style={s.headerRow}>
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={20} color={C.gold} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Create Group</Text>
                    <View style={{ width: 36 }} />
                </View></SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* ── GROUP DETAILS ── */}
                <Text style={s.sectionHeader}>GROUP DETAILS</Text>

                <Text style={s.label}>Group Name</Text>
                <TextInput style={s.input} placeholder="e.g., Umoja Chama" placeholderTextColor="#CBD5E1"
                    value={groupName} onChangeText={setGroupName} />

                <Text style={s.label}>Group Goal <Text style={s.optional}>(Optional)</Text></Text>
                <TextInput style={s.input} placeholder="e.g., KES 300,000" placeholderTextColor="#CBD5E1"
                    keyboardType="number-pad" value={groupGoal} onChangeText={setGroupGoal} />

                {/* ── CONTRIBUTION SETUP ── */}
                <Text style={[s.sectionHeader, { marginTop: 10 }]}>CONTRIBUTION SETUP</Text>

                <Text style={s.label}>Contribution Type</Text>
                <View style={s.toggleRow}>
                    {(['fixed', 'flexible'] as const).map((t) => (
                        <TouchableOpacity key={t} style={[s.toggleBtn, contribType === t && s.toggleBtnActive]}
                            onPress={() => setContribType(t)} activeOpacity={0.8}>
                            <Text style={[s.toggleTxt, contribType === t && s.toggleTxtActive]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={s.label}>Contribution Amount</Text>
                <View style={s.amountRow}>
                    <Text style={s.amountPrefix}>KES</Text>
                    <TextInput style={s.amountInput} value={contribAmount} onChangeText={setContribAmount}
                        keyboardType="number-pad" placeholder="0" placeholderTextColor="#CBD5E1" />
                </View>

                <Text style={s.label}>Frequency</Text>
                <TouchableOpacity style={s.dropdown} onPress={() => setShowFreqModal(true)} activeOpacity={0.8}>
                    <Text style={s.dropdownTxt}>{frequency}</Text>
                    <Ionicons name="chevron-down" size={16} color={C.sub} />
                </TouchableOpacity>

                {/* ── WHERE MEMBERS WILL SEND ── */}
                <Text style={[s.sectionHeader, { marginTop: 10 }]}>WHERE MEMBERS WILL SEND MONEY</Text>
                <Text style={s.sectionCaption}>This info will be shared with all group members</Text>

                <Text style={s.label}>Treasurer Name</Text>
                <TextInput style={s.input} placeholder="" placeholderTextColor="#CBD5E1"
                    value={treasurerName} onChangeText={setTreasurerName} />

                <Text style={s.label}>M-Pesa Number</Text>
                <TextInput style={s.input} placeholder="" placeholderTextColor="#CBD5E1"
                    keyboardType="phone-pad" value={mpesaNumber} onChangeText={setMpesaNumber} />
                <Text style={s.fieldCaption}>Members will send contributions to this number</Text>

                {/* ── MEMBERS ── */}
                <Text style={[s.sectionHeader, { marginTop: 10 }]}>MEMBERS</Text>
                <View style={s.membersRow}>
                    {selectedMembers.slice(0, 3).map((m: any, i: number) => (
                        <View key={m.id} style={[s.memberAvatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], marginLeft: i > 0 ? -8 : 0 }]}>
                            <Text style={s.memberAvatarTxt}>{(m.name || 'U')[0].toUpperCase()}</Text>
                        </View>
                    ))}
                    {extraCount > 0 && (
                        <View style={[s.memberAvatar, { backgroundColor: '#E5E7EB', marginLeft: -8 }]}>
                            <Text style={[s.memberAvatarTxt, { color: C.sub }]}>+{extraCount}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={s.addMembersBtn} onPress={() => router.push('/add-group-members' as any)}>
                        <Ionicons name="add-circle" size={18} color={C.navy} />
                        <Text style={s.addMembersBtnTxt}>Add Members</Text>
                    </TouchableOpacity>
                </View>

                {/* CREATE BUTTON */}
                <TouchableOpacity style={[s.createBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleCreate} disabled={submitting} activeOpacity={0.85}>
                    {submitting
                        ? <ActivityIndicator color={C.white} />
                        : (<>
                            <Text style={s.createBtnTxt}>Create Group</Text>
                            <Ionicons name="chevron-forward" size={18} color={C.white} />
                        </>)
                    }
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* FREQUENCY MODAL */}
            <Modal visible={showFreqModal} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modal}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Select Frequency</Text>
                            <TouchableOpacity onPress={() => setShowFreqModal(false)}>
                                <Ionicons name="close" size={22} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        {FREQUENCIES.map((f) => (
                            <TouchableOpacity key={f} style={s.modalItem}
                                onPress={() => { setFrequency(f); setShowFreqModal(false); }}>
                                <Text style={[s.modalItemTxt, frequency === f && { color: C.navy, fontWeight: '700' }]}>{f}</Text>
                                {frequency === f && <Ionicons name="checkmark-circle" size={18} color={C.gold} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* ADD MEMBERS MODAL */}
            <Modal visible={showMembersModal} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <View style={s.modal}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Add Members</Text>
                            <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                                <Ionicons name="close" size={22} color={C.text} />
                            </TouchableOpacity>
                        </View>
                        {familyMembers.map((m: any, i: number) => {
                            const sel = selectedIds.has(m.id.toString());
                            return (
                                <TouchableOpacity key={m.id} style={s.memberModalRow}
                                    onPress={() => toggleMember(m.id.toString())}>
                                    <View style={[s.memberAvatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                                        <Text style={s.memberAvatarTxt}>{(m.name || 'U')[0].toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={s.memberModalName}>{m.name}</Text>
                                        <Text style={s.memberModalSub}>{m.role}</Text>
                                    </View>
                                    <View style={[s.checkbox, sel && s.checkboxActive]}>
                                        {sel && <Ionicons name="checkmark" size={14} color={C.white} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        <TouchableOpacity style={s.modalDoneBtn} onPress={() => setShowMembersModal(false)}>
                            <Text style={s.modalDoneTxt}>Done ({selectedIds.size} selected)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.white },
    header: { paddingBottom: 16, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: C.gold, fontSize: 16, fontWeight: '800' },
    scroll: { paddingHorizontal: 20, paddingTop: 20 },
    sectionHeader: { fontSize: 11, fontWeight: '800', color: C.navy, letterSpacing: 0.8, marginBottom: 14 },
    sectionCaption: { fontSize: 12, color: C.sub, marginTop: -10, marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 8 },
    optional: { color: '#CBD5E1', fontWeight: '400' },
    input: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: C.text, marginBottom: 16 },
    fieldCaption: { fontSize: 11, color: C.sub, marginTop: -10, marginBottom: 16 },
    toggleRow: { flexDirection: 'row', borderWidth: 1.5, borderColor: C.border, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
    toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: C.white },
    toggleBtnActive: { backgroundColor: C.navy },
    toggleTxt: { fontSize: 14, fontWeight: '600', color: C.sub },
    toggleTxtActive: { color: C.white },
    amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 },
    amountPrefix: { fontSize: 15, fontWeight: '600', color: C.sub, marginRight: 8 },
    amountInput: { flex: 1, fontSize: 22, fontWeight: '800', color: C.text, paddingVertical: 13 },
    dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, marginBottom: 16 },
    dropdownTxt: { fontSize: 15, color: C.text, fontWeight: '500' },
    membersRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
    memberAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white },
    memberAvatarTxt: { fontSize: 13, fontWeight: '800', color: C.navy },
    addMembersBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 6 },
    addMembersBtnTxt: { fontSize: 13, fontWeight: '700', color: C.navy },
    createBtn: { backgroundColor: C.gold, borderRadius: 30, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
    createBtnTxt: { color: C.white, fontSize: 17, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modal: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
    modalItemTxt: { fontSize: 15, color: C.sub },
    memberModalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    memberModalName: { fontSize: 15, fontWeight: '700', color: C.text },
    memberModalSub: { fontSize: 12, color: C.sub, marginTop: 2 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: C.navy, borderColor: C.navy },
    modalDoneBtn: { backgroundColor: C.navy, borderRadius: 24, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
    modalDoneTxt: { color: C.white, fontSize: 15, fontWeight: '700' },
});
