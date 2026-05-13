import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const C = {
    navy: '#1a3a8f', navyDark: '#0e2470', gold: '#F59E0B',
    bg: '#F5F7FA', white: '#ffffff', text: '#1F2937',
    sub: '#6B7280', green: '#22C55E',
};

export default function MemberAddedSuccessScreen() {
    const router = useRouter();
    const { memberName } = useLocalSearchParams<{ memberName: string }>();
    const name = memberName || 'The member';

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* HEADER */}
            <LinearGradient colors={[C.navy, C.navyDark]} style={s.header}>
                <SafeAreaView>
                    <View style={s.headerRow}>
                        <View style={{ width: 36 }} />
                        <Text style={s.headerTitle}>JiBUKS FAMILY</Text>
                        <View style={{ width: 36 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* SUCCESS CARD */}
            <View style={s.card}>

                {/* Checkmark ring */}
                <View style={s.ringOuter}>
                    <View style={s.ringInner}>
                        <View style={s.checkCircle}>
                            <Ionicons name="checkmark" size={40} color={C.white} />
                        </View>
                        {/* Decorative orbiting icons */}
                        <View style={s.orbitIcon1}>
                            <Ionicons name="heart" size={14} color={C.gold} />
                        </View>
                        <View style={s.orbitIcon2}>
                            <Ionicons name="people" size={14} color={C.sub} />
                        </View>
                    </View>
                </View>

                <Text style={s.title}>Member Added{'\n'}Successfully</Text>

                {/* Overlapping avatars */}
                <View style={s.avatarRow}>
                    <View style={[s.avatar, { backgroundColor: '#DBEAFE', zIndex: 2 }]}>
                        <Ionicons name="person" size={20} color={C.navy} />
                    </View>
                    <View style={[s.avatar, { backgroundColor: '#FEF9C3', marginLeft: -14, zIndex: 1 }]}>
                        <Text style={s.avatarInitial}>{name[0]?.toUpperCase() || 'J'}</Text>
                    </View>
                </View>

                <Text style={s.subText}>
                    <Text style={{ fontWeight: '700', color: C.text }}>{name}</Text> has been added to your family.{'\n'}
                    They can now start managing expenses with you.
                </Text>

                {/* Back to Family Members */}
                <TouchableOpacity style={s.primaryBtn}
                    onPress={() => router.replace('/family-settings' as any)} activeOpacity={0.85}>
                    <Text style={s.primaryBtnTxt}>Back to Family Members</Text>
                </TouchableOpacity>

                {/* Add Another */}
                <TouchableOpacity style={s.secondaryBtn}
                    onPress={() => router.replace('/add-family-member' as any)} activeOpacity={0.7}>
                    <Text style={s.secondaryBtnTxt}>Add Another Member</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={s.footer}>
                    <Text style={s.footerTxt}>Powered by </Text>
                    <Text style={s.footerBrand}>Apbc 🌍</Text>
                </View>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.navy },
    header: { paddingHorizontal: 20, paddingBottom: 0 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 18 },
    headerTitle: { color: C.gold, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
    card: { flex: 1, backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 40, alignItems: 'center' },
    ringOuter: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    ringInner: { width: 105, height: 105, borderRadius: 53, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    checkCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
    orbitIcon1: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
    orbitIcon2: { position: 'absolute', bottom: 4, left: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
    title: { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center', lineHeight: 34, marginBottom: 20 },
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 20, fontWeight: '800', color: '#854D0E' },
    subText: { fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    primaryBtn: { width: '100%', backgroundColor: C.gold, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
    primaryBtnTxt: { color: C.white, fontSize: 16, fontWeight: '800' },
    secondaryBtn: { paddingVertical: 6 },
    secondaryBtnTxt: { fontSize: 15, color: C.navy, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: 24, paddingBottom: 16 },
    footerTxt: { fontSize: 12, color: C.sub },
    footerBrand: { fontSize: 12, fontWeight: '700', color: C.navy },
});
