import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiService from '../services/api';
import Toast from 'react-native-toast-message';

export default function VendorProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, name } = params;

    const [supplierData, setSupplierData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVendorDetails = async () => {
            if (!id) return;
            try {
                const data = await apiService.getVendor(Number(id));
                setSupplierData(data);
            } catch (error) {
                console.error("Failed to fetch vendor details", error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to load vendor details'
                });
            } finally {
                setLoading(false);
            }
        };

        fetchVendorDetails();
    }, [id]);


    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#122f8a" />
            </SafeAreaView>
        );
    }

    if (!supplierData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Error</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Supplier not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Process data for display
    const recentTransactions = supplierData.purchases || [];
    const totalSpent = supplierData.stats?.totalPurchases || 0;
    const unpaidBillsCount = recentTransactions.filter((p: any) => p.status !== 'PAID').length;
    // Mocking next due as we don't have explicit due dates in basic purchase list yet, 
    // or we could use the first unpaid bill's date
    const lastPayment = { amount: supplierData.stats?.totalPaid || 0, date: 'Total Paid' }; // Simplified for now

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Supplier Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Main Info */}
                <View style={styles.section}>


                    <View style={styles.infoCard}>
                        {/* Vendor Logo & Name Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <View style={{
                                width: 50, height: 50, borderRadius: 25,
                                backgroundColor: '#122f8a', alignItems: 'center', justifyContent: 'center',
                                marginRight: 12, overflow: 'hidden'
                            }}>
                                {supplierData.logoUrl ? (
                                    <Image
                                        source={{ uri: apiService.getImageUrl(supplierData.logoUrl) }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>
                                        {supplierData.name ? supplierData.name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() : '?'}
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.supplierName, { marginBottom: 0 }]}>
                                {supplierData.name}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Spent:</Text>
                            <Text style={styles.infoValue}>KES {Number(totalSpent).toLocaleString()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Total Paid:</Text>
                            <Text style={styles.infoValue}>KES {Number(lastPayment.amount).toLocaleString()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Outstanding Balance:</Text>
                            <Text style={[styles.infoValue, { color: '#dc2626' }]}>KES {Number(supplierData.balance).toLocaleString()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Unpaid Bills:</Text>
                            <Text style={styles.infoValue}>{unpaidBillsCount}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions:</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="cash" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Pay Supplier</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="document-text" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Add Bill</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.actionButtonOrange]}>
                            <Ionicons name="create" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Write Cheque</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="attach" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>Attach Receipt</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.actionButtonOrange]}>
                            <Ionicons name="wallet" size={20} color="#ffffff" />
                            <Text style={styles.actionButtonText}>View Cheques</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.visualCard}>
                        <Text style={styles.visualCardTitle}>Recent Transactions</Text>
                        <View style={styles.divider} />
                        {recentTransactions.length > 0 ? (
                            recentTransactions.slice(0, 5).map((transaction: any) => (
                                <View key={transaction.id} style={styles.transactionItem}>
                                    <Text style={styles.bullet}>•</Text>
                                    <Text style={styles.transactionText}>
                                        {new Date(transaction.purchaseDate).toLocaleDateString()} - KES {Number(transaction.total).toLocaleString()} - {transaction.status}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>No recent transactions</Text>
                        )}
                    </View>
                </View>

                {/* Receipts */}
                <View style={styles.section}>
                    <View style={styles.visualCard}>
                        <Text style={styles.visualCardTitle}>Receipts</Text>
                        <View style={styles.divider} />
                        {/* 
                            TODO: Implement receipts fetching from backend.
                            Currently API does not return attached receipts for vendor directly.
                        */}
                        <View style={[styles.receiptsRow, { justifyContent: 'center', paddingVertical: 10 }]}>
                            <Text style={{ color: '#9ca3af', fontStyle: 'italic' }}>No receipts found</Text>
                        </View>
                    </View>
                </View>

                {/* Supplier Info */}
                <View style={styles.section}>
                    <View style={styles.visualCard}>
                        <Text style={styles.visualCardTitle}>Supplier Info</Text>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone:</Text>
                            <Text style={styles.infoValue}>{supplierData.phone || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email:</Text>
                            <Text style={styles.infoValue}>{supplierData.email || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Address:</Text>
                            <Text style={styles.infoValue}>{supplierData.address || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Payment Terms:</Text>
                            <Text style={styles.infoValue}>{supplierData.paymentTerms || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tax ID:</Text>
                            <Text style={styles.infoValue}>{supplierData.taxId || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    supplierName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#122f8a',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    infoValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#122f8a',
        marginBottom: 12,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#122f8a',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
        shadowColor: '#122f8a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonOrange: {
        backgroundColor: '#fe9900',
        shadowColor: '#fe9900',
    },
    actionButtonText: {
        fontSize: 13,
        color: '#ffffff',
        fontWeight: '600',
    },
    visualCard: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    visualCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#122f8a',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    bullet: {
        fontSize: 16,
        color: '#1f2937',
        marginRight: 8,
    },
    transactionText: {
        fontSize: 13,
        color: '#1f2937',
    },
    receiptsRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailText: {
        fontSize: 10,
        color: '#6b7280',
    },
    viewAllLink: {
        fontSize: 13,
        color: '#122f8a',
        fontWeight: '600',
    },
});
