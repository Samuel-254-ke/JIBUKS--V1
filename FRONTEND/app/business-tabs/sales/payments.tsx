/**
 * B-014: Payment receipts – list of payments received (invoices paid / partial).
 */
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

export default function PaymentsScreen() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPayments = async () => {
        try {
            const data = await apiService.getInvoices();
            const paidOrPartial = (data || []).filter(
                (inv: any) => inv.status === 'PAID' || inv.status === 'PARTIAL'
            );
            paidOrPartial.sort((a: any, b: any) =>
                new Date(b.updatedAt || b.invoiceDate).getTime() - new Date(a.updatedAt || a.invoiceDate).getTime()
            );
            setInvoices(paidOrPartial);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load payments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPayments();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadPayments();
    };

    const formatCurrency = (n: number) => `KES ${Number(n).toLocaleString()}`;
    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payments</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#1e3a8a" />
                    <Text style={styles.loadingText}>Loading payments...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payments</Text>
                <TouchableOpacity onPress={() => router.push('/invoices')} style={styles.headerRight}>
                    <Text style={styles.headerLink}>Invoices</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {invoices.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="card-outline" size={56} color="#d1d5db" />
                        <Text style={styles.emptyTitle}>No payments yet</Text>
                        <Text style={styles.emptySub}>Payments from invoices will appear here</Text>
                    </View>
                ) : (
                    invoices.map((inv) => (
                        <TouchableOpacity
                            key={inv.id}
                            style={styles.card}
                            onPress={() => router.push(`/invoice-detail?id=${inv.id}` as any)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardRow}>
                                <Text style={styles.invNumber}>{inv.invoiceNumber || `#${inv.id}`}</Text>
                                <Text style={styles.amount}>{formatCurrency(Number(inv.amountPaid || 0))}</Text>
                            </View>
                            <Text style={styles.customer}>
                                {inv.customer?.name || 'Customer'}
                            </Text>
                            <View style={styles.cardRow}>
                                <Text style={styles.date}>{formatDate(inv.updatedAt || inv.invoiceDate)}</Text>
                                <View style={[styles.badge, inv.status === 'PAID' ? styles.badgePaid : styles.badgePartial]}>
                                    <Text style={styles.badgeText}>{inv.status}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
    headerRight: { padding: 4 },
    headerLink: { fontSize: 14, color: '#1e3a8a', fontWeight: '600' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, fontSize: 14, color: '#6b7280' },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
    emptySub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invNumber: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
    amount: { fontSize: 16, fontWeight: '700', color: '#10b981' },
    customer: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    date: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgePaid: { backgroundColor: '#d1fae5' },
    badgePartial: { backgroundColor: '#fef3c7' },
    badgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
});
