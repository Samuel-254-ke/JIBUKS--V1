import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'businessOnboardingComplete';
const { width } = Dimensions.get('window');

export default function BusinessOnboardingSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Fetch information from params (passed from previous tabs)
    const businessName = params.businessName || '[Business Name]';
    const industry = params.industry || '[Industry Name]';
    const currency = params.currency || 'KES';
    const template = params.styleChoice === 'simple' ? 'Simple Style' : 'Detailed Style';

    const handleStart = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.replace({
            pathname: '/business-tabs/business-dashboard',
            params: {
                businessName,
                ownerName: 'Doris' // Default for now as per design
            }
        });
    };

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <View style={styles.infoRow}>
            <View style={styles.checkIconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
            </View>
            <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{label}:</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Blue Header Section */}
            <LinearGradient
                colors={['#1e3a8a', '#2563eb']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.title}>You're all set! 🥳</Text>
                    <Text style={styles.subtitle}>Your business accounting is ready</Text>
                </View>
            </LinearGradient>

            {/* White Card Section */}
            <View style={styles.card}>
                <View style={styles.successCard}>
                    <InfoRow label="Business" value={businessName as string} />
                    <InfoRow label="Industry" value={industry as string} />
                    <InfoRow label="Currency" value={currency as string} />
                    <InfoRow label="Template" value={template} />
                </View>

                <View style={styles.nextStepContainer}>
                    <Text style={styles.nextStepHeader}>Next: Add your first sale to get started.</Text>
                    <Text style={styles.nextStepSub}>
                        We'll customize everything based on your industry with the right accounts & features.
                    </Text>
                </View>

                {/* Start Button */}
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStart}
                    activeOpacity={0.8}
                >
                    <Text style={styles.startButtonText}>Start Using JiBUks</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Apbc</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3a8a',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 60,
        alignItems: 'center',
        paddingTop: 20, // Reduced as SafeAreaView handles top spacing
    },
    headerContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#f59e0b',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#ffffff',
        textAlign: 'center',
        opacity: 0.9,
    },
    card: {
        flex: 1,
        backgroundColor: '#ffffff',
        marginTop: -30,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },
    successCard: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 32,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkIconContainer: {
        marginRight: 16,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    nextStepContainer: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    nextStepHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 8,
    },
    nextStepSub: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 20,
    },
    startButton: {
        backgroundColor: '#1e3a8a',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 35,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    startButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
    },
});
