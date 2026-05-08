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
const ACCENT_ORANGE = '#fe9900';
const LIGHT_CARD = '#dbe2f0';
const SUCCESS_GREEN = '#10b981';

// Responsive utility - Perfect 3-column grid calculation
const gridPadding = 16;
const gridGap = 12;
const cardWidth = (width - (gridPadding * 2) - (gridGap * 2)) / 3;

interface ValuationData {
    summary: {
        totalItems: number;
        totalCostValue: number;
        totalRetailValue: number;
    };
}

export default function StockInventoryScreen() {
    const router = useRouter();
    const [valuation, setValuation] = useState<ValuationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Animation State
    const [statIndex, setStatIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const stats = [
        { label: 'Total Stock Value', value: valuation ? `KES ${Number(valuation.summary.totalCostValue).toLocaleString()}` : 'KES 40,000', color: PRIMARY_BLUE },
        { label: 'Items Count', value: valuation ? `${valuation.summary.totalItems} Items` : '3 Items', color: PRIMARY_BLUE },
        { label: 'Low Stock', value: '4 Items', color: '#ff4444', alert: true },
        { label: 'Expiring Soon', value: '2 Items', color: PRIMARY_BLUE },
        { label: 'Dead Stock', value: '4 Items', color: '#ff4444', alert: true },
    ];

    useEffect(() => {
        loadData();
    }, []);

    // Carousel Timer
    useEffect(() => {
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
    }, [valuation]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await apiService.request<ValuationData>('/inventory/valuation/current');
            setValuation(data);
        } catch (error) {
            console.error('Error loading inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number): string => {
        return `KES ${Number(amount).toLocaleString()}`;
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient colors={[PRIMARY_BLUE, '#1a3bb0']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={ACCENT_ORANGE} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* HIDE THE DEFAULT EXPO HEADER */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header */}
            <LinearGradient colors={[PRIMARY_BLUE, '#1a3bb0']} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={28} color={ACCENT_ORANGE} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>STOCK & INVENTORY</Text>
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
                        colors={['#1e3a8a', PRIMARY_BLUE, '#0a1a5c']}
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
                                <Text style={[styles.statPopLabel, stats[statIndex].alert && { color: '#ff4444' }]}>
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
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                    </View>

                    <View style={styles.grid}>
                        <GridItem
                            label="Add Item"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="cube-outline" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -4 }]}>
                                    <Ionicons name="add-circle" size={18} color={ACCENT_ORANGE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/new-inventory-item' as any)}
                        />
                        <GridItem
                            label="Receive Stock"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="truck-fast" size={38} color={ACCENT_ORANGE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <Ionicons name="arrow-down-circle" size={18} color={PRIMARY_BLUE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/receive-stock' as any)}
                        />
                        <GridItem
                            label="Adjust Stock"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="database-edit" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="cog-refresh" size={18} color={ACCENT_ORANGE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/stock-adjustment-bulk' as any)}
                        />
                        <GridItem
                            label="Stock Transfer"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="swap-horizontal-bold" size={38} color={ACCENT_ORANGE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="arrow-right-bold-circle" size={18} color={PRIMARY_BLUE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/stock-transfer' as any)}
                        />
                        <GridItem
                            label="Purchase Order"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="file-document-edit-outline" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="cart-arrow-down" size={18} color={SUCCESS_GREEN} />
                                </View>
                            </View>}
                            onPress={() => router.push('/purchase-order' as any)}
                        />
                        <GridItem
                            label="Sales Order"
                            icon={<View style={styles.complexIcon}>
                                <MaterialCommunityIcons name="cart-variant" size={38} color={PRIMARY_BLUE} />
                                <View style={[styles.orderBadge, { top: 14, right: -6 }]}>
                                    <MaterialCommunityIcons name="arrow-up-bold-circle" size={18} color={ACCENT_ORANGE} />
                                </View>
                            </View>}
                            onPress={() => router.push('/sales-order' as any)}
                        />
                    </View>

                    {/* Navigation Link - Premium Style */}
                    <TouchableOpacity
                        style={styles.listLink}
                        onPress={() => router.push('/inventory-valuation' as any)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#fff', '#f8faff']}
                            style={styles.listLinkGradient}
                        >
                            <View style={styles.listLinkLeft}>
                                <View style={styles.listIconBox}>
                                    <Ionicons name="list" size={20} color={PRIMARY_BLUE} />
                                </View>
                                <Text style={styles.listLinkText}>Inventory List & Reports</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={PRIMARY_BLUE} />
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
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingBottom: 15,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 55,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: ACCENT_ORANGE,
        letterSpacing: 2,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    visualContainer: {
        padding: gridPadding,
        height: 230,
    },
    premiumCardBg: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        ...Platform.select({
            ios: {
                shadowColor: PRIMARY_BLUE,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 15,
            },
            android: {
                elevation: 8,
            }
        })
    },
    decorativeCircle: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    cardOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsPopUpCard: {
        backgroundColor: LIGHT_CARD,
        width: '85%',
        paddingVertical: 24,
        paddingHorizontal: 15,
        borderRadius: 22,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    statPopLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
        textAlign: 'center',
    },
    statPopValue: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    progressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(18, 47, 138, 0.15)',
    },
    content: {
        paddingHorizontal: gridPadding,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#334155',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: gridGap,
    },
    gridItem: {
        width: cardWidth,
        height: cardWidth + 18,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        ...Platform.select({
            ios: {
                shadowColor: PRIMARY_BLUE,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            }
        })
    },
    gridIconBox: {
        marginBottom: 10,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#334155',
        textAlign: 'center',
        lineHeight: 13,
    },
    complexIcon: {
        position: 'relative',
        width: 55,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subIcon: {
        position: 'absolute',
        top: 22,
        right: -2,
    },
    subIconCenter: {
        position: 'absolute',
        top: 8,
        right: -10,
    },
    orderBadge: {
        position: 'absolute',
        right: -4,
        top: 14,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    crownIcon: {
        position: 'absolute',
        top: -2,
        right: -4,
    },
    adjustBadge: {
        position: 'absolute',
        right: -6,
        bottom: -2,
        backgroundColor: ACCENT_ORANGE,
        borderRadius: 12,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    listLink: {
        marginTop: 25,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    listLinkGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    listLinkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    listIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listLinkText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: PRIMARY_BLUE,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    poweredBy: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 10,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoOrb: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: PRIMARY_BLUE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    logoImg: {
        width: 22,
        height: 22,
    },
});
