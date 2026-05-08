import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Image,
    StatusBar,
    Platform,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

// Brand Colors
const PRIMARY_BLUE = '#122f8a';
const SECONDARY_BLUE = '#1a3bb0';
const ACCENT_ORANGE = '#fe9900';
const LIGHT_CARD = '#fee2e2'; // Light red/pink for expenses
const SUCCESS_GREEN = '#10b981';
const DANGER_RED = '#ef4444';

// Responsive utility - Perfect 3-column grid calculation
const gridPadding = 16;
const gridGap = 12;
const cardWidth = (width - (gridPadding * 2) - (gridGap * 2)) / 3;

export default function ExpensesBillsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summary, setSummary] = useState({
        totalUnpaid: 0,
        unpaidCount: 0,
        monthlyExpenses: 0,
        suppliersCount: 0
    });

    // Animation State
    const [statIndex, setStatIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const stats = [
        { label: 'Unpaid Bills Total', value: `KES ${Number(summary.totalUnpaid).toLocaleString()}`, color: DANGER_RED, alert: true },
        { label: 'Pending Bills', value: `${summary.unpaidCount} Invoices`, color: DANGER_RED, alert: true },
        { label: 'Monthly Expenses', value: `KES ${Number(summary.monthlyExpenses).toLocaleString()}`, color: PRIMARY_BLUE },
        { label: 'Active Suppliers', value: `${summary.suppliersCount} Vendors`, color: PRIMARY_BLUE },
    ];

    useEffect(() => {
        loadData();
    }, []);

    // Carousel Timer
    useEffect(() => {
        if (stats.length === 0) return;
        const interval = setInterval(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: -15, duration: 400, useNativeDriver: true })
            ]).start(() => {
                setStatIndex((prev) => (prev + 1) % stats.length);
                slideAnim.setValue(15);
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
                ]).start();
            });
        }, 4500);

        return () => clearInterval(interval);
    }, [summary]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch relevant data for summary
            const [unpaidPurchases, allVendors] = await Promise.all([
                apiService.getPurchases({ status: 'UNPAID' }),
                apiService.getVendors({ active: true })
            ]);

            const totalUnpaid = unpaidPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

            setSummary({
                totalUnpaid,
                unpaidCount: unpaidPurchases.length,
                monthlyExpenses: totalUnpaid + 150000, // Partial mock for demonstration
                suppliersCount: allVendors.length
            });
        } catch (error) {
            console.error('Error loading expenses data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={ACCENT_ORANGE} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color={ACCENT_ORANGE} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>EXPENSES & BILLS</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT_ORANGE} />
                }
            >
                {/* Visual Section - Luxury Theme */}
                <View style={styles.visualContainer}>
                    <LinearGradient
                        colors={['#7f1d1d', '#991b1b', '#450a0a']} // Deep red palette for spending
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.premiumCardBg}
                    >
                        {/* Decorative Abstract Shapes */}
                        <View style={[styles.decorativeCircle, { top: -20, right: -20, backgroundColor: 'rgba(254, 153, 0, 0.15)' }]} />
                        <View style={[styles.decorativeCircle, { bottom: -30, left: -20, width: 120, height: 120, backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />

                        <View style={styles.cardOverlay}>
                            <Animated.View style={[
                                styles.statsPopUpCard,
                                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                            ]}>
                                <Text style={[styles.statPopLabel, stats[statIndex].alert && { color: DANGER_RED }]}>
                                    {stats[statIndex].label}
                                </Text>
                                <Text style={[styles.statPopValue, { color: stats[statIndex].color }]}>
                                    {stats[statIndex].value}
                                </Text>

                                {/* Progress Indicator */}
                                <View style={styles.progressContainer}>
                                    {stats.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.progressDot,
                                                i === statIndex && { width: 14, backgroundColor: ACCENT_ORANGE }
                                            ]}
                                        />
                                    ))}
                                </View>
                            </Animated.View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Actions Grid - Perfect 3x2 Layout */}
                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Expenditure Actions</Text>
                    </View>

                    <View style={styles.grid}>
                        <GridItem
                            label="New Bill"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="file-document-plus-outline" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -4 }]}>
                                    <Ionicons name="add-circle" size={18} color={ACCENT_ORANGE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/bill-entry' as any)}
                        />
                        <GridItem
                            label="New Expense"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="wallet-plus-outline" size={38} color={ACCENT_ORANGE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <Ionicons name="remove-circle" size={18} color={DANGER_RED} />
                                </View>
                            </View>}
                            onPress={() => router.push('/add-expense' as any)}
                        />
                        <GridItem
                            label="Suppliers"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="account-group-outline" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="star-circle" size={18} color={ACCENT_ORANGE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/vendors' as any)}
                        />
                        <GridItem
                            label="Debit Notes"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="file-undo-outline" size={38} color={ACCENT_ORANGE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="minus-circle" size={18} color={DANGER_RED} />
                                </View>
                            </View>}
                            onPress={() => router.push('/debit-note' as any)}
                        />
                        <GridItem
                            label="Record Pmt"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="bank-transfer-out" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="check-decagram" size={18} color={SUCCESS_GREEN} />
                                </View>
                            </View>}
                            onPress={() => router.push('/pay-supplier' as any)}
                        />
                        <GridItem
                            label="Cash Out"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="cash-fast" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="arrow-up-bold-circle" size={18} color={ACCENT_ORANGE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/cash-purchase' as any)}
                        />
                    </View>

                    {/* Reports link */}
                    <TouchableOpacity
                        style={styles.listLink}
                        onPress={() => router.push('/reports' as any)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#fff', '#fff5f5']}
                            style={styles.listLinkGradient}
                        >
                            <View style={styles.listLinkLeft}>
                                <View style={styles.listIconBox}>
                                    <Ionicons name="stats-chart" size={20} color={DANGER_RED} />
                                </View>
                                <Text style={styles.listLinkText}>Expense Reports & Insights</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={DANGER_RED} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Branding Footer */}
                <View style={styles.footer}>
                    <Text style={styles.poweredBy}>Powered by Apbc Africa</Text>
                    <View style={styles.logoRow}>
                        <View style={styles.logoOrb}>
                            <Image
                                source={require('@/assets/images/icon.png')}
                                style={styles.logoImg}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function GridItem({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.gridIconBox}>
                {icon}
            </View>
            <Text style={styles.gridLabel} numberOfLines={2}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingBottom: 15 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 55 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: ACCENT_ORANGE, letterSpacing: 2 },
    backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    visualContainer: { padding: gridPadding, height: 230 },
    premiumCardBg: { flex: 1, borderRadius: 24, overflow: 'hidden', position: 'relative', elevation: 8, shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
    decorativeCircle: { position: 'absolute', width: 140, height: 140, borderRadius: 70 },
    cardOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statsPopUpCard: { backgroundColor: '#fff', width: '85%', paddingVertical: 24, paddingHorizontal: 15, borderRadius: 22, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 10 },
    statPopLabel: { fontSize: 16, fontWeight: '700', color: '#64748b', marginBottom: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
    statPopValue: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    progressContainer: { flexDirection: 'row', gap: 6 },
    progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(18, 47, 138, 0.15)' },
    content: { paddingHorizontal: gridPadding },
    sectionHeader: { marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: gridGap },
    gridItem: { width: cardWidth, height: cardWidth + 18, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3, shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    gridIconBox: { marginBottom: 10, height: 55, justifyContent: 'center', alignItems: 'center' },
    gridLabel: { fontSize: 11, fontWeight: 'bold', color: '#334155', textAlign: 'center', lineHeight: 13 },
    complexIcon: { position: 'relative', width: 55, height: 55, justifyContent: 'center', alignItems: 'center' },
    orderBadge: { position: 'absolute', right: -4, top: 14, backgroundColor: '#fff', borderRadius: 10 },
    listLink: { marginTop: 25, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#fee2e2' },
    listLinkGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    listLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    listIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
    listLinkText: { fontSize: 15, fontWeight: 'bold', color: DANGER_RED },
    footer: { marginTop: 40, alignItems: 'center' },
    poweredBy: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },
    logoRow: { flexDirection: 'row', alignItems: 'center' },
    logoOrb: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY_BLUE, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    logoImg: { width: 22, height: 22 },
});
