import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiService from '@/services/api';

export default function AddToGoalScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const goalId = params.goalId as string;

    const [goal, setGoal] = useState<any>(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (goalId) {
            loadGoal();
        }
    }, [goalId]);

    const loadGoal = async () => {
        try {
            setLoading(true);
            const data = await apiService.getGoal(parseInt(goalId));
            setGoal(data);
        } catch (error) {
            console.error('Error loading goal:', error);
            Alert.alert('Error', 'Failed to load goal');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return `KES ${value.toLocaleString()}`;
    };

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        const contributionAmount = parseFloat(amount);
        const newTotal = goal.currentAmount + contributionAmount;

        if (newTotal > goal.targetAmount) {
            Alert.alert(
                'Exceeds Target',
                `This contribution would exceed your goal target. You only need ${formatCurrency(goal.remaining)} more.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Continue Anyway',
                        onPress: () => submitContribution(contributionAmount),
                    },
                ]
            );
            return;
        }

        submitContribution(contributionAmount);
    };

    const submitContribution = async (contributionAmount: number) => {
        try {
            setSubmitting(true);

            const result = await apiService.contributeToGoal(
                parseInt(goalId),
                contributionAmount,
                description || `Contribution to ${goal.name}`
            );

            const isCompleted = result.currentAmount >= result.targetAmount;

            Alert.alert(
                isCompleted ? '🎉 Goal Completed!' : 'Success!',
                isCompleted
                    ? `Congratulations! You've reached your goal of ${formatCurrency(result.targetAmount)}!`
                    : `Added ${formatCurrency(contributionAmount)} to ${goal.name}. You're now at ${result.progress}% of your goal!`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to add contribution');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add to Goal</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={styles.loadingText}>Loading goal...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!goal) {
        return null;
    }

    const progress = parseFloat(goal.progress);
    const remaining = goal.remaining;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add to Goal</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Goal Info Card */}
                <View style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                        <View style={styles.goalIconContainer}>
                            <Ionicons name="trophy" size={32} color="#7c3aed" />
                        </View>
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalName}>{goal.name}</Text>
                            {goal.description && (
                                <Text style={styles.goalDescription}>{goal.description}</Text>
                            )}
                        </View>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Current Progress</Text>
                            <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]} />
                        </View>
                        <View style={styles.amountsRow}>
                            <Text style={styles.currentAmount}>{formatCurrency(goal.currentAmount)}</Text>
                            <Text style={styles.targetAmount}>{formatCurrency(goal.targetAmount)}</Text>
                        </View>
                    </View>

                    {/* Remaining */}
                    <View style={styles.remainingCard}>
                        <Text style={styles.remainingLabel}>Remaining to Goal</Text>
                        <Text style={styles.remainingAmount}>{formatCurrency(remaining)}</Text>
                    </View>
                </View>

                {/* Amount Input */}
                <View style={styles.amountSection}>
                    <Text style={styles.sectionLabel}>Contribution Amount (KES)</Text>
                    <View style={styles.amountInputContainer}>
                        <Text style={styles.currencySymbol}>KES</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor="#d1d5db"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                    </View>
                    {amount && parseFloat(amount) > 0 && (
                        <View style={styles.calculationCard}>
                            <View style={styles.calculationRow}>
                                <Text style={styles.calculationLabel}>Current:</Text>
                                <Text style={styles.calculationValue}>{formatCurrency(goal.currentAmount)}</Text>
                            </View>
                            <View style={styles.calculationRow}>
                                <Text style={styles.calculationLabel}>Adding:</Text>
                                <Text style={[styles.calculationValue, { color: '#7c3aed' }]}>
                                    +{formatCurrency(parseFloat(amount))}
                                </Text>
                            </View>
                            <View style={[styles.calculationRow, styles.calculationTotal]}>
                                <Text style={styles.calculationTotalLabel}>New Total:</Text>
                                <Text style={styles.calculationTotalValue}>
                                    {formatCurrency(goal.currentAmount + parseFloat(amount))}
                                </Text>
                            </View>
                            <View style={styles.calculationRow}>
                                <Text style={styles.calculationLabel}>New Progress:</Text>
                                <Text style={[styles.calculationValue, { color: '#10b981' }]}>
                                    {((goal.currentAmount + parseFloat(amount)) / goal.targetAmount * 100).toFixed(1)}%
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Description (Optional)</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="e.g., Monthly savings"
                        placeholderTextColor="#9ca3af"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Quick Amounts</Text>
                    <View style={styles.quickAmountsGrid}>
                        {[500, 1000, 2000, 5000].map((quickAmount) => (
                            <TouchableOpacity
                                key={quickAmount}
                                style={styles.quickAmountButton}
                                onPress={() => setAmount(quickAmount.toString())}
                            >
                                <Text style={styles.quickAmountText}>{formatCurrency(quickAmount)}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.quickAmountButton, styles.quickAmountButtonSpecial]}
                            onPress={() => setAmount(remaining.toString())}
                        >
                            <Text style={[styles.quickAmountText, { color: '#7c3aed' }]}>
                                Complete Goal
                            </Text>
                            <Text style={[styles.quickAmountSubtext, { color: '#7c3aed' }]}>
                                {formatCurrency(remaining)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="add-circle" size={24} color="#fff" />
                            <Text style={styles.submitButtonText}>Add Contribution</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6b7280',
    },
    content: {
        flex: 1,
    },
    goalCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    goalIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f3e8ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    goalInfo: {
        flex: 1,
    },
    goalName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    goalDescription: {
        fontSize: 14,
        color: '#6b7280',
    },
    progressSection: {
        marginBottom: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    progressPercentage: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7c3aed',
    },
    progressBarContainer: {
        height: 12,
        backgroundColor: '#f3e8ff',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#7c3aed',
        borderRadius: 6,
    },
    amountsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    currentAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    targetAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    remainingCard: {
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    remainingLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4,
    },
    remainingAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f59e0b',
    },
    amountSection: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 12,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#7c3aed',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    calculationCard: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
    },
    calculationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    calculationLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    calculationValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    calculationTotal: {
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
        marginTop: 4,
        marginBottom: 12,
    },
    calculationTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    calculationTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7c3aed',
    },
    section: {
        marginHorizontal: 20,
        marginTop: 20,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1f2937',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    quickAmountsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    quickAmountButton: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
    },
    quickAmountButtonSpecial: {
        backgroundColor: '#f3e8ff',
        borderColor: '#7c3aed',
    },
    quickAmountText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    quickAmountSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    submitButton: {
        backgroundColor: '#7c3aed',
        marginHorizontal: 20,
        marginTop: 24,
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
