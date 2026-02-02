/**
 * B-013: Quick POS cash sale
 * Create invoice + record full payment in one flow.
 * CoA: (1) Create invoice → DR Accounts Receivable, CR Revenue.
 *      (2) Record payment → DR Cash/Bank, CR Accounts Receivable.
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

type LineItem = { description: string; quantity: string; unitPrice: string };

export default function CashSaleScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [items, setItems] = useState<LineItem[]>([
        { description: '', quantity: '1', unitPrice: '' },
    ]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [custRes, acc] = await Promise.all([
                apiService.getCustomers(),
                apiService.getPaymentEligibleAccounts(),
            ]);
            const custList = Array.isArray(custRes) ? custRes : (custRes?.customers ?? []);
            const accList = Array.isArray(acc) ? acc : (acc ?? []);
            setCustomers(custList);
            setAccounts(accList);
            if (accList.length > 0 && !accountId) setAccountId(String(accList[0].id));
            if (custList.length > 0 && !customerId) setCustomerId(String(custList[0].id));
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load customers and accounts');
        }
    };

    const addLine = () => {
        setItems([...items, { description: '', quantity: '1', unitPrice: '' }]);
    };

    const removeLine = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof LineItem, value: string) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: value };
        setItems(next);
    };

    const subtotal = items.reduce((sum, row) => {
        const q = parseFloat(row.quantity) || 0;
        const p = parseFloat(row.unitPrice) || 0;
        return sum + q * p;
    }, 0);
    const total = subtotal;

    const handleCompleteSale = async () => {
        if (!customerId) {
            Alert.alert('Error', 'Please select a customer');
            return;
        }
        const validItems = items.filter(
            (r) => r.description.trim() && r.quantity && r.unitPrice && parseFloat(r.quantity) > 0 && parseFloat(r.unitPrice) >= 0
        );
        if (validItems.length === 0) {
            Alert.alert('Error', 'Add at least one item with description, quantity and price');
            return;
        }
        if ((accounts ?? []).length === 0) {
            Alert.alert(
                'Setup Required',
                'No payment accounts (Cash/Bank) found. Please complete business setup so the Chart of Accounts is seeded, then try again.'
            );
            return;
        }
        const payAccountId = accountId ? parseInt(accountId) : undefined;
        if (!payAccountId) {
            Alert.alert('Error', 'Please select a payment account (e.g. Cash or Bank) so the sale posts to the correct account.');
            return;
        }

        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const invoiceData = {
                customerId: parseInt(customerId),
                invoiceDate: today,
                dueDate: today,
                items: validItems.map((r) => ({
                    description: r.description.trim(),
                    quantity: parseFloat(r.quantity),
                    unitPrice: parseFloat(r.unitPrice),
                })),
                tax: 0,
                discount: 0,
                notes: notes.trim() || undefined,
                status: 'UNPAID',
            };
            const invoice = await apiService.createInvoice(invoiceData);
            const invTotal = Number(invoice.total);
            await apiService.recordInvoicePayment(invoice.id, {
                amount: invTotal,
                paymentDate: new Date().toISOString(),
                paymentMethod: 'Cash',
                bankAccountId: payAccountId,
                reference: `Cash sale INV-${invoice.invoiceNumber || invoice.id}`,
                notes: notes.trim() || undefined,
            });
            Alert.alert('Success', `Sale recorded. KES ${invTotal.toLocaleString()}`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e?.error || 'Failed to complete sale');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n: number) => `KES ${n.toLocaleString()}`;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cash Sale</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Customer *</Text>
                <View style={styles.pickerWrap}>
                    <Ionicons name="person-outline" size={20} color="#6b7280" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerScroll}>
                        {(customers ?? []).map((c) => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.chip, customerId === String(c.id) && styles.chipActive]}
                                onPress={() => setCustomerId(String(c.id))}
                            >
                                <Text style={[styles.chipText, customerId === String(c.id) && styles.chipTextActive]} numberOfLines={1}>
                                    {c.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {(customers ?? []).length === 0 && (
                    <Text style={styles.hint}>Add customers first from the Customers screen.</Text>
                )}

                <Text style={styles.sectionTitle}>Items</Text>
                {items.map((row, index) => (
                    <View key={index} style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.descInput]}
                            placeholder="Description"
                            value={row.description}
                            onChangeText={(v) => updateLine(index, 'description', v)}
                        />
                        <TextInput
                            style={[styles.input, styles.qtyInput]}
                            placeholder="Qty"
                            value={row.quantity}
                            onChangeText={(v) => updateLine(index, 'quantity', v)}
                            keyboardType="decimal-pad"
                        />
                        <TextInput
                            style={[styles.input, styles.priceInput]}
                            placeholder="Price"
                            value={row.unitPrice}
                            onChangeText={(v) => updateLine(index, 'unitPrice', v)}
                            keyboardType="decimal-pad"
                        />
                        <TouchableOpacity onPress={() => removeLine(index)} style={styles.removeBtn}>
                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}
                <TouchableOpacity onPress={addLine} style={styles.addRow}>
                    <Ionicons name="add-circle-outline" size={22} color="#1e3a8a" />
                    <Text style={styles.addRowText}>Add item</Text>
                </TouchableOpacity>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>

                <Text style={styles.label}>Payment account (e.g. Cash)</Text>
                <View style={styles.pickerWrap}>
                    <Ionicons name="wallet-outline" size={20} color="#6b7280" />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerScroll}>
                        {(accounts ?? []).map((a) => (
                            <TouchableOpacity
                                key={a.id}
                                style={[styles.chip, accountId === String(a.id) && styles.chipActive]}
                                onPress={() => setAccountId(String(a.id))}
                            >
                                <Text style={[styles.chipText, accountId === String(a.id) && styles.chipTextActive]} numberOfLines={1}>
                                    {a.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                />

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleCompleteSale}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>Complete sale · {formatCurrency(total)}</Text>
                    )}
                </TouchableOpacity>
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
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginTop: 16, marginBottom: 8 },
    pickerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
    },
    customerScroll: { flex: 1, marginLeft: 8 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        marginRight: 8,
    },
    chipActive: { backgroundColor: '#1e3a8a' },
    chipText: { fontSize: 14, color: '#374151' },
    chipTextActive: { color: '#fff' },
    hint: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1f2937',
    },
    descInput: { flex: 2, marginRight: 8 },
    qtyInput: { width: 56, marginRight: 8 },
    priceInput: { flex: 1, marginRight: 8 },
    removeBtn: { padding: 4 },
    addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    addRowText: { marginLeft: 6, fontSize: 14, color: '#1e3a8a', fontWeight: '600' },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        marginBottom: 8,
    },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    totalValue: { fontSize: 18, fontWeight: '700', color: '#1e3a8a' },
    notesInput: { minHeight: 60, textAlignVertical: 'top' },
    submitBtn: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
