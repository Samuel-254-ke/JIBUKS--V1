
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
type TaxTreatment = 'Exclusive of Tax' | 'Inclusive of Tax' | 'Out of Scope of Tax';

type LineItem = {
    id: string;
    categoryId: string | null;
    description: string;
    quantity: string;
    unitPrice: string; // Rate
    taxTreatment: TaxTreatment;
    vatRateId: string | null;
    amount: string; // Calculated: Qty * UnitPrice (adjusted for tax)
};

export default function CashPurchaseScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'form' | 'receipt'>('form');
    const [lastPurchaseData, setLastPurchaseData] = useState<any>(null);

    // Data
    const [vendors, setVendors] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
    const [allAccounts, setAllAccounts] = useState<Account[]>([]); // Merged for "Item" selection
    const [vatRates, setVatRates] = useState<any[]>([]);
    const [userTenantId, setUserTenantId] = useState<number | null>(null);

    // Form State
    const [purchaseNo, setPurchaseNo] = useState('');
    const [selectedVendorId, setSelectedVendorId] = useState<string>('');
    const [date, setDate] = useState(new Date());
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
    const [isVatInclusive, setIsVatInclusive] = useState(false);

    // Bottom Fields
    const [messageToSupplier, setMessageToSupplier] = useState('');
    const [memo, setMemo] = useState('');

    // Line Items
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { id: '1', categoryId: null, description: '', quantity: '1', unitPrice: '', taxTreatment: 'Exclusive of Tax', vatRateId: null, amount: '' }
    ]);

    // Modals
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showVatModal, setShowVatModal] = useState(false);
    const [showTaxTreatmentModal, setShowTaxTreatmentModal] = useState(false);
    const [editingLineIndex, setEditingLineIndex] = useState(0);

    // New Item State
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemType, setNewItemType] = useState<'EXPENSE' | 'ASSET' | 'EQUITY' | 'LIABILITY' | 'REVENUE'>('EXPENSE');

    // Initial Load
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

            // Purchase Items: Expenses + Inventory + Fixed Assets (Merged List)
            const purchaseableAccounts = accountsData.filter((a: any) =>
                a.type === 'EXPENSE' ||
                (a.type === 'ASSET' && a.code?.startsWith('12')) || // Inventory
                (a.type === 'ASSET' && !a.systemTag && !a.name.toLowerCase().includes('bank') && !a.name.toLowerCase().includes('cash')) // Other assets
            );
            setAllAccounts(purchaseableAccounts);

            if (banks.length > 0) setSelectedBankAccountId(String(banks[0].id));

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load data');
        } finally {
            setPageLoading(false);
        }
    };

    // Calculations
    const calculateTotals = () => {
        let subtotal = 0;
        let totalVat = 0;

        lineItems.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.unitPrice) || 0;
            const lineAmount = qty * rate;

            if (item.taxTreatment === 'Out of Scope of Tax') {
                subtotal += lineAmount;
            } else {
                const vatRateObj = item.vatRateId ? vatRates.find(v => String(v.id) === item.vatRateId) : null;
                const vatPct = vatRateObj ? parseFloat(vatRateObj.rate) : 0;

                if (isVatInclusive) {
                    const base = lineAmount / (1 + vatPct / 100);
                    subtotal += base;
                    totalVat += (lineAmount - base);
                } else {
                    subtotal += lineAmount;
                    totalVat += (lineAmount * (vatPct / 100));
                }
            }
        });

        return { subtotal, totalVat, total: subtotal + totalVat };
    };

    const { subtotal, totalVat, total } = calculateTotals();

    // Line Item Handlers
    const addLineItem = () => {
        setLineItems([...lineItems, {
            id: Date.now().toString(),
            categoryId: null,
            description: '',
            quantity: '1',
            unitPrice: '',
            taxTreatment: 'Exclusive of Tax',
            vatRateId: vatRates.length > 0 ? String(vatRates[0].id) : null,
            amount: ''
        }]);
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...lineItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setLineItems(newItems);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index));
        }
    };


    const handleSaveNewItem = async () => {
        if (!newItemName.trim()) {
            Alert.alert('Validation', 'Please enter an item name');
            return;
        }

        setLoading(true);
        try {
            // Generate a code (simple auto-increment based on type)
            const prefix = newItemType === 'EXPENSE' ? '5' : '1';
            const existingCodes = allAccounts
                .filter((a: any) => a.type === newItemType && a.code && a.code.startsWith(prefix))
                .map((a: any) => parseInt(a.code))
                .filter((c: number) => !isNaN(c));

            let nextCode = newItemType === 'EXPENSE' ? '5900' : '1290'; // Default start if none found
            if (existingCodes.length > 0) {
                nextCode = (Math.max(...existingCodes) + 1).toString();
            }

            const payload = {
                code: nextCode,
                name: newItemName,
                type: newItemType,
                description: 'Quick added item from Cash Purchase',
                currency: 'KES',
                systemAccount: false,
                active: true
            };

            const newAccount = await apiService.createAccount(payload as any);

            // Refresh accounts list
            const accountsData = await apiService.getAccounts();
            // Re-apply filters
            const purchaseableAccounts = accountsData.filter((a: any) =>
                a.type === 'EXPENSE' ||
                (a.type === 'ASSET' && a.code?.startsWith('12')) ||
                (a.type === 'ASSET' && !a.systemTag && !a.name.toLowerCase().includes('bank') && !a.name.toLowerCase().includes('cash'))
            );
            setAllAccounts(purchaseableAccounts);

            // Select the new item
            if (newAccount && newAccount.id) {
                updateLineItem(editingLineIndex, 'categoryId', String(newAccount.id));
            }

            // Cleanup
            setNewItemName('');
            setShowAddItemModal(false);
            setShowCategoryModal(false); // Close the selection modal too

        } catch (error: any) {
            console.error('Failed to add item:', error);
            Alert.alert('Error', 'Failed to save new item. ' + (error.message || ''));
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleClear = () => {
        setPurchaseNo('');
        setSelectedVendorId('');
        setMessageToSupplier('');
        setMemo('');
        setLineItems([{ id: '1', categoryId: null, description: '', quantity: '1', unitPrice: '', taxTreatment: 'Exclusive of Tax', vatRateId: null, amount: '' }]);
    };

    const handleRecordPurchase = async () => {
        if (!selectedVendorId || !selectedBankAccountId || total <= 0) {
            Alert.alert('Missing Fields', 'Please select Supplier, Account, and enter valid items.');
            return;
        }

        setLoading(true);
        try {
            const itemsPayload = lineItems.map(item => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;
                let basePrice = price;
                let vatAmountPerUnit = 0;

                const vatRateObj = vatRates.find(v => String(v.id) === item.vatRateId);
                const vatPct = vatRateObj ? parseFloat(vatRateObj.rate) : 0;

                if (isVatInclusive) {
                    basePrice = price / (1 + vatPct / 100);
                    vatAmountPerUnit = price - basePrice;
                } else {
                    vatAmountPerUnit = price * (vatPct / 100);
                }

                const totalLineVat = vatAmountPerUnit * qty;
                const totalLineBase = basePrice * qty;

                return {
                    description: item.description || 'Purchase Item',
                    quantity: qty,
                    unitPrice: basePrice,
                    accountId: item.categoryId ? parseInt(String(item.categoryId).replace(/\D/g, '')) : null,
                    taxTreatment: isVatInclusive ? 'Inclusive of Tax' : 'Exclusive of Tax',
                    vatRateId: item.vatRateId ? parseInt(String(item.vatRateId)) : null,
                    vatAmount: totalLineVat,
                    totalAmount: totalLineBase + totalLineVat
                };
            });

            const purchaseFormData = new FormData();
            purchaseFormData.append('vendorId', selectedVendorId);
            purchaseFormData.append('purchaseDate', date.toISOString());
            purchaseFormData.append('dueDate', date.toISOString());
            purchaseFormData.append('billNumber', purchaseNo || `CP-${Date.now().toString().slice(-6)}`);
            purchaseFormData.append('notes', memo || 'Cash Purchase');
            purchaseFormData.append('status', 'UNPAID');
            purchaseFormData.append('items', JSON.stringify(itemsPayload));

            const purchase = await apiService.createPurchase(purchaseFormData);

            if (purchase && purchase.id) {
                await apiService.createPurchasePayment(purchase.id, {
                    amount: total,
                    paymentDate: date.toISOString(),
                    paymentMethod: paymentMethod,
                    reference: purchaseNo,
                    notes: memo,
                    bankAccountId: selectedBankAccountId
                });
            }

            setLastPurchaseData({
                purchaseNo: purchaseNo || purchase.billNumber,
                date: date,
                supplierName: vendors.find(v => String(v.id) === selectedVendorId)?.name,
                paymentMethod,
                lineItems,
                subtotal,
                totalVat,
                total
            });

            setViewMode('receipt');

        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'Failed to record purchase');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (pageLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#122f8a" />
            </View>
        );
    }

    // --- RECEIPT VIEW ---
    if (viewMode === 'receipt' && lastPurchaseData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setViewMode('form')} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FE9900" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: '#FE9900' }]}>RECEIPT PREVIEW</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.receiptContent}>
                    <View style={styles.receiptCard}>
                        <View style={styles.receiptHeaderRow}>
                            <Text style={styles.receiptHeaderLabel}>Items</Text>
                        </View>

                        <View style={styles.receiptItemsList}>
                            {lastPurchaseData.lineItems.map((item: LineItem, index: number) => {
                                const qty = parseFloat(item.quantity) || 0;
                                const rate = parseFloat(item.unitPrice) || 0;
                                const amt = qty * rate;
                                const catName = allAccounts.find(o => String(o.id) === String(item.categoryId))?.name || 'Item';

                                return (
                                    <View key={index} style={styles.receiptItemRow}>
                                        <Text style={styles.receiptItemName}>{catName} {item.description ? `- ${item.description}` : ''}</Text>
                                        <View style={styles.receiptItemMath}>
                                            <Text style={styles.receiptItemCalc}>{qty} x {rate}</Text>
                                            <Text style={styles.receiptItemTotal}>KES {amt.toLocaleString()}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={styles.receiptTotalSection}>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>Subtotal</Text>
                                <Text style={styles.receiptValue}>KES {lastPurchaseData.subtotal.toLocaleString()}</Text>
                            </View>
                            <View style={styles.receiptRow}>
                                <Text style={styles.receiptLabel}>VAT (16%)</Text>
                                <Text style={styles.receiptValue}>KES {lastPurchaseData.totalVat.toLocaleString()}</Text>
                            </View>
                            <View style={[styles.receiptRow, styles.receiptGrandTotalRow]}>
                                <Text style={styles.receiptGrandTotalLabel}>TOTAL</Text>
                                <Text style={styles.receiptGrandTotalValue}>KES {lastPurchaseData.total.toLocaleString()}</Text>
                            </View>
                        </View>

                        <View style={styles.receiptMetaSection}>
                            <View style={styles.receiptMetaRow}>
                                <Text style={styles.receiptMetaLabel}>Supplier</Text>
                                <Text style={styles.receiptMetaValue}>{lastPurchaseData.supplierName}</Text>
                            </View>
                            <View style={styles.receiptMetaRow}>
                                <Text style={styles.receiptMetaLabel}>Payment method:</Text>
                                <Text style={styles.receiptMetaValue}>{lastPurchaseData.paymentMethod}</Text>
                            </View>
                            <View style={styles.receiptMetaRow}>
                                <Text style={styles.receiptMetaLabel}>Time:</Text>
                                <Text style={styles.receiptMetaValue}>{formatDate(lastPurchaseData.date)}, {formatTime(lastPurchaseData.date)}</Text>
                            </View>
                            <View style={styles.receiptMetaRow}>
                                <Text style={styles.receiptMetaLabel}>Purchase No:</Text>
                                <Text style={styles.receiptMetaValue}>{lastPurchaseData.purchaseNo}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.receiptActions}>
                        <TouchableOpacity style={styles.receiptActionBtn} onPress={() => { handleClear(); setViewMode('form'); }}>
                            <Text style={styles.receiptActionBtnText}>Save & New</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.receiptActionBtn} onPress={() => Alert.alert('Share', 'Sharing Receipt...')}>
                            <Text style={styles.receiptActionBtnText}>Print/Share</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.receiptFooter}>
                        <Text style={{ fontSize: 10, color: '#94a3b8' }}>Powered by Jibuks</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // --- FORM VIEW ---
    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FE9900" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cash Purchase</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 12, marginRight: 5 }}>No.</Text>
                    <TextInput
                        style={styles.headerInput}
                        value={purchaseNo}
                        onChangeText={setPurchaseNo}
                        placeholder="..."
                        placeholderTextColor="rgba(255,255,255,0.5)"
                    />
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Top Fields */}
                    <View style={styles.card}>
                        {/* Row 1 */}
                        <View style={styles.row}>
                            <View style={styles.fieldCol}>
                                <Text style={styles.label}>Supplier</Text>
                                <TouchableOpacity style={styles.selectInput} onPress={() => setShowVendorModal(true)}>
                                    <Text style={styles.selectText} numberOfLines={1}>{selectedVendorId ? vendors.find(v => String(v.id) === selectedVendorId)?.name : 'Select Supplier'}</Text>
                                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.fieldCol}>
                                <Text style={styles.label}>Date</Text>
                                <TouchableOpacity style={styles.selectInput}>
                                    <Text style={styles.selectText}>{formatDate(date)}</Text>
                                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Row 2 */}
                        <View style={styles.row}>
                            <View style={styles.fieldCol}>
                                <Text style={styles.label}>Payment Method</Text>
                                <TouchableOpacity style={styles.selectInput} onPress={() => setShowPaymentMethodModal(true)}>
                                    <Text style={styles.selectText}>{paymentMethod}</Text>
                                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.fieldCol}>
                                <Text style={styles.label}>Paid From</Text>
                                <TouchableOpacity style={styles.selectInput} onPress={() => setShowBankModal(true)}>
                                    <Text style={styles.selectText} numberOfLines={1}>{selectedBankAccountId ? bankAccounts.find(a => String(a.id) === selectedBankAccountId)?.name : 'Select Account'}</Text>
                                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Items Details</Text>

                    {/* LINE ITEMS - CARD STYLE */}
                    <View style={{ marginBottom: 20 }}>
                        {lineItems.map((item, index) => {
                            const qty = parseFloat(item.quantity) || 0;
                            const rate = parseFloat(item.unitPrice) || 0;
                            const amt = qty * rate;

                            return (
                                <View key={item.id} style={styles.itemCard}>
                                    {/* Header: Remove Button */}
                                    <View style={styles.itemCardHeader}>
                                        <Text style={styles.itemCardTitle}>Item #{index + 1}</Text>
                                        {lineItems.length > 1 && (
                                            <TouchableOpacity onPress={() => removeLineItem(index)}>
                                                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Row 1: Item Selection */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Item / Account</Text>
                                        <TouchableOpacity style={styles.pickerBtn} onPress={() => { setEditingLineIndex(index); setShowCategoryModal(true); }}>
                                            <Text style={styles.pickerBtnText} numberOfLines={1}>
                                                {item.categoryId ? allAccounts.find(o => String(o.id) === String(item.categoryId))?.name : 'Select Item...'}
                                            </Text>
                                            <Ionicons name="chevron-down" size={16} color="#64748b" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Row 2: Description */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Description</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={item.description}
                                            onChangeText={v => updateLineItem(index, 'description', v)}
                                            placeholder="Enter description..."
                                            placeholderTextColor="#cbd5e1"
                                        />
                                    </View>

                                    {/* Row 3: Qty | Rate | Amount */}
                                    <View style={styles.rowGrid}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>Qty</Text>
                                            <TextInput
                                                style={styles.textInput}
                                                value={item.quantity}
                                                onChangeText={v => updateLineItem(index, 'quantity', v)}
                                                keyboardType="numeric"
                                                placeholder="0"
                                            />
                                        </View>
                                        <View style={{ flex: 1.5, marginLeft: 10 }}>
                                            <Text style={styles.inputLabel}>Rate</Text>
                                            <TextInput
                                                style={styles.textInput}
                                                value={item.unitPrice}
                                                onChangeText={v => updateLineItem(index, 'unitPrice', v)}
                                                keyboardType="numeric"
                                                placeholder="0.00"
                                            />
                                        </View>
                                        <View style={{ flex: 1.5, marginLeft: 10 }}>
                                            <Text style={styles.inputLabel}>Amount</Text>
                                            <View style={styles.disabledInput}>
                                                <Text style={styles.disabledInputText}>{amt.toLocaleString()}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Row 4: Tax Treatment | VAT */}
                                    <View style={styles.rowGrid}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.inputLabel}>Tax Treatment</Text>
                                            <TouchableOpacity
                                                style={styles.pickerBtn}
                                                onPress={() => {
                                                    setEditingLineIndex(index);
                                                    // Cycle through or show modal? 
                                                    // For simplicity, let's use a modal or simple toggle logic if confusing, 
                                                    // but user asked for "where we have exclusive, inclusive or out of scope".
                                                    // We can reuse a modal for this.
                                                    setShowTaxTreatmentModal(true);
                                                }}
                                            >
                                                <Text style={styles.pickerBtnText} numberOfLines={1}>{item.taxTreatment}</Text>
                                                <Ionicons name="chevron-down" size={16} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>

                                        {item.taxTreatment !== 'Out of Scope of Tax' && (
                                            <View style={{ flex: 1.5, marginLeft: 10 }}>
                                                <Text style={styles.inputLabel}>VAT Rate</Text>
                                                <TouchableOpacity
                                                    style={styles.pickerBtn}
                                                    onPress={() => { setEditingLineIndex(index); setShowVatModal(true); }}
                                                >
                                                    <Text style={styles.pickerBtnText} numberOfLines={1}>
                                                        {item.vatRateId ? vatRates.find(v => String(v.id) === item.vatRateId)?.rate + '%' : 'Select'}
                                                    </Text>
                                                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>

                                </View>
                            );
                        })}

                        <TouchableOpacity style={styles.addNewItemBtn} onPress={addLineItem}>
                            <Ionicons name="add-circle" size={20} color="#122f8a" />
                            <Text style={styles.addNewItemText}>Add Another Item</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Totals */}
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
                        <View style={styles.totalRow}>
                            <Text style={styles.grandTotalLabel}>Total:</Text>
                            <Text style={styles.grandTotalValue}>KES {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>

                    {/* Bottom Fields */}
                    <View style={styles.card}>
                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.label}>Message to Supplier</Text>
                            <TextInput
                                style={styles.textArea}
                                value={messageToSupplier}
                                onChangeText={setMessageToSupplier}
                                multiline
                                placeholder="Optional message..."
                            />
                        </View>

                        <View>
                            <Text style={styles.label}>Memo</Text>
                            <TextInput
                                style={styles.textArea}
                                value={memo}
                                onChangeText={setMemo}
                                multiline
                                placeholder="Internal notes..."
                            />
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.bottomActions}>
                        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                            <Text style={styles.clearBtnText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.recordBtn} onPress={handleRecordPurchase}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.recordBtnText}>Record Purchase</Text>}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>



            {/* Modals */}
            <SelectionModal
                visible={showBankModal}
                title="Paid From"
                options={bankAccounts.map(a => ({ label: a.name, value: String(a.id) }))}
                onSelect={(val: string) => { setSelectedBankAccountId(val); setShowBankModal(false); }}
                onClose={() => setShowBankModal(false)}
            />
            <SelectionModal
                visible={showVendorModal}
                title="Select Supplier"
                options={vendors.map(v => ({ label: v.name, value: String(v.id) }))}
                onSelect={(val: string) => { setSelectedVendorId(val); setShowVendorModal(false); }}
                onClose={() => setShowVendorModal(false)}
            />
            <SelectionModal
                visible={showCategoryModal}
                title="Select Item"
                options={allAccounts.map(a => ({ label: a.name, value: String(a.id) }))}
                onSelect={(val: string) => { updateLineItem(editingLineIndex, 'categoryId', val); setShowCategoryModal(false); }}
                onClose={() => setShowCategoryModal(false)}
                onAddItem={() => setShowAddItemModal(true)}
            />
            <SelectionModal
                visible={showVatModal}
                title="VAT Rate"
                options={vatRates.map(v => ({ label: `${v.name} (${v.rate}%)`, value: String(v.id) }))}
                onSelect={(val: string) => { updateLineItem(editingLineIndex, 'vatRateId', val); setShowVatModal(false); }}
                onClose={() => setShowVatModal(false)}
            />

            <SelectionModal
                visible={showTaxTreatmentModal}
                title="Tax Treatment"
                options={[
                    { label: 'Exclusive of Tax', value: 'Exclusive of Tax' },
                    { label: 'Inclusive of Tax', value: 'Inclusive of Tax' },
                    { label: 'Out of Scope of Tax', value: 'Out of Scope of Tax' },
                ]}
                onSelect={(val: string) => { updateLineItem(editingLineIndex, 'taxTreatment', val); setShowTaxTreatmentModal(false); }}
                onClose={() => setShowTaxTreatmentModal(false)}
            />
            <SelectionModal
                visible={showPaymentMethodModal}
                title="Payment Method"
                options={['Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card'].map(m => ({ label: m, value: m }))}
                onSelect={(val: string) => { setPaymentMethod(val); setShowPaymentMethodModal(false); }}
                onClose={() => setShowPaymentMethodModal(false)}
            />

            {/* QUICK ADD ITEM POPUP */}
            <Modal visible={showAddItemModal} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.popupOverlay}>
                    <View style={styles.popup}>
                        <View style={styles.popupHeader}>
                            <Text style={styles.popupTitle}>Quick Add Item</Text>
                            <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <Text style={styles.label}>Item Name</Text>
                            <TextInput
                                style={[styles.textArea, { height: 45, marginBottom: 15 }]}
                                value={newItemName}
                                onChangeText={setNewItemName}
                                placeholder="Enter item name..."
                                autoFocus
                            />

                            <Text style={styles.label}>Type</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={[styles.typeBtn, newItemType === 'EXPENSE' && styles.typeBtnActive]}
                                    onPress={() => setNewItemType('EXPENSE')}
                                >
                                    <Text style={[styles.typeBtnText, newItemType === 'EXPENSE' && styles.typeBtnTextActive]}>Expense</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeBtn, newItemType === 'ASSET' && styles.typeBtnActive]}
                                    onPress={() => setNewItemType('ASSET')}
                                >
                                    <Text style={[styles.typeBtnText, newItemType === 'ASSET' && styles.typeBtnTextActive]}>Asset / Stock</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.recordBtn} onPress={handleSaveNewItem}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.recordBtnText}>Save Item</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </SafeAreaView>
    );
}

const SelectionModal = ({ visible, title, options, onSelect, onClose, onAddItem }: any) => (
    <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={styles.modal}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color="#1e293b" />
                    </TouchableOpacity>
                </View>
                {onAddItem && (
                    <TouchableOpacity style={styles.modalAddItemBtn} onPress={onAddItem}>
                        <Ionicons name="add-circle" size={24} color="#122f8a" />
                        <Text style={styles.modalAddItemText}>Add New Item</Text>
                    </TouchableOpacity>
                )}
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
    container: { flex: 1, backgroundColor: '#f1f5f9' },

    // Modals & Popups
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    modalItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalItemText: { fontSize: 15, color: '#334155' },

    popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    popup: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 340, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    popupTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },

    // Add New Item Styles
    typeBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center' },
    typeBtnActive: { backgroundColor: '#122f8a', borderColor: '#122f8a' },
    typeBtnText: { color: '#64748b', fontWeight: '600' },
    typeBtnTextActive: { color: '#fff' },

    modalAddItemBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#f8fafc' },
    modalAddItemText: { marginLeft: 10, color: '#122f8a', fontWeight: 'bold', fontSize: 15 },

    // Header
    header: {
        backgroundColor: '#122f8a',
        paddingTop: Platform.OS === 'android' ? 40 : 50,
        paddingHorizontal: 20,
        paddingBottom: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 10,
    },
    headerTitle: { color: '#FE9900', fontSize: 20, fontWeight: '800' },
    backBtn: { padding: 5 },
    headerInput: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.4)', color: '#fff', width: 70, height: 30, fontSize: 13, textAlign: 'center' },

    content: { padding: 20, paddingBottom: 100 },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 12, marginTop: 10, marginLeft: 4 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },

    // Top Fields
    row: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    fieldCol: { flex: 1 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f8fafc' },
    selectText: { fontSize: 14, color: '#1e293b', fontWeight: '500' },

    // Item Card
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    itemCardTitle: { fontSize: 14, fontWeight: '700', color: '#122f8a' },

    inputGroup: { marginBottom: 12 },
    inputLabel: { fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: '600' },
    pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
    pickerBtnText: { fontSize: 14, color: '#1e293b' },
    textInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 14, color: '#1e293b', backgroundColor: '#fff' },

    rowGrid: { flexDirection: 'row', marginBottom: 12 },
    disabledInput: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'flex-end' },
    disabledInputText: { color: '#64748b', fontWeight: '700' },

    addNewItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, backgroundColor: '#e0e7ff', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#4338ca' },
    addNewItemText: { color: '#4338ca', fontWeight: '700', marginLeft: 8 },


    // Totals
    totalsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    totalValue: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
    grandTotalLabel: { fontSize: 18, fontWeight: '800', color: '#122f8a' },
    grandTotalValue: { fontSize: 18, fontWeight: '800', color: '#122f8a' },

    // Text Areas
    textArea: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, height: 80, backgroundColor: '#fff', textAlignVertical: 'top' },

    // Actions
    bottomActions: { flexDirection: 'row', gap: 15, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
    clearBtn: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 30, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff' },
    clearBtnText: { color: '#64748b', fontWeight: 'bold' },
    recordBtn: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 30, backgroundColor: '#122f8a', shadowColor: '#122f8a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    recordBtnText: { color: '#fff', fontWeight: 'bold' },

    // Receipt Styles
    receiptContent: { padding: 20, alignItems: 'center' },
    receiptCard: { backgroundColor: '#fff', width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 30 },
    receiptHeaderRow: { backgroundColor: '#e2e8f0', padding: 15 },
    receiptHeaderLabel: { fontWeight: 'bold', color: '#1e293b' },
    receiptItemsList: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    receiptItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    receiptItemName: { fontWeight: 'bold', color: '#1e293b', flex: 1 },
    receiptItemMath: { alignItems: 'flex-end' },
    receiptItemCalc: { fontSize: 12, color: '#64748b' },
    receiptItemTotal: { fontWeight: 'bold', color: '#1e293b' },

    receiptTotalSection: { padding: 15, backgroundColor: '#fff' },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    receiptLabel: { color: '#64748b', fontWeight: '600' },
    receiptValue: { color: '#1e293b', fontWeight: 'bold' },
    receiptGrandTotalRow: { backgroundColor: '#cbd5e1', padding: 10, marginTop: 5, borderRadius: 5 },
    receiptGrandTotalLabel: { fontWeight: 'bold', fontSize: 16, color: '#122f8a' },
    receiptGrandTotalValue: { fontWeight: 'bold', fontSize: 16, color: '#122f8a' },

    receiptMetaSection: { padding: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    receiptMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    receiptMetaLabel: { color: '#64748b', fontSize: 13 },
    receiptMetaValue: { color: '#1e293b', fontSize: 13, fontWeight: '600' },

    receiptActions: { flexDirection: 'row', gap: 20 },
    receiptActionBtn: { borderColor: '#FE9900', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, backgroundColor: '#fff3e0' },
    receiptActionBtnText: { color: '#122f8a', fontWeight: 'bold' },
    receiptFooter: { marginTop: 40, alignItems: 'center' }

});
