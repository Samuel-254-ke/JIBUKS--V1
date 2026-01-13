import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function TaxAndInvoiceScreen() {
    const router = useRouter();
    const params = useLocalSearchParams(); const [vatChoice, setVatChoice] = useState('yes'); // 'yes' or 'no'
    const [styleChoice, setStyleChoice] = useState('simple'); // 'simple' or 'detailed'

    const handleContinue = () => {
        console.log({ vatChoice, styleChoice });
        // Navigate to success screen with all collected data
        router.push({
            pathname: '/business-tabs/business-onboarding-success',
            params: { ...params, vatChoice, styleChoice }
        });
    };

    const handleBack = () => {
        router.back();
    };

    const RadioButton = ({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) => (
        <TouchableOpacity style={styles.radioContainer} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
            </View>
            <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <LinearGradient
                colors={['#1e3a8a', '#2563eb']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#f59e0b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tax and Invoicing</Text>
                    <View style={styles.placeholder} />
                </View>
                <Text style={styles.subtitle}>Set up invoices and tax handling</Text>
            </LinearGradient>

            {/* Body Card */}
            <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>

                {/* VAT Selection */}
                <View style={styles.section}>
                    <Text style={styles.question}>Do you charge VAT on your sales?</Text>
                    <RadioButton
                        selected={vatChoice === 'yes'}
                        onPress={() => setVatChoice('yes')}
                        label="Yes, I charge VAT (16%)"
                    />
                    <RadioButton
                        selected={vatChoice === 'no'}
                        onPress={() => setVatChoice('no')}
                        label="No, I don't charge VAT"
                    />
                </View>

                {/* Invoice Style Selection */}
                <View style={styles.section}>
                    <Text style={styles.question}>Invoice Style</Text>
                    <RadioButton
                        selected={styleChoice === 'simple'}
                        onPress={() => setStyleChoice('simple')}
                        label="Simple (basic & clean)"
                    />
                    <RadioButton
                        selected={styleChoice === 'detailed'}
                        onPress={() => setStyleChoice('detailed')}
                        label="Detailed (with terms & details)"
                    />
                </View>

                <Text style={styles.helperText}>
                    We'll customize everything based on your industry with the right accounts & features.
                </Text>

                {/* Continue Button */}
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Apbc</Text>
                </View>
            </ScrollView>
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
        paddingBottom: 32,
        paddingTop: 10, // Reduced as SafeAreaView handles top spacing
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f59e0b',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    placeholder: {
        width: 36,
    },
    subtitle: {
        fontSize: 18,
        color: '#ffffff',
        textAlign: 'center',
    },
    card: {
        flex: 1,
        backgroundColor: '#ffffff',
        marginTop: -20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    section: {
        marginBottom: 32,
    },
    question: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioOuterSelected: {
        borderColor: '#2563eb',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2563eb',
    },
    radioLabel: {
        fontSize: 16,
        color: '#4b5563',
    },
    radioLabelSelected: {
        color: '#1f2937',
        fontWeight: '600',
    },
    helperText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    continueButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 24,
    },
    continueButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    footerText: {
        fontSize: 12,
        color: '#9ca3af',
    },
});
