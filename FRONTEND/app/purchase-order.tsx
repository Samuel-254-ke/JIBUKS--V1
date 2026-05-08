import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Platform, Alert, ActivityIndicator, Modal, Dimensions,
    KeyboardAvoidingView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

const { width, height } = Dimensions.get('window');

// Brand Colors - High Contrast for Readability
const PRIMARY_BLUE = '#122f8a';
const SECONDARY_BLUE = '#1a3bb0';
const ACCENT_ORANGE = '#fe9900';
const LIGHT_BLUE = '#eef2ff';
const BG_WHITE = '#ffffff';
const BG_OFF_WHITE = '#f8fafc';
const TEXT_DARK = '#0f172a';
const TEXT_MUTED = '#64748b';
const BORDER_COLOR = '#e2e8f0';
const SUCCESS_GREEN = '#10b981';

type TaxTreatment = 'Exclusive of Tax' | 'Inclusive of Tax' | 'Out of Scope of Tax';

type LineItem = {
    id: string;
    itemId: string | null;
    description: string;
    quantity: string;
    rate: string;
    amount: string;
    taxTreatment: TaxTreatment;
    vatRateId: string | null;
};

export default function PurchaseOrderScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [vatRates, setVatRates] = useState<any[]>([]);

    // Form State
    const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
    const [email, setEmail] = useState('');
    const [ccBcc, setCcBcc] = useState('');
    const [status, setStatus] = useState('OPEN');
    const [mailingAddress, setMailingAddress] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [shippingAddress, setShippingAddress] = useState('');
    const [poDate, setPoDate] = useState(new Date());
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    const [shipVia, setShipVia] = useState('');
    const [messageToSupplier, setMessageToSupplier] = useState('');
    const [memo, setMemo] = useState('');

    const [lineItems, setLineItems] = useState<LineItem[]>([
        {
            id: '1',
            itemId: null,
            description: '',
            quantity: '1',
            rate: '',
            amount: '0',
            taxTreatment: 'Exclusive of Tax',
            vatRateId: null
        }
    ]);

    // UI Modals
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showVatRateModal, setShowVatRateModal] = useState(false);
    const [showTaxTreatmentModal, setShowTaxTreatmentModal] = useState(false);
    const [showPoDatePicker, setShowPoDatePicker] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [editingLineIndex, setEditingLineIndex] = useState<number>(0);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vendorsData, customersData, itemsData, vatRatesData] = await Promise.all([
                apiService.getVendors({ active: true }),
                apiService.getCustomers({ active: true }),
                apiService.getInventory({ active: true }),
                apiService.getVatRates()
            ]);
            setSuppliers(vendorsData);
            setCustomers(customersData?.customers || customersData || []);
            setInventoryItems(itemsData);
            setVatRates(vatRatesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addLineItem = () => {
        setLineItems(prev => [...prev, {
            id: Date.now().toString(),
            itemId: null,
            description: '',
            quantity: '1',
            rate: '',
            amount: '0',
            taxTreatment: 'Exclusive of Tax',
            vatRateId: null
        }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };

        if (field === 'quantity' || field === 'rate') {
            const q = parseFloat(updated[index].quantity) || 0;
            const r = parseFloat(updated[index].rate) || 0;
            updated[index].amount = (q * r).toFixed(2);
        }

        setLineItems(updated);
    };

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

    const handleSave = async () => {
        if (!selectedSupplierId) {
            Alert.alert('Required', 'Please select a supplier');
            return;
        }

        setLoading(true);
        try {
            const items = lineItems
                .filter(item => parseFloat(item.amount) > 0)
                .map(item => ({
                    itemId: item.itemId,
                    description: item.description,
                    quantity: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.rate),
                    vatRateId: item.vatRateId,
                    taxTreatment: item.taxTreatment
                }));

            const formData = new FormData();
            formData.append('vendorId', String(selectedSupplierId));
            formData.append('purchaseDate', poDate.toISOString());
            formData.append('dueDate', dueDate.toISOString());
            formData.append('notes', memo);
            formData.append('messageToSupplier', messageToSupplier);
            formData.append('status', status);
            formData.append('type', 'PURCHASE_ORDER');
            formData.append('items', JSON.stringify(items));

            await apiService.createPurchase(formData);

            Alert.alert('Success', 'Purchase Order saved successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to save Purchase Order');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header - Solid Gradient for legibility */}
            <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Purchase Order</Text>
                            <Text style={styles.headerSubtitle}>Create New Order</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={styles.currencyLabel}>TOTAL KES</Text>
                            <Text style={styles.headerAmount}>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Supplier & Status Info Section */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.inputGroup, { flex: 1.8 }]}>
                                <Text style={styles.inputLabel}>SUPPLIER</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowSupplierModal(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.dropdownValue} numberOfLines={1}>
                                        {selectedSupplierId ? suppliers.find(s => s.id === selectedSupplierId)?.name : 'Select Supplier'}
                                    </Text>
                                    <View style={styles.dropdownIcon}>
                                        <Feather name="chevron-down" size={18} color={PRIMARY_BLUE} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>STATUS</Text>
                                <TouchableOpacity
                                    style={[styles.dropdownTrigger, styles.statusTrigger]}
                                    onPress={() => setShowStatusModal(true)}
                                >
                                    <View style={[styles.statusIndicator, { backgroundColor: status === 'OPEN' ? SUCCESS_GREEN : '#94a3b8' }]} />
                                    <Text style={styles.statusText}>{status}</Text>
                                    <Feather name="chevron-down" size={14} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.cardRow}>
                            <View style={[styles.inputGroup, { flex: 1.2 }]}>
                                <Text style={styles.inputLabel}>EMAIL</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 0.8, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>CC/BCC</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Separate by ,"
                                    value={ccBcc}
                                    onChangeText={setCcBcc}
                                />
                            </View>
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.cardRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>MAILING ADDRESS</Text>
                                <TextInput
                                    style={[styles.textInput, styles.multilineInput]}
                                    placeholder="Mailing address details"
                                    multiline
                                    value={mailingAddress}
                                    onChangeText={setMailingAddress}
                                />
                            </View>
                        </View>

                        <View style={styles.cardRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>SHIP TO CUSTOMER (FOR ADDRESS)</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowCustomerModal(true)}
                                >
                                    <Text style={styles.dropdownValue}>
                                        {selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : 'Choose Customer'}
                                    </Text>
                                    <Feather name="users" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.cardRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>SHIPPING ADDRESS</Text>
                                <TextInput
                                    style={[styles.textInput, styles.multilineInput]}
                                    placeholder="Shipping destination"
                                    multiline
                                    value={shippingAddress}
                                    onChangeText={setShippingAddress}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Dates Card */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>ORDER DATE</Text>
                                <TouchableOpacity
                                    style={styles.datePickerTrigger}
                                    onPress={() => setShowPoDatePicker(true)}
                                >
                                    <Feather name="calendar" size={18} color={PRIMARY_BLUE} style={{ marginRight: 10 }} />
                                    <Text style={styles.dateValue}>{formatDate(poDate)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>DUE DATE</Text>
                                <TouchableOpacity
                                    style={styles.datePickerTrigger}
                                    onPress={() => setShowDueDatePicker(true)}
                                >
                                    <Feather name="clock" size={18} color={PRIMARY_BLUE} style={{ marginRight: 10 }} />
                                    <Text style={styles.dateValue}>{formatDate(dueDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.cardRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>SHIP VIA</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Courier, Delivery"
                                    value={shipVia}
                                    onChangeText={setShipVia}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Line Items Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>ITEM DETAILS</Text>
                        <TouchableOpacity onPress={addLineItem}>
                            <LinearGradient colors={[SUCCESS_GREEN, '#0d9488']} style={styles.miniAddBtn}>
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.miniAddText}>Add Item</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {lineItems.map((item, index) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <View style={styles.itemBadge}>
                                    <Text style={styles.itemBadgeText}>#{index + 1}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.itemTrigger}
                                    onPress={() => { setEditingLineIndex(index); setShowItemModal(true); }}
                                >
                                    <Text style={styles.itemTitle} numberOfLines={1}>
                                        {item.itemId ? inventoryItems.find(i => String(i.id) === item.itemId)?.name : 'Select Stock Item'}
                                    </Text>
                                    <Feather name="package" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeLineItem(index)} style={styles.deleteIcon}>
                                    <Feather name="trash-2" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.itemBody}>
                                <View style={styles.itemRow}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.smallLabel}>QUANTITY</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.quantity}
                                            onChangeText={(v) => updateLineItem(index, 'quantity', v)}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.5, marginLeft: 10 }]}>
                                        <Text style={styles.smallLabel}>RATE (KES)</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.rate}
                                            onChangeText={(v) => updateLineItem(index, 'rate', v)}
                                            keyboardType="decimal-pad"
                                            placeholder="0.00"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.5, marginLeft: 10 }]}>
                                        <Text style={styles.smallLabel}>AMOUNT</Text>
                                        <View style={styles.disabledInput}>
                                            <Text style={styles.disabledValue}>{item.amount}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={[styles.itemRow, { marginTop: 10 }]}>
                                    <View style={[styles.inputGroup, { flex: 2 }]}>
                                        <Text style={styles.smallLabel}>DESCRIPTION / MEMO</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.description}
                                            onChangeText={(v) => updateLineItem(index, 'description', v)}
                                            placeholder="Optional details"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.2, marginLeft: 10 }]}>
                                        <Text style={styles.smallLabel}>TAX</Text>
                                        <TouchableOpacity
                                            style={styles.smallDropdown}
                                            onPress={() => { setEditingLineIndex(index); setShowVatRateModal(true); }}
                                        >
                                            <Text style={styles.smallDropdownText} numberOfLines={1}>
                                                {item.vatRateId ? vatRates.find(v => String(v.id) === item.vatRateId)?.name : 'VAT %'}
                                            </Text>
                                            <Feather name="percent" size={12} color={PRIMARY_BLUE} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Footer Totals Card */}
                    <View style={styles.totalsCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>KES {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax Calculation</Text>
                            <Text style={styles.summaryValue}>KES {totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={styles.totalDivider} />
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>TOTAL PAYABLE</Text>
                            <Text style={styles.grandTotalValue}>KES {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>

                    {/* Messages & Memos */}
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>MESSAGE TO SUPPLIER (SHOWN ON PO)</Text>
                            <TextInput
                                style={[styles.textInput, styles.multilineInput]}
                                multiline
                                value={messageToSupplier}
                                onChangeText={setMessageToSupplier}
                                placeholder="Instructions for supplier..."
                            />
                        </View>
                        <View style={[styles.inputGroup, { marginTop: 15 }]}>
                            <Text style={styles.inputLabel}>INTERNAL MEMO (PRIVATE)</Text>
                            <TextInput
                                style={[styles.textInput, styles.multilineInput]}
                                multiline
                                value={memo}
                                onChangeText={setMemo}
                                placeholder="Internal record notes..."
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.saveBtnGradient}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.saveBtnContent}>
                                    <Ionicons name="documents-outline" size={24} color="#fff" style={{ marginRight: 12 }} />
                                    <Text style={styles.saveBtnText}>Save Purchase Order</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 30 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Selection Modals */}
            <SelectionModal
                visible={showSupplierModal}
                title="Select Supplier"
                data={suppliers}
                onSelect={(id: number | string) => { setSelectedSupplierId(Number(id)); setShowSupplierModal(false); }}
                onClose={() => setShowSupplierModal(false)}
            />

            <SelectionModal
                visible={showCustomerModal}
                title="Select Customer"
                data={customers}
                onSelect={(id: number | string) => { setSelectedCustomerId(Number(id)); setShowCustomerModal(false); }}
                onClose={() => setShowCustomerModal(false)}
            />

            <SelectionModal
                visible={showItemModal}
                title="Select Stock Item"
                data={inventoryItems}
                onSelect={(id: number | string) => { updateLineItem(editingLineIndex, 'itemId', String(id)); setShowItemModal(false); }}
                onClose={() => setShowItemModal(false)}
            />

            <SelectionModal
                visible={showStatusModal}
                title="Set Status"
                data={[{ id: 'OPEN', name: 'OPEN' }, { id: 'CLOSED', name: 'CLOSED' }, { id: 'CANCELLED', name: 'CANCELLED' }]}
                onSelect={(id: string | number) => { setStatus(String(id)); setShowStatusModal(false); }}
                onClose={() => setShowStatusModal(false)}
            />

            <SelectionModal
                visible={showVatRateModal}
                title="Tax Treatment"
                data={vatRates}
                onSelect={(id: number | string) => { updateLineItem(editingLineIndex, 'vatRateId', String(id)); setShowVatRateModal(false); }}
                onClose={() => setShowVatRateModal(false)}
            />

            {/* Simplified Date Pickers */}
            <DatePickerModal
                visible={showPoDatePicker}
                onClose={() => setShowPoDatePicker(false)}
                date={poDate}
                onSelect={(d: Date) => { setPoDate(d); setShowPoDatePicker(false); }}
                title="Select Order Date"
            />
            <DatePickerModal
                visible={showDueDatePicker}
                onClose={() => setShowDueDatePicker(false)}
                date={dueDate}
                onSelect={(d: Date) => { setDueDate(d); setShowDueDatePicker(false); }}
                title="Select Due Date"
            />
        </View>
    );
}

// Reusable Components
function SelectionModal({ visible, title, data, onSelect, onClose }: any) {
    const [search, setSearch] = useState('');
    const filteredData = data.filter((item: any) => item.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalBar} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={TEXT_DARK} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.modalSearchContainer}>
                        <View style={styles.modalSearchBar}>
                            <Feather name="search" size={18} color={TEXT_MUTED} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search to filter..."
                                value={search}
                                onChangeText={setSearch}
                                placeholderTextColor={TEXT_MUTED}
                            />
                        </View>
                    </View>

                    <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                        {filteredData.length > 0 ? filteredData.map((item: any) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.modalItem}
                                onPress={() => { onSelect(item.id); setSearch(''); }}
                            >
                                <View style={styles.modalItemLeft}>
                                    <View style={styles.modalItemIcon}>
                                        <Text style={styles.modalItemInitial}>{item.name?.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.modalItemName}>{item.name}</Text>
                                        {item.code && <Text style={styles.modalItemCode}>{item.code}</Text>}
                                    </View>
                                </View>
                                <Feather name="check" size={18} color={SUCCESS_GREEN} style={{ opacity: 0.2 }} />
                            </TouchableOpacity>
                        )) : (
                            <View style={styles.modalEmpty}>
                                <Text style={styles.modalEmptyText}>No matching results found</Text>
                            </View>
                        )}
                        <View style={{ height: 50 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function DatePickerModal({ visible, onClose, date, onSelect, title }: any) {
    if (!visible) return null;
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: 'auto', paddingBottom: 40 }]}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalBar} />
                        <Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 20 }]}>{title}</Text>
                    </View>
                    <View style={styles.dateSelectorMock}>
                        <View style={styles.dateBox}>
                            <Text style={styles.dateNum}>{date.getDate()}</Text>
                            <Text style={styles.dateMonth}>{date.toLocaleDateString('default', { month: 'short' })}</Text>
                            <Text style={styles.dateYear}>{date.getFullYear()}</Text>
                        </View>
                        <Text style={styles.dateInfoText}>This is a placeholder for a native date picker component.</Text>
                    </View>
                    <View style={styles.modalActionRow}>
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalConfirmBtn}
                            onPress={() => onSelect(new Date())}
                        >
                            <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.modalConfirmGradient}>
                                <Text style={styles.modalConfirmText}>Select Today</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    header: { paddingBottom: 25 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
    backBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitleContainer: { flex: 1, marginLeft: 15 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    headerRight: { alignItems: 'flex-end' },
    currencyLabel: { fontSize: 10, color: ACCENT_ORANGE, fontWeight: 'bold' },
    headerAmount: { fontSize: 22, fontWeight: 'bold', color: '#fff' },

    scrollView: { flex: 1 },
    scrollContent: { padding: 15 },

    card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    cardRow: { flexDirection: 'row', marginBottom: 15 },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 6 },
    dropdownTrigger: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    dropdownValue: { fontSize: 15, color: TEXT_DARK, fontWeight: '600', flex: 1 },
    dropdownIcon: { width: 24, alignItems: 'flex-end' },
    statusTrigger: { height: 45, backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
    statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    statusText: { fontSize: 14, fontWeight: 'bold', color: PRIMARY_BLUE, flex: 1 },

    textInput: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15, fontSize: 15, color: TEXT_DARK, fontWeight: '500' },
    multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    separator: { height: 1.5, backgroundColor: BORDER_COLOR, marginVertical: 20 },

    datePickerTrigger: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    dateValue: { fontSize: 15, color: TEXT_DARK, fontWeight: '600' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 15, paddingHorizontal: 5 },
    sectionTitle: { fontSize: 14, fontWeight: '900', color: TEXT_DARK, letterSpacing: 1 },
    miniAddBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12 },
    miniAddText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 5 },

    itemCard: { backgroundColor: '#fff', borderRadius: 24, padding: 15, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: PRIMARY_BLUE, elevation: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    itemBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: LIGHT_BLUE, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    itemBadgeText: { fontSize: 12, fontWeight: 'bold', color: PRIMARY_BLUE },
    itemTrigger: { flex: 1, height: 45, backgroundColor: '#f1f5f9', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    itemTitle: { flex: 1, fontSize: 14, fontWeight: 'bold', color: TEXT_DARK, marginRight: 8 },
    deleteIcon: { padding: 8, marginLeft: 5 },

    itemBody: { paddingHorizontal: 2 },
    itemRow: { flexDirection: 'row' },
    smallLabel: { fontSize: 9, color: TEXT_MUTED, fontWeight: 'bold', marginBottom: 4 },
    smallInput: { height: 45, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 12, fontSize: 14, color: TEXT_DARK, fontWeight: 'bold' },
    disabledInput: { height: 45, backgroundColor: '#f1f5f9', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, justifyContent: 'center', paddingHorizontal: 12 },
    disabledValue: { fontSize: 14, fontWeight: '900', color: PRIMARY_BLUE },
    smallDropdown: { height: 45, backgroundColor: '#fffbeb', borderRadius: 10, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between' },
    smallDropdownText: { fontSize: 12, fontWeight: 'bold', color: '#92400e', marginRight: 5 },

    totalsCard: { backgroundColor: PRIMARY_BLUE, borderRadius: 24, padding: 25, marginVertical: 15, elevation: 5, shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    summaryValue: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
    totalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    grandTotalLabel: { fontSize: 12, color: ACCENT_ORANGE, fontWeight: '900' },
    grandTotalValue: { fontSize: 28, color: '#fff', fontWeight: '900' },

    saveBtn: { marginTop: 20, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    saveBtnGradient: { height: 70, justifyContent: 'center', alignItems: 'center' },
    saveBtnContent: { flexDirection: 'row', alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '85%', overflow: 'hidden' },
    modalHeader: { paddingTop: 10, paddingBottom: 15 },
    modalBar: { width: 45, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, alignSelf: 'center', marginVertical: 10 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: TEXT_DARK },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BG_OFF_WHITE, alignItems: 'center', justifyContent: 'center' },

    modalSearchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    modalSearchBar: { height: 55, backgroundColor: BG_OFF_WHITE, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1.5, borderColor: BORDER_COLOR },
    modalSearchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: TEXT_DARK, fontWeight: '500' },

    modalList: { flex: 1 },
    modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 25, borderBottomWidth: 1, borderBottomColor: BG_OFF_WHITE },
    modalItemLeft: { flexDirection: 'row', alignItems: 'center' },
    modalItemIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: LIGHT_BLUE, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
    modalItemInitial: { fontSize: 20, fontWeight: 'bold', color: PRIMARY_BLUE },
    modalItemName: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    modalItemCode: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
    modalEmpty: { padding: 40, alignItems: 'center' },
    modalEmptyText: { color: TEXT_MUTED, fontSize: 15 },

    dateSelectorMock: { padding: 30, alignItems: 'center' },
    dateBox: { width: 120, height: 120, backgroundColor: LIGHT_BLUE, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    dateNum: { fontSize: 40, fontWeight: '900', color: PRIMARY_BLUE },
    dateMonth: { fontSize: 18, fontWeight: 'bold', color: TEXT_DARK },
    dateYear: { fontSize: 14, color: TEXT_MUTED },
    dateInfoText: { marginTop: 20, textAlign: 'center', color: TEXT_MUTED, paddingHorizontal: 40 },
    modalActionRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20 },
    modalCancelBtn: { flex: 1, height: 55, alignItems: 'center', justifyContent: 'center' },
    modalCancelText: { color: TEXT_MUTED, fontSize: 16, fontWeight: 'bold' },
    modalConfirmBtn: { flex: 2, height: 55, borderRadius: 18, overflow: 'hidden' },
    modalConfirmGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
