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
    TextInput,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import apiService from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Premium Design Palette
const PRIMARY_BLUE = '#122f8a';
const SECONDARY_BLUE = '#1a3bb0';
const ACCENT_ORANGE = '#fe9900';
const SUCCESS_GREEN = '#10b981';
const DANGER_RED = '#ef4444';
const TEXT_DARK = '#1e293b';
const TEXT_MUTED = '#64748b';
const BORDER_COLOR = '#e2e8f0';

export default function VendorsScreen() {
    const router = useRouter();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadVendors();
    }, []);

    const loadVendors = async () => {
        try {
            setLoading(true);
            const data = await apiService.getVendors();
            setVendors(data || []);
        } catch (error) {
            console.error('Error loading vendors:', error);
            // Alert.alert('Error', 'Failed to load suppliers');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadVendors();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return `Ksh${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    };

    const filteredVendors = vendors.filter(vendor =>
        vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Calculate Summary Totals (Mocked/Derived)
    const totalOpenBalance = vendors.reduce((sum, v) => sum + (v.balance || 0), 0);
    const overdueBalance = totalOpenBalance * 0.4; // Sample calculation
    const paidLast30 = 450000; // Sample mock

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                <Text style={styles.loadingText}>Syncing Suppliers...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <SafeAreaView edges={['top']} style={styles.headerWrapper}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                        <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Suppliers</Text>
                    <TouchableOpacity
                        style={styles.newSupplierBtn}
                        onPress={() => router.push('/add-supplier')}
                    >
                        <Text style={styles.newSupplierText}>New supplier</Text>
                        <View style={styles.btnDivider} />
                        <Ionicons name="chevron-down" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY_BLUE} />
                }
            >
                {/* Summary Cards Row - Matches Screenshot */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.summaryScroll}
                    contentContainerStyle={styles.summaryContent}
                >
                    {/* Unbilled Card */}
                    <View style={[styles.summaryCard, { backgroundColor: '#0077c2' }]}>
                        <Text style={styles.summaryLabel}>Unbilled Last 365 Days</Text>
                        <View style={styles.summaryValueRow}>
                            <Text style={styles.summaryAmount}>Ksh0.00</Text>
                        </View>
                        <Text style={styles.summarySubtext}>0 PURCHASE ORDER</Text>
                    </View>

                    {/* Unpaid Card (Overdue) */}
                    <View style={[styles.summaryCard, { backgroundColor: '#ff8a00' }]}>
                        <Text style={styles.summaryLabel}>Unpaid Last 365 Days</Text>
                        <View style={styles.summaryValueRow}>
                            <Text style={styles.summaryAmount}>{formatCurrency(overdueBalance)}</Text>
                        </View>
                        <Text style={styles.summarySubtext}>0 OVERDUE</Text>
                    </View>

                    {/* Unpaid Card (Open Bills) */}
                    <View style={[styles.summaryCard, { backgroundColor: '#e2e8f0' }]}>
                        <Text style={[styles.summaryLabel, { color: TEXT_DARK }]}>Unpaid Last 365 Days</Text>
                        <View style={styles.summaryValueRow}>
                            <Text style={[styles.summaryAmount, { color: TEXT_DARK }]}>{formatCurrency(totalOpenBalance)}</Text>
                        </View>
                        <Text style={[styles.summarySubtext, { color: TEXT_MUTED }]}>0 OPEN BILLS</Text>
                    </View>

                    {/* Paid Card */}
                    <View style={[styles.summaryCard, { backgroundColor: '#2e7d32' }]}>
                        <Text style={styles.summaryLabel}>Paid</Text>
                        <View style={styles.summaryValueRow}>
                            <Text style={styles.summaryAmount}>{formatCurrency(paidLast30)}</Text>
                        </View>
                        <Text style={styles.summarySubtext}>PAID LAST 30 DAYS</Text>
                    </View>
                </ScrollView>

                {/* Search & Actions Bar */}
                <View style={styles.actionsBar}>
                    <View style={styles.searchBox}>
                        <Feather name="search" size={18} color={TEXT_MUTED} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Find a supplier..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={TEXT_MUTED}
                        />
                    </View>
                    <View style={styles.utilityIcons}>
                        <TouchableOpacity style={styles.utilBtn}><Feather name="printer" size={20} color={TEXT_DARK} /></TouchableOpacity>
                        <TouchableOpacity style={styles.utilBtn}><Feather name="file-text" size={20} color={TEXT_DARK} /></TouchableOpacity>
                        <TouchableOpacity style={styles.utilBtn}><Feather name="settings" size={20} color={TEXT_DARK} /></TouchableOpacity>
                    </View>
                </View>

                {/* Suppliers Table/List */}
                <View style={styles.tableHeader}>
                    <View style={[styles.col, { flex: 2 }]}><Text style={styles.colLabel}>SUPPLIER</Text></View>
                    <View style={[styles.col, { flex: 1 }]}><Text style={styles.colLabel}>OPEN BALANCE</Text></View>
                    <View style={[styles.col, { flex: 1, alignItems: 'flex-end' }]}><Text style={styles.colLabel}>ACTION</Text></View>
                </View>

                {filteredVendors.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="account-search-outline" size={60} color={BORDER_COLOR} />
                        <Text style={styles.emptyText}>No suppliers found matching "{searchQuery}"</Text>
                    </View>
                ) : (
                    filteredVendors.map((vendor, index) => (
                        <TouchableOpacity
                            key={vendor.id}
                            style={[styles.row, index % 2 === 0 && styles.rowAlt]}
                            onPress={() => router.push(`/vendor-detail?id=${vendor.id}` as any)}
                        >
                            <View style={[styles.col, { flex: 2 }]}>
                                <Text style={styles.vendorName}>{vendor.name}</Text>
                                <Text style={styles.vendorSubtitle}>{vendor.email || 'No email provided'}</Text>
                            </View>
                            <View style={[styles.col, { flex: 1 }]}>
                                <Text style={styles.balanceText}>{formatCurrency(vendor.balance || 0)}</Text>
                            </View>
                            <View style={[styles.col, { flex: 1, alignItems: 'flex-end' }]}>
                                <TouchableOpacity
                                    style={styles.actionLink}
                                    onPress={() => router.push(`/bill-entry?vendorId=${vendor.id}` as any)}
                                >
                                    <Text style={styles.actionLinkText}>Create bill</Text>
                                    <Ionicons name="chevron-down" size={12} color="#0056b3" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 15, fontSize: 13, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 1 },

    headerWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, height: 65 },
    headerBack: { marginRight: 15 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: TEXT_DARK, flex: 1 },

    newSupplierBtn: { backgroundColor: '#2e7d32', borderRadius: 6, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15 },
    newSupplierText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    btnDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 10 },

    scrollView: { flex: 1 },
    scrollContent: { paddingTop: 20 },

    summaryScroll: { marginBottom: 25 },
    summaryContent: { paddingHorizontal: 20, gap: 10 },
    summaryCard: { width: width * 0.75, height: 110, borderRadius: 4, padding: 15, justifyContent: 'space-between' },
    summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
    summaryValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    summaryAmount: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    summarySubtext: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },

    actionsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 15 },
    searchBox: { flex: 1, height: 45, backgroundColor: '#fff', borderRadius: 4, borderWidth: 1, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: TEXT_DARK },
    utilityIcons: { flexDirection: 'row', gap: 12 },
    utilBtn: { padding: 5 },

    tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
    col: { justifyContent: 'center' },
    colLabel: { fontSize: 11, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 0.5 },

    row: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
    rowAlt: { backgroundColor: '#fcfdfe' },
    vendorName: { fontSize: 14, fontWeight: 'bold', color: '#0056b3' },
    vendorSubtitle: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
    balanceText: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
    actionLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    actionLinkText: { fontSize: 13, color: '#0056b3', fontWeight: 'bold' },

    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { marginTop: 15, fontSize: 14, color: TEXT_MUTED, textAlign: 'center' },
});
