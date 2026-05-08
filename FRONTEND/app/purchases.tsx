import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions,
    Platform,
    StatusBar,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

// Brand Colors
const PRIMARY_BLUE = '#122f8a';
const SECONDARY_BLUE = '#1a3bb0';
const ACCENT_ORANGE = '#fe9900';
const SUCCESS_GREEN = '#10b981';
const DANGER_RED = '#ef4444';
const LIGHT_BG = '#f8fafc';
const CARD_BG = '#ffffff';
const TEXT_DARK = '#1e293b';
const TEXT_MUTED = '#64748b';
const BORDER_COLOR = '#e2e8f0';

export default function PurchasesScreen() {
    const router = useRouter();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL'); // ALL, UNPAID, PAID
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadPurchases();
    }, [filter]);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            const queryString = filter !== 'ALL' ? `?status=${filter}` : '';
            const data = await apiService.request(`/purchases${queryString}`, {
                method: 'GET'
            });
            setPurchases(data || []);
        } catch (error) {
            console.error('Error loading purchases:', error);
            // Alert.alert('Error', 'Failed to load purchase history');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPurchases();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return `Ksh${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PAID':
                return { bg: '#dcfce7', text: '#15803d', icon: 'checkmark-circle' };
            case 'PARTIAL':
                return { bg: '#fef3c7', text: '#b45309', icon: 'time' };
            case 'UNPAID':
                return { bg: '#fee2e2', text: '#dc2626', icon: 'alert-circle' };
            default:
                return { bg: '#f1f5f9', text: '#475569', icon: 'document' };
        }
    };

    const calculateSummary = () => {
        const total = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
        const paid = purchases.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
        const outstanding = total - paid;
        return { total, paid, outstanding };
    };

    const summary = calculateSummary();
    const filteredPurchases = purchases.filter(p =>
        p.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.billNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                <Text style={styles.loadingText}>Loading History...</Text>
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
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>PURCHASE HISTORY</Text>
                            <Text style={styles.headerSubtitle}>{purchases.length} Transactions Found</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/new-purchase')} style={styles.addButton}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
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
                {/* Summary Section */}
                <View style={styles.summaryGrid}>
                    <LinearGradient colors={['#7f1d1d', '#991b1b']} style={styles.summaryCard}>
                        <Feather name="trending-down" size={18} color="#fff" style={styles.cardIcon} />
                        <Text style={styles.summaryLabel}>Total Spent</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
                    </LinearGradient>

                    <LinearGradient colors={[SUCCESS_GREEN, '#065f46']} style={styles.summaryCard}>
                        <Feather name="check-circle" size={18} color="#fff" style={styles.cardIcon} />
                        <Text style={styles.summaryLabel}>Total Paid</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.paid)}</Text>
                    </LinearGradient>

                    <LinearGradient colors={['#ea580c', '#c2410c']} style={styles.summaryCard}>
                        <Feather name="clock" size={18} color="#fff" style={styles.cardIcon} />
                        <Text style={styles.summaryLabel}>Balance Owed</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(summary.outstanding)}</Text>
                    </LinearGradient>
                </View>

                {/* Search & Filter Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBox}>
                        <Feather name="search" size={18} color={TEXT_MUTED} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by vendor or bill #"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                <View style={styles.filterBar}>
                    {['ALL', 'UNPAID', 'PAID'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f.charAt(0) + f.slice(1).toLowerCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Transactions List */}
                <View style={styles.listSection}>
                    {filteredPurchases.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="history" size={80} color={BORDER_COLOR} />
                            <Text style={styles.emptyTitle}>No History Recorded</Text>
                            <Text style={styles.emptySubtitle}>Your procurement history will appear here once you record bills or expenses.</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/new-purchase')}>
                                <Text style={styles.emptyBtnText}>Create a Bill</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        filteredPurchases.map((purchase) => {
                            const status = getStatusStyle(purchase.status);
                            return (
                                <TouchableOpacity
                                    key={purchase.id}
                                    style={styles.purchaseCard}
                                    onPress={() => router.push(`/purchase-detail?id=${purchase.id}` as any)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardMain}>
                                        <View style={styles.vendorIcon}>
                                            <MaterialCommunityIcons name="store-outline" size={24} color={PRIMARY_BLUE} />
                                        </View>
                                        <View style={styles.cardInfo}>
                                            <Text style={styles.vendorName} numberOfLines={1}>
                                                {purchase.vendor?.name || 'External Vendor'}
                                            </Text>
                                            <Text style={styles.billId}>#{purchase.billNumber || purchase.id}</Text>
                                        </View>
                                        <View style={styles.amountSection}>
                                            <Text style={styles.mainAmount}>{formatCurrency(purchase.total)}</Text>
                                            <Text style={styles.purchaseDate}>{formatDate(purchase.purchaseDate)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardDivider} />

                                    <View style={styles.cardFooter}>
                                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                                            <Ionicons name={status.icon as any} size={14} color={status.text} />
                                            <Text style={[styles.statusText, { color: status.text }]}>{purchase.status}</Text>
                                        </View>
                                        <View style={styles.footerDetails}>
                                            {purchase.balance > 0 && (
                                                <Text style={styles.outstandingText}>
                                                    Owed: <Text style={{ fontWeight: '900' }}>{formatCurrency(purchase.balance)}</Text>
                                                </Text>
                                            )}
                                            <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: LIGHT_BG },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 13, color: TEXT_MUTED, fontWeight: '700', letterSpacing: 1 },

    header: { paddingBottom: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 65, marginTop: 10 },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: ACCENT_ORANGE, letterSpacing: 2 },
    headerSubtitle: { fontSize: 11, color: '#fff', opacity: 0.8, marginTop: 2, fontWeight: '600' },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT_ORANGE, alignItems: 'center', justifyContent: 'center' },

    scrollView: { flex: 1 },
    scrollContent: { paddingTop: 20 },

    summaryGrid: { flexDirection: 'row', paddingHorizontal: 15, gap: 10, marginBottom: 25 },
    summaryCard: { flex: 1, height: 100, borderRadius: 16, padding: 12, justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' },
    cardIcon: { position: 'absolute', top: 10, right: 10, opacity: 0.3 },
    summaryLabel: { fontSize: 11, color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9, marginBottom: 4 },
    summaryValue: { fontSize: 15, fontWeight: '900', color: '#fff' },

    searchSection: { paddingHorizontal: 20, marginBottom: 15 },
    searchBox: { height: 50, backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: BORDER_COLOR },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: TEXT_DARK },

    filterBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 20 },
    filterTab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
    filterTabActive: { backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE },
    filterText: { fontSize: 13, fontWeight: 'bold', color: TEXT_MUTED },
    filterTextActive: { color: '#fff' },

    listSection: { paddingHorizontal: 20 },
    purchaseCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: BORDER_COLOR, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    cardMain: { flexDirection: 'row', padding: 15, alignItems: 'center' },
    vendorIcon: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    vendorName: { fontSize: 15, fontWeight: 'bold', color: TEXT_DARK, marginBottom: 2 },
    billId: { fontSize: 12, color: TEXT_MUTED },
    amountSection: { alignItems: 'flex-end' },
    mainAmount: { fontSize: 16, fontWeight: '900', color: PRIMARY_BLUE, marginBottom: 4 },
    purchaseDate: { fontSize: 11, color: TEXT_MUTED },

    cardDivider: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 15 },

    cardFooter: { flexDirection: 'row', padding: 12, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
    statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    footerDetails: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    outstandingText: { fontSize: 12, color: DANGER_RED },

    emptyContainer: { padding: 40, alignItems: 'center', marginTop: 20 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT_DARK, marginTop: 15 },
    emptySubtitle: { fontSize: 13, color: TEXT_MUTED, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    emptyBtn: { marginTop: 20, backgroundColor: PRIMARY_BLUE, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
    emptyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
