import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, Image, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiService from '@/services/api';

const C = {
    navy: '#1a3a8f', navyDark: '#0e2470', gold: '#F59E0B',
    bg: '#F5F7FA', white: '#ffffff', text: '#1F2937',
    sub: '#6B7280', border: '#E5E7EB', red: '#EF4444',
};

const ROLE_TABS = ['Admin', 'Member', 'Viewer'];
const ROLE_DESC: Record<string, string> = {
    Admin:  'Admins can add expenses, set goals, and manage family members.',
    Member: 'Members can add and manage their own personal transactions.',
    Viewer: 'Viewers have read-only access to view family activity.',
};

const MOCK_ACTIVITY = [
    { id: 1, icon: 'cart',         iconBg: '#FFFBEB', iconColor: '#F59E0B', title: 'Added grocery expense',        amount: 'KES 2,500', time: 'Today, 10:24 AM' },
    { id: 2, icon: 'flag',         iconBg: '#ECFDF5', iconColor: '#10B981', title: "Contributed to 'New Car' goal", amount: 'KES 5,000', time: 'Yesterday, 4:15 PM' },
];

export default function MemberDetailsScreen() {
    const router = useRouter();
    const { memberId } = useLocalSearchParams<{ memberId: string }>();

    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeRole, setActiveRole] = useState('Admin');
    const [currentUserId, setCurrentUserId] = useState('');

    useEffect(() => { if (memberId) loadMember(); }, [memberId]);

    const loadMember = async () => {
        try {
            const [settings, userData] = await Promise.all([
                apiService.getFamilySettings(),
                apiService.getCurrentUser(),
            ]);
            const found = settings.members.find((m: any) => m.id.toString() === memberId);
            if (found) {
                setMember(found);
                const r = found.role || 'MEMBER';
                setActiveRole(r.charAt(0).toUpperCase() + r.slice(1).toLowerCase());
            }
            setCurrentUserId(userData.id.toString());
        } catch (e) {
            console.error('Failed to load member:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = () => {
        Alert.alert(
            'Remove Member',
            `Are you sure you want to remove ${member?.name} from the family?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.updateMemberPermissions(memberId!, { active: false } as any);
                            router.back();
                        } catch (e: any) {
                            Alert.alert('Error', e?.error || 'Failed to remove member.');
                        }
                    },
                },
            ]
        );
    };

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
                            <Text style={s.headerTitle}>Member Details</Text>
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

    if (!member) return null;

    const isSelf = member.id.toString() === currentUserId;

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
                        <Text style={s.headerTitle}>Member Details</Text>
                        <View style={{ width: 36 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                {/* PROFILE CARD */}
                <View style={s.profileCard}>
                    <View style={s.avatarWrap}>
                        {member.avatar
                            ? <Image source={{ uri: apiService.getImageUrl(member.avatar) }} style={s.avatar} />
                            : (
                                <View style={s.avatarPlaceholder}>
                                    <Text style={s.avatarInitials}>{(member.name || 'U')[0].toUpperCase()}</Text>
                                </View>
                            )
                        }
                        <View style={s.cameraBtn}>
                            <Ionicons name="camera" size={12} color={C.white} />
                        </View>
                    </View>
                    <Text style={s.memberName}>{member.name}</Text>
                    <View style={s.memberTagRow}>
                        <Text style={s.relTag}>{member.relationship || 'Family Member'}</Text>
                        <Text style={s.roleTag}>{activeRole}</Text>
                    </View>

                    {/* Contact */}
                    {member.phone && (
                        <View style={s.contactRow}>
                            <View style={s.contactIcon}><Ionicons name="call" size={18} color={C.navy} /></View>
                            <View>
                                <Text style={s.contactLabel}>Mobile</Text>
                                <Text style={s.contactValue}>{member.phone}</Text>
                            </View>
                        </View>
                    )}
                    <View style={s.contactRow}>
                        <View style={s.contactIcon}><Ionicons name="mail" size={18} color={C.navy} /></View>
                        <View>
                            <Text style={s.contactLabel}>Email</Text>
                            <Text style={s.contactValue}>{member.email}</Text>
                        </View>
                    </View>
                </View>

                {/* ROLE & PERMISSIONS */}
                <View style={s.section}>
                    <Text style={s.sectionLabel}>MEMBER ROLE & PERMISSIONS</Text>
                    <View style={s.roleTabs}>
                        {ROLE_TABS.map((tab) => (
                            <TouchableOpacity key={tab}
                                style={[s.roleTab, activeRole === tab && s.roleTabActive]}
                                onPress={() => setActiveRole(tab)} activeOpacity={0.8}>
                                <Text style={[s.roleTabTxt, activeRole === tab && s.roleTabTxtActive]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={s.roleDesc}>{ROLE_DESC[activeRole]}</Text>
                </View>

                {/* RECENT ACTIVITY */}
                <View style={s.section}>
                    <View style={s.sectionHeaderRow}>
                        <Text style={s.sectionLabel}>RECENT ACTIVITY</Text>
                        <TouchableOpacity><Text style={s.viewAll}>View All</Text></TouchableOpacity>
                    </View>
                    {MOCK_ACTIVITY.map((act) => (
                        <View key={act.id} style={s.activityRow}>
                            <View style={[s.actIcon, { backgroundColor: act.iconBg }]}>
                                <Ionicons name={act.icon as any} size={18} color={act.iconColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.actTitle}>{act.title}</Text>
                                <Text style={s.actTime}>{act.time}</Text>
                            </View>
                            <Text style={s.actAmount}>{act.amount}</Text>
                        </View>
                    ))}
                </View>

                {/* EDIT BUTTON */}
                {!isSelf && (
                    <TouchableOpacity style={s.editBtn}
                        onPress={() => router.push({ pathname: '/edit-member-permissions', params: { memberId } } as any)}
                        activeOpacity={0.85}>
                        <Ionicons name="pencil" size={16} color={C.white} />
                        <Text style={s.editBtnTxt}>Edit Member</Text>
                    </TouchableOpacity>
                )}

                {/* REMOVE LINK */}
                {!isSelf && (
                    <TouchableOpacity style={s.removeBtn} onPress={handleRemoveMember} activeOpacity={0.7}>
                        <Ionicons name="person-remove" size={16} color={C.red} />
                        <Text style={s.removeBtnTxt}>Remove Member</Text>
                    </TouchableOpacity>
                )}

                {/* FOOTER */}
                <View style={s.footer}>
                    <Text style={s.footerTxt}>Powered by </Text>
                    <Text style={s.footerBrand}>Apbc 🌍</Text>
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
    scroll: { padding: 16 },
    profileCard: { backgroundColor: C.white, borderRadius: 20, padding: 22, alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
    avatarWrap: { position: 'relative', marginBottom: 12 },
    avatar: { width: 90, height: 90, borderRadius: 45 },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 32, fontWeight: '800', color: C.navy },
    cameraBtn: { position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white },
    memberName: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 },
    memberTagRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    relTag: { fontSize: 12, fontWeight: '600', color: C.sub, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    roleTag: { fontSize: 12, fontWeight: '700', color: C.navy, backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
    contactIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    contactLabel: { fontSize: 11, color: C.sub, fontWeight: '600' },
    contactValue: { fontSize: 14, color: C.text, fontWeight: '600', marginTop: 1 },
    section: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4, elevation: 1 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.sub, letterSpacing: 0.5, marginBottom: 12 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    viewAll: { fontSize: 13, color: C.navy, fontWeight: '700' },
    roleTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    roleTab: { flex: 1, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
    roleTabActive: { backgroundColor: C.navy, borderColor: C.navy },
    roleTabTxt: { fontSize: 13, fontWeight: '600', color: C.sub },
    roleTabTxtActive: { color: C.white },
    roleDesc: { fontSize: 13, color: C.sub, lineHeight: 20 },
    activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    actIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    actTitle: { fontSize: 14, fontWeight: '600', color: C.text },
    actTime: { fontSize: 12, color: C.sub, marginTop: 2 },
    actAmount: { fontSize: 14, fontWeight: '700', color: C.text },
    editBtn: { backgroundColor: C.navy, borderRadius: 28, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 },
    editBtnTxt: { color: C.white, fontSize: 16, fontWeight: '700' },
    removeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
    removeBtnTxt: { fontSize: 15, color: C.red, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    footerTxt: { fontSize: 12, color: C.sub },
    footerBrand: { fontSize: 12, fontWeight: '700', color: C.navy },
});
