
import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
    TextInput, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Modal,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

type Account = { id: string | number; name: string; code?: string; type?: string; subtype?: string;[key: string]: any; };

type ExpenseType = 'Expense' | 'Stock Purchase' | 'Other';
type TaxTreatment = 'Exclusive of Tax' | 'Inclusive of Tax' | 'Out of Scope of Tax';

type LineItem = {
    id: string;
    categoryId: string | null;
    description: string;
    taxTreatment: TaxTreatment;
    vatRateId: string | null;
    memo: string;
    amount: string;
};

export default function WriteChequeScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Data
    const [vendors, setVendors] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
    const [inventoryAccounts, setInventoryAccounts] = useState<Account[]>([]);
    const [otherAssetAccounts, setOtherAssetAccounts] = useState<Account[]>([]);
    const [vatRates, setVatRates] = useState<any[]>([]);
    const [userTenantId, setUserTenantId] = useState<number | null>(null);

    // Form State
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
    const [chequeNumber, setChequeNumber] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [expenseType, setExpenseType] = useState<ExpenseType>('Expense');

    // Line Items
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', categoryId: null, description: '', taxTreatment: 'Exclusive of Tax', vatRateId: null, memo: '', amount: '' }
    ]);

    // Modals State
    const [showBankModal, setShowBankModal] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [showTaxTreatmentModal, setShowTaxTreatmentModal] = useState(false);
    const [editingLineIndex, setEditingLineIndex] = useState(0);

    // Helper to calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalVat = 0;

        lineItems.forEach(item => {
            const amount = parseFloat(item.amount) || 0;

            if (item.taxTreatment === 'Out of Scope of Tax') {
                subtotal += amount;
            } else {
                const vatRate = item.vatRateId ? vatRates.find(v => String(v.id) === item.vatRateId) : null;
                const rate = vatRate ? parseFloat(vatRate.rate) : 0;

                if (item.taxTreatment === 'Inclusive of Tax') {
                    const base = amount / (1 + rate / 100);
                    subtotal += base;
                    totalVat += (amount - base);
                } else {
                    subtotal += amount;
                    totalVat += (amount * (rate / 100));
                }
            }
        });

        return { subtotal, totalVat, total: subtotal + totalVat };
    };

    const { subtotal, totalVat, total } = calculateTotals();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setPageLoading(true);
        try {
            const user = await apiService.getCurrentUser();
            setUserTenantId(user?.tenantId || null);

            const [vendorsData, accountsData, vatRatesData] = await Promise.all([
                apiService.getVendors({ active: true }),
                apiService.getAccounts(),
                apiService.getVatRates()
            ]);

            setVendors(vendorsData || []);
            setVatRates(vatRatesData || []);

            // Filter Accounts
            const banks = accountsData.filter((a: any) =>
                a.type === 'ASSET' && (a.subtype === 'bank' || a.subtype === 'cash' || a.name.toLowerCase().includes('bank') || a.systemTag === 'CASH')
            );
            setBankAccounts(banks);

            const expenses = accountsData.filter((a: any) => a.type === 'EXPENSE');
            setExpenseAccounts(expenses);

            const inventory = accountsData.filter((a: any) =>
                a.type === 'ASSET' && (a.name.toLowerCase().includes('inventory') || a.code?.startsWith('12') || a.subtype === 'inventory')
            );
            setInventoryAccounts(inventory);

            const assets = accountsData.filter((a: any) =>
                a.type === 'ASSET' &&
                !a.name.toLowerCase().includes('inventory') &&
                !a.code?.startsWith('12') &&
                a.subtype !== 'bank' &&
                a.subtype !== 'cash' &&
                a.systemTag !== 'CASH'
            );
            setOtherAssetAccounts(assets);

            // Default Bank
            if (banks.length > 0) setSelectedBankAccountId(String(banks[0].id));

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setPageLoading(false);
        }
    };

    const addLineItem = () => {
        // Default category based on type
        let defaultCat = null;
        if (expenseType === 'Expense' && expenseAccounts.length > 0) defaultCat = String(expenseAccounts[0].id);
        else if (expenseType === 'Stock Purchase' && inventoryAccounts.length > 0) defaultCat = String(inventoryAccounts[0].id);
        else if (expenseType === 'Other' && otherAssetAccounts.length > 0) defaultCat = String(otherAssetAccounts[0].id);

        setLineItems([...lineItems, {
            id: Date.now().toString(),
            categoryId: defaultCat,
            description: '',
            taxTreatment: 'Exclusive of Tax',
            vatRateId: vatRates.length > 0 ? String(vatRates[0].id) : null,
            memo: '',
            amount: ''
        }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...lineItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setLineItems(newItems);
    };

    const handleClear = () => {
        setChequeNumber('');
        setSelectedVendorId('');
        setLineItems([{ id: '1', categoryId: null, description: '', taxTreatment: 'Exclusive of Tax', vatRateId: null, memo: '', amount: '' }]);
    };

    const handleSave = async (shouldReset: boolean = false) => {
        if (!selectedVendorId || !selectedBankAccountId || !chequeNumber || total <= 0) {
            Alert.alert('Missing Fields', 'Please fill Payee, Bank Account, Cheque Number, and Amount.');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Items Payload
            const itemsPayload = lineItems.map(item => {
                const amount = parseFloat(item.amount) || 0;
                let baseAmount = amount;
                let vatAmount = 0;

                if (item.taxTreatment !== 'Out of Scope of Tax' && item.vatRateId) {
                    const vatRate = vatRates.find(v => String(v.id) === item.vatRateId);
                    const rate = vatRate ? parseFloat(vatRate.rate) : 0;
                    if (item.taxTreatment === 'Inclusive of Tax') {
                        baseAmount = amount / (1 + rate / 100);
                        vatAmount = amount - baseAmount;
                    } else {
                        vatAmount = amount * (rate / 100);
                    }
                }

                return {
                    description: item.description || item.memo || expenseType,
                    quantity: 1,
                    unitPrice: baseAmount,
                    accountId: item.categoryId ? parseInt(String(item.categoryId).replace(/\D/g, '')) : null,
                    taxTreatment: item.taxTreatment,
                    vatRateId: item.vatRateId ? parseInt(String(item.vatRateId)) : null,
                    vatAmount,
                    totalAmount: baseAmount + vatAmount
                };
            });

            const purchaseFormData = new FormData();
            purchaseFormData.append('vendorId', selectedVendorId);
            purchaseFormData.append('purchaseDate', date.toISOString());
            purchaseFormData.append('dueDate', date.toISOString());
            purchaseFormData.append('billNumber', `CHQ-${chequeNumber}`);
            purchaseFormData.append('notes', itemsPayload[0].description || `Cheque #${chequeNumber}`);
            purchaseFormData.append('status', 'UNPAID');
            purchaseFormData.append('items', JSON.stringify(itemsPayload));

            const purchase = await apiService.createPurchase(purchaseFormData);

            if (purchase && purchase.id) {
                await apiService.createPurchasePayment(purchase.id, {
                    amount: total,
                    paymentDate: date.toISOString(),
                    paymentMethod: 'Cheque',
                    reference: chequeNumber,
                    notes: itemsPayload[0].description,
                    bankAccountId: selectedBankAccountId
                });

                if (userTenantId) {
                    const vendor = vendors.find(v => String(v.id) === selectedVendorId);
                    await apiService.createCheque({
                        tenantId: userTenantId,
                        chequeNumber,
                        payee: vendor?.name || 'Unknown',
                        amount: total,
                        dueDate: date.toISOString(),
                        bankAccountId: parseInt(selectedBankAccountId),
                        purpose: itemsPayload[0].description || 'Expense Payment',
                        notes: `Linked to Purchase #${purchase.id}`,
                        reference: String(purchase.id)
                    });
                }
            }

            Alert.alert('Success', 'Cheque Saved', [
                {
                    text: 'OK',
                    onPress: () => {
                        if (shouldReset) {
                            handleClear();
                            const nextNum = parseInt(chequeNumber) + 1;
                            if (!isNaN(nextNum)) setChequeNumber(String(nextNum).padStart(4, '0'));
                        } else {
                            router.back();
                        }
                    }
                }
            ]);

        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to save cheque');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Helper to get current options
    const getCurrentCategoryOptions = () => {
        const currentAccounts = expenseType === 'Expense' ? expenseAccounts : expenseType === 'Stock Purchase' ? inventoryAccounts : otherAssetAccounts;
        return currentAccounts.map(acc => ({ label: acc.name, value: String(acc.id) }));
    };

    if (pageLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#122f8a" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FE9900" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Write Cheque</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Top Inputs */}
                    <View style={styles.topGrid}>
                        <View style={styles.row}>
                            <View style={[styles.fieldCol, { flex: 1.5 }]}>
                                <Text style={styles.inputLabel}>Account</Text>
                                <TouchableOpacity style={styles.underlineInput} onPress={() => setShowBankModal(true)}>
                                    <Text style={styles.pickerText} numberOfLines={1}>
                                        {selectedBankAccountId ? bankAccounts.find(a => String(a.id) === selectedBankAccountId)?.name : "Select..."}
                                    </Text>
                                    <Ionicons name="chevron-down" size={14} color="#334155" />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.fieldCol, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Cheque No</Text>
                                <TextInput
                                    style={styles.textInputUnderline}
                                    value={chequeNumber}
                                    onChangeText={setChequeNumber}
                                    placeholder="0001"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.fieldCol, { flex: 1.5 }]}>
                                <Text style={styles.inputLabel}>Payee</Text>
                                <TouchableOpacity style={styles.underlineInput} onPress={() => setShowVendorModal(true)}>
                                    <Text style={styles.pickerText} numberOfLines={1}>
                                        {selectedVendorId ? vendors.find(v => String(v.id) === selectedVendorId)?.name : "Select..."}
                                    </Text>
                                    <Ionicons name="chevron-down" size={14} color="#334155" />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.fieldCol, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Date</Text>
                                <TouchableOpacity style={styles.underlineInput}>
                                    <Text style={styles.dateText}>{formatDate(date)}</Text>
                                    <Ionicons name="calendar-outline" size={18} color="#334155" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        {['Expense', 'Stock Purchase', 'Other'].map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.tab, expenseType === type && styles.activeTab]}
                                onPress={() => setExpenseType(type as ExpenseType)}
                            >
                                <Text style={[styles.tabText, expenseType === type && styles.activeTabText]}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Line Items - Using Card Style from Bill Entry */}
                    {lineItems.map((item, index) => (
                        <View key={item.id} style={styles.lineItemCard}>
                            {/* Row 1: Category & Description */}
                            <View style={styles.lineRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>
                                        {expenseType === 'Stock Purchase' ? 'Stock Item' : expenseType === 'Other' ? 'Asset Account' : 'Expense Category'}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.selectBox}
                                        onPress={() => {
                                            setEditingLineIndex(index);
                                            setShowCategoryModal(true);
                                        }}
                                    >
                                        <Text style={styles.selectText} numberOfLines={1}>
                                            {item.categoryId
                                                ? getCurrentCategoryOptions().find(o => o.value === String(item.categoryId))?.label || 'Select'
                                                : "Select..."}
                                        </Text>
                                        <Ionicons name="chevron-down" size={16} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.label}>Description/Memo</Text>
                                    <TextInput
                                        style={styles.lineInput}
                                        placeholder="Description..."
                                        placeholderTextColor="#94a3b8"
                                        value={item.description}
                                        onChangeText={(txt) => updateLineItem(index, 'description', txt)}
                                    />
                                </View>
                            </View>

                            {/* Row 2: Tax & Amount */}
                            <View style={styles.lineRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Tax Type</Text>
                                    <TouchableOpacity
                                        style={styles.selectBox}
                                        onPress={() => {
                                            setEditingLineIndex(index);
                                            setShowTaxTreatmentModal(true);
                                        }}
                                    >
                                        <Text style={styles.selectText} numberOfLines={1}>{item.taxTreatment}</Text>
                                        <Ionicons name="chevron-down" size={16} color="#64748b" />
                                    </TouchableOpacity>
                                </View>

                                {item.taxTreatment !== 'Out of Scope of Tax' && (
                                    <View style={{ flex: 0.8, marginLeft: 12 }}>
                                        <Text style={styles.label}>VAT Rate</Text>
                                        <TouchableOpacity
                                            style={styles.selectBox}
                                            onPress={() => {
                                                setEditingLineIndex(index);
                                                setShowTaxModal(true);
                                            }}
                                        >
                                            <Text style={styles.selectText} numberOfLines={1}>
                                                {item.vatRateId ? vatRates.find(v => String(v.id) === item.vatRateId)?.rate + '%' : 'Select'}
                                            </Text>
                                            <Ionicons name="chevron-down" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.label}>Amount</Text>
                                    <TextInput
                                        style={styles.lineInput}
                                        placeholder="0.00"
                                        placeholderTextColor="#94a3b8"
                                        value={item.amount}
                                        onChangeText={(txt) => updateLineItem(index, 'amount', txt)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {lineItems.length > 1 && (
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeLineItem(index)}>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    <Text style={styles.removeBtnText}>Remove Line</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addLineBtn} onPress={addLineItem}>
                        <Ionicons name="add-circle-outline" size={20} color="#122f8a" />
                        <Text style={styles.addLineText}>Add Line Item</Text>
                    </TouchableOpacity>

                    {/* Totals Card */}
                    <View style={styles.totalsCard}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>VAT:</Text>
                            <Text style={styles.totalValue}>{totalVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={[styles.totalRow, { marginTop: 5 }]}>
                            <Text style={styles.grandTotalLabel}>Total:</Text>
                            <Text style={styles.grandTotalValue}>KES {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.bottomActions}>
                        <TouchableOpacity style={styles.outlineBtn} onPress={handleClear}>
                            <Text style={styles.outlineBtnText}>Clear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.outlineBtn} onPress={() => handleSave(true)}>
                            <Text style={[styles.outlineBtnText, { color: '#122f8a' }]}>Save & New</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.outlineBtn} onPress={() => Alert.alert('Print', 'Printing...')}>
                            <Text style={[styles.outlineBtnText, { color: '#122f8a' }]}>Print/Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.solidBtn} onPress={() => handleSave(false)}>
                            <Text style={styles.solidBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Reused Modals */}
            <SelectionModal
                visible={showBankModal}
                title="Select Account"
                options={bankAccounts.map(a => ({ label: a.name, value: String(a.id) }))}
                onSelect={(val: string) => { setSelectedBankAccountId(val); setShowBankModal(false); }}
                onClose={() => setShowBankModal(false)}
            />
            <SelectionModal
                visible={showVendorModal}
                title="Select Payee"
                options={vendors.map(v => ({ label: v.name, value: String(v.id) }))}
                onSelect={(val: string) => { setSelectedVendorId(val); setShowVendorModal(false); }}
                onClose={() => setShowVendorModal(false)}
            />
            <SelectionModal
                visible={showCategoryModal}
                title="Select Category"
                options={getCurrentCategoryOptions()}
                onSelect={(val: string) => { updateLineItem(editingLineIndex, 'categoryId', val); setShowCategoryModal(false); }}
                onClose={() => setShowCategoryModal(false)}
            />
            <SelectionModal
                visible={showTaxTreatmentModal}
                title="Tax Treatment"
                options={[
                    { label: 'Exclusive of Tax', value: 'Exclusive of Tax' },
                    { label: 'Inclusive of Tax', value: 'Inclusive of Tax' },
                    { label: 'Out of Scope of Tax', value: 'Out of Scope of Tax' }
                ]}
                onSelect={(val: string) => { updateLineItem(editingLineIndex, 'taxTreatment', val); setShowTaxTreatmentModal(false); }}
                onClose={() => setShowTaxTreatmentModal(false)}
            />
            <SelectionModal
                visible={showTaxModal}
                title="Select Tax Rate"
                options={vatRates.map(v => ({ label: `${v.name} (${v.rate}%)`, value: String(v.id) }))}
                onSelect={(val: string) => { updateLineItem(editingLineIndex, 'vatRateId', val); setShowTaxModal(false); }}
                onClose={() => setShowTaxModal(false)}
            />

        </SafeAreaView>
    );
}

// Simple Reusable Modal Component
const SelectionModal = ({ visible, title, options, onSelect, onClose }: any) => (
    <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={styles.modal}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#1e293b" />
                    </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 400 }}>
                    {options.map((opt: any) => (
                        <TouchableOpacity key={opt.value} style={styles.modalItem} onPress={() => onSelect(opt.value)}>
                            <Text style={styles.modalItemText}>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </TouchableOpacity>
    </Modal>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    // Header
    header: {
        height: Platform.OS === 'android' ? 90 : 100,
        backgroundColor: '#122f8a',
        paddingTop: Platform.OS === 'android' ? 40 : 50,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: { color: '#FE9900', fontSize: 18, fontWeight: 'bold' },
    backBtn: { padding: 5 },

    content: { padding: 20 },

    // Top Grid
    topGrid: { marginBottom: 20 },
    row: { flexDirection: 'row', gap: 20, marginBottom: 20 },
    fieldCol: {},
    inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },

    underlineInput: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontSize: 14, color: '#334155', flex: 1 },
    textInputUnderline: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingVertical: 8, fontSize: 14, color: '#334155' },
    dateText: { fontSize: 14, color: '#334155' },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 25,
        padding: 2,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#94a3b8',
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 23 },
    activeTab: { backgroundColor: '#FE9900' },
    tabText: { fontSize: 13, color: '#475569', fontWeight: '600' },
    activeTabText: { color: '#fff' },

    // Line Item Card (FROM BILL ENTRY STYLE)
    lineItemCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    lineRow: {
        flexDirection: isSmallScreen ? 'column' : 'row',
        marginBottom: 12,
        gap: isSmallScreen ? 12 : 0,
    },
    label: { fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: '600' },
    selectBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectText: { fontSize: 14, color: '#1e293b', flex: 1 },
    lineInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,  // Slightly smaller so it aligns nicely
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 14,
        color: '#1e293b',
    },
    removeBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, marginTop: 5 },
    removeBtnText: { color: '#ef4444', fontWeight: '600', marginLeft: 6, fontSize: 13 },

    // Add Buitton
    addLineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#122f8a',
        borderStyle: 'dashed',
        marginBottom: 20,
    },
    addLineText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#122f8a' },

    // Totals Card
    totalsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000', shadowOpacity: 0.05, elevation: 2
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    totalLabel: { fontSize: 14, color: '#64748b' },
    totalValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
    grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    grandTotalValue: { fontSize: 18, fontWeight: '700', color: '#122f8a' },

    // Bottom Actions
    bottomActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, gap: 5 },
    outlineBtn: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1', flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    outlineBtnText: { fontSize: 11, fontWeight: '600', color: '#475569', textAlign: 'center' },
    solidBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#122f8a', flex: 1, alignItems: 'center', justifyContent: 'center' },
    solidBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalItemText: { fontSize: 15, color: '#334155' },
});
