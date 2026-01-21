import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    Alert,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function PendingChequesScreen() {
    const router = useRouter();

    // Mock Data
    const summary = {
        totalPending: 2,
        totalAmount: 270,
        oldestPending: 'Jan 10'
    };

    const [cheques, setCheques] = useState([
        {
            id: '203',
            payee: 'School',
            amount: 250,
            date: 'Jan 10',
            status: 'Pending',
            bank: 'Bank A',
            memo: 'January School Fees',
            hasImage: true
        },
        {
            id: '205',
            payee: 'Water Board',
            amount: 20,
            date: 'Jan 14',
            status: 'Pending',
            bank: 'Wallet',
            memo: 'Water Bill',
            hasImage: true
        }
    ]);

    const handleMarkCleared = (id: string) => {
        Alert.alert('Success', `Cheque #${id} marked as cleared.`);
        // Logic to update state would go here
    };

    const handleDelete = (id: string) => {
        Alert.alert('Confirm Delete', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    setCheques(prev => prev.filter(c => c.id !== id));
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#122f8a', '#0a1a5c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#ffffff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Pending Cheques</Text>
                        </View>
                        <View style={styles.headerIcons}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="notifications-outline" size={22} color="#fe9900" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="settings-outline" size={22} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Pending Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Pending Summary</Text>
                    <View style={styles.dashedDivider} />

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Pending</Text>
                            <Text style={styles.summaryValue}>{summary.totalPending}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Amount</Text>
                            <Text style={[styles.summaryValue, { color: '#122f8a' }]}>KES {summary.totalAmount}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Oldest Pending</Text>
                            <Text style={[styles.summaryValue, { color: '#c2410c' }]}>{summary.oldestPending}</Text>
                        </View>
                    </View>
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                    <Text style={styles.filtersLabel}>Filters:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                        <TouchableOpacity style={styles.filterChip}>
                            <Text style={styles.filterText}>This Month</Text>
                            <Ionicons name="chevron-down" size={12} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip}>
                            <Text style={styles.filterText}>Supplier</Text>
                            <Ionicons name="chevron-down" size={12} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip}>
                            <Text style={styles.filterText}>Bank</Text>
                            <Ionicons name="chevron-down" size={12} color="#475569" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.filterChip}>
                            <Text style={styles.filterText}>Sort: Oldest</Text>
                            <Ionicons name="chevron-down" size={12} color="#475569" />
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Pending Cheques List */}
                <View style={styles.listContainer}>
                    <Text style={styles.sectionTitle}>Pending Cheques</Text>
                    <View style={styles.dashedDivider} />

                    {cheques.map((item) => (
                        <View key={item.id} style={styles.chequeCard}>
                            <View style={styles.chequeHeader}>
                                <Text style={styles.chequeTitle}>
                                    Cheque #{item.id}  -  {item.payee}  -  <Text style={styles.amountText}>KES {item.amount}</Text>
                                </Text>
                            </View>

                            <View style={styles.chequeMetaGrid}>
                                <View style={styles.metaCol}>
                                    <Text style={styles.metaLabel}>Date Issued:</Text>
                                    <Text style={styles.metaValue}>{item.date}</Text>
                                </View>
                                <View style={styles.metaCol}>
                                    <Text style={styles.metaLabel}>Status:</Text>
                                    <Text style={[styles.metaValue, { color: '#fe9900' }]}>{item.status}</Text>
                                </View>
                                <View style={styles.metaColFull}>
                                    <Text style={styles.metaLabel}>Bank:</Text>
                                    <Text style={styles.metaValue}>{item.bank}</Text>
                                </View>
                                <View style={styles.metaColFull}>
                                    <Text style={styles.metaLabel}>Memo:</Text>
                                    <Text style={styles.metaValue}>{item.memo}</Text>
                                </View>
                            </View>

                            {/* Thumbnail Placeholder */}
                            <View style={styles.thumbnailRow}>
                                <Text style={styles.metaLabel}>Image:</Text>
                                <View style={styles.thumbnailBox}>
                                    <Ionicons name="image" size={16} color="#94a3b8" />
                                    <Text style={styles.thumbnailText}>Thumbnail</Text>
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={styles.actionsRow}>
                                <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleMarkCleared(item.id)}>
                                    <Text style={styles.actionBtnText}>Mark Cleared</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtnOutline} onPress={() => router.push({ pathname: '/cheque-details', params: { id: item.id } })}>
                                    <Text style={styles.actionBtnText}>View Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleDelete(item.id)}>
                                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cardSeparator} />
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerContainer: {
        backgroundColor: '#122f8a',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    headerGradient: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    dashedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    filtersContainer: {
        marginBottom: 20,
    },
    filtersLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    filtersScroll: {
        flexDirection: 'row',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        marginRight: 10,
    },
    filterText: {
        fontSize: 13,
        color: '#334155',
        marginRight: 6,
        fontWeight: '500',
    },
    listContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    chequeCard: {
        marginBottom: 20,
    },
    chequeHeader: {
        marginBottom: 8,
    },
    chequeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        lineHeight: 20,
    },
    amountText: {
        color: '#122f8a',
        fontWeight: '700',
    },
    chequeMetaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    metaCol: {
        width: '50%',
        flexDirection: 'row',
        marginBottom: 4,
    },
    metaColFull: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 4,
    },
    metaLabel: {
        fontSize: 13,
        color: '#64748b',
        marginRight: 8,
        width: 80, // fixed width for alignment
    },
    metaValue: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '500',
        flex: 1,
    },
    thumbnailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    thumbnailBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    thumbnailText: {
        fontSize: 11,
        color: '#64748b',
        marginLeft: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionBtnOutline: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#f8fafc',
    },
    actionBtnText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    cardSeparator: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginTop: 20,
        borderStyle: 'dashed', // Not supported on View borders directly in RN sometimes, can use borderWidth
        borderWidth: 1,
        borderColor: '#e2e8f0', // Solid fallback or use a library, but View dashed border is spotty. I'll stick to solid for item separator to be clean.
    }
});
