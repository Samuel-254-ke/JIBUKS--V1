/**
 * B-015: Returns & refunds (Credit notes)
 * Placeholder until backend supports credit notes; links to invoices for now.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CreditNotesScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Credit Notes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.placeholder}>
                    <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
                    <Text style={styles.placeholderTitle}>Returns & refunds</Text>
                    <Text style={styles.placeholderSub}>
                        Credit notes for returns and refunds will appear here. Use Invoices to manage sales and payments for now.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/invoices')}
                    >
                        <Text style={styles.buttonText}>View Invoices</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
    content: { flex: 1, padding: 24 },
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    placeholderTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
    placeholderSub: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 24,
        lineHeight: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e3a8a',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 24,
        gap: 8,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
