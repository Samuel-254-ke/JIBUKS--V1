import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

// Mock data for initial display, can be enhanced with real data integration
const mockActivity = [
    { id: 1, time: "9:30 AM", description: "Haircut sale", amount: 300 },
    { id: 2, time: "11:15 AM", description: "Shampoo restock", amount: 500 }
];

export default function BusinessDashboardScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [userName, setUserName] = useState<string>('');

    const businessName = Array.isArray(params.businessName)
        ? params.businessName[0]
        : params.businessName || "DORIS SALON AND KINYOZI";
    const ownerName = Array.isArray(params.ownerName)
        ? params.ownerName[0]
        : params.ownerName || "Doris";

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await apiService.getCurrentUser();
            if (user && user.name) {
                setUserName(user.name);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }
    };

    const displayName = userName || ownerName;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Blue Header Section */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={['#1e3a8a', '#1e3a8a']} // Solid deep blue as per screenshot
                        style={styles.headerGradient}
                    >
                        <View style={styles.profileSection}>
                            <View style={styles.avatarBorder}>
                                <Image
                                    source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }}
                                    style={styles.avatar}
                                />
                            </View>
                            <Text style={styles.greetingText}>Good Morning, {displayName} 👋</Text>
                        </View>

                        {/* White Curved Card for Business Name */}
                        <View style={styles.businessCard}>
                            <Text style={styles.businessNameText}>{businessName.toUpperCase()}</Text>
                            <View style={styles.orangeUnderline} />
                        </View>
                    </LinearGradient>
                </View>

                {/* Todays Summary Section */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryHeader}>Todays Summary</Text>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <View style={styles.summaryValueContainer}>
                                    <Text style={styles.emoji}>💰</Text>
                                    <Text style={styles.currencyValue}>KES 0</Text>
                                </View>
                                <Text style={styles.summaryLabel}>Income</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <View style={styles.summaryValueContainer}>
                                    <Text style={styles.emoji}>💸</Text>
                                    <Text style={styles.currencyValue}>KES 0</Text>
                                </View>
                                <Text style={styles.summaryLabel}>Expenses</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <View style={styles.summaryValueContainer}>
                                    <Text style={styles.emoji}>📊</Text>
                                    <Text style={styles.currencyValue}>KES 0</Text>
                                </View>
                                <Text style={styles.summaryLabel}>Balance</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>CashSale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Credit Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Add Expense</Text>
                    </TouchableOpacity>
                </View>

                {/* Management Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridRow}>
                        <GridItem emoji="👤" label="Customers" />
                        <GridItem emoji="👨‍👩‍👧‍👦" label="Suppliers" />
                        <GridItem emoji="💰" label="Expenses" />
                    </View>
                    <View style={styles.gridRow}>
                        <GridItem emoji="📈" label="Reports" />
                        <GridItem emoji="📥" label="Income" />
                        <GridItem emoji="⋮" label="MORE" />
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.activitySection}>
                    <View style={styles.activityContainer}>
                        <Text style={styles.activityTitle}>Recent Activity</Text>
                        {mockActivity.map((item) => (
                            <View key={item.id} style={styles.activityItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                                <Text style={styles.activityText}>
                                    {item.time} - {item.description} · KES {item.amount}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Apbc</Text>
                    <View style={styles.footerIcon}>
                        <Text style={styles.footerIconText}>A</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

function GridItem({ emoji, label }: { emoji: string; label: string }) {
    return (
        <TouchableOpacity style={styles.gridItem}>
            <View style={styles.gridIconCircle}>
                <Text style={styles.gridEmoji}>{emoji}</Text>
            </View>
            <Text style={styles.gridLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        height: 250,
    },
    headerGradient: {
        flex: 1,
        paddingTop: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarBorder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#f59e0b',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    avatar: {
        width: 74,
        height: 74,
        borderRadius: 37,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f59e0b',
        marginTop: 12,
    },
    businessCard: {
        position: 'absolute',
        bottom: -15,
        backgroundColor: '#fff',
        width: '85%',
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    businessNameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e3a8a',
        letterSpacing: 1,
    },
    orangeUnderline: {
        width: 150,
        height: 3,
        backgroundColor: '#f59e0b',
        marginTop: 4,
    },
    summarySection: {
        marginTop: 40,
        paddingHorizontal: 15,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    summaryHeader: {
        textAlign: 'center',
        fontSize: 12,
        color: '#1e3a8a',
        fontWeight: '600',
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        marginHorizontal: 4,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    emoji: {
        fontSize: 14,
        marginRight: 4,
    },
    currencyValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    summaryLabel: {
        fontSize: 11,
        color: '#64748b',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 25,
    },
    actionButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        width: (width - 60) / 3,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    gridContainer: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    gridItem: {
        alignItems: 'center',
        width: (width - 60) / 3,
    },
    gridIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridEmoji: {
        fontSize: 28,
    },
    gridLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    activitySection: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    activityContainer: {
        borderWidth: 2,
        borderColor: '#1e3a8a',
        borderRadius: 15,
        padding: 15,
    },
    activityTitle: {
        fontSize: 14,
        color: '#1e3a8a',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    activityText: {
        fontSize: 12,
        color: '#374151',
        marginLeft: 8,
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        fontSize: 10,
        color: '#94a3b8',
        marginRight: 6,
    },
    footerIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerIconText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
