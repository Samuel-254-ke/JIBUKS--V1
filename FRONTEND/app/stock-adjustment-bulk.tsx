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

// Brand Colors - Matching Purchase Order for Consistency
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

type LineItem = {
    id: string;
    itemId: string | null;
    name: string;
    sku: string;
    qtyOnHand: number;
    newQty: string;
    changeInQty: number;
};

export default function StockAdjustmentBulkScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);

    // Form State
    const [adjustmentDate, setAdjustmentDate] = useState(new Date());
    const [referenceNumber, setReferenceNumber] = useState('');
    const [reason, setReason] = useState('Damaged Goods');
    const [adjustmentAccountId, setAdjustmentAccountId] = useState<string | null>(null);
    const [memo, setMemo] = useState('');

    // Line Items State
    const [lineItems, setLineItems] = useState<LineItem[]>([
        {
            id: '1',
            itemId: null,
            name: '',
            sku: '',
            qtyOnHand: 0,
            newQty: '',
            changeInQty: 0
        }
    ]);

    // UI Modals
    const [showItemModal, setShowItemModal] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editingLineIndex, setEditingLineIndex] = useState<number>(0);

    const reasons = [
        { id: 'Damaged Goods', name: 'Damaged Goods' },
        { id: 'Stock Shrinkage', name: 'Stock Shrinkage' },
        { id: 'Inventory Overlap', name: 'Inventory Overlap' },
        { id: 'Physical Count', name: 'Physical Count' },
        { id: 'Theft / Stolen', name: 'Theft / Stolen' },
        { id: 'Expired', name: 'Expired' }
    ];

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [itemsData, accountsData] = await Promise.all([
                apiService.getInventory({ active: true }),
                apiService.getAccounts({ type: 'EXPENSE' }) // Typically adjustments are expense or cost of sales
            ]);
            setInventoryItems(itemsData);
            setAccounts(accountsData);

            // Set default account if "Inventory Shrinkage" exists
            const shrinkageAcc = accountsData.find((a: any) => a.name.toLowerCase().includes('shrinkage'));
            if (shrinkageAcc) setAdjustmentAccountId(shrinkageAcc.id);

            // Generate auto ref if empty
            setReferenceNumber('ADJ-' + Math.floor(1000 + Math.random() * 9000));
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
            name: '',
            sku: '',
            qtyOnHand: 0,
            newQty: '',
            changeInQty: 0
        }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    const clearAllLines = () => {
        setLineItems([{
            id: Date.now().toString(),
            itemId: null,
            name: '',
            sku: '',
            qtyOnHand: 0,
            newQty: '',
            changeInQty: 0
        }]);
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
        const updated = [...lineItems];
        if (field === 'itemId') {
            const product = inventoryItems.find(i => String(i.id) === String(value));
            if (product) {
                updated[index].itemId = String(product.id);
                updated[index].name = product.name;
                updated[index].sku = product.sku || 'N/A';
                updated[index].qtyOnHand = product.quantity || 0;
            }
        } else if (field === 'newQty') {
            updated[index].newQty = value;
            const newVal = parseFloat(value) || 0;
            updated[index].changeInQty = newVal - updated[index].qtyOnHand;
        }
        setLineItems(updated);
    };

    const handleSave = async () => {
        const validItems = lineItems.filter(i => i.itemId && i.newQty !== '');
        if (validItems.length === 0) {
            Alert.alert('Required', 'Please add at least one valid item adjustment');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                adjustmentDate: adjustmentDate.toISOString(),
                referenceNumber,
                reason,
                accountId: adjustmentAccountId,
                memo,
                items: validItems.map(item => ({
                    itemId: item.itemId,
                    newQuantity: parseFloat(item.newQty),
                    previousQuantity: item.qtyOnHand,
                    variance: item.changeInQty
                }))
            };

            await apiService.createStockAdjustment(payload);

            Alert.alert('Success', 'Stock adjustment recorded successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to save Stock Adjustment');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header - Solid Gradient */}
            <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Stock Adjustment</Text>
                            <Text style={styles.headerSubtitle}>Bulk Inventory Correction</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <MaterialCommunityIcons name="layers-edit" size={28} color={ACCENT_ORANGE} />
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
                    {/* General Info Card */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>ADJUSTMENT DATE</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Feather name="calendar" size={18} color={PRIMARY_BLUE} style={{ marginRight: 10 }} />
                                    <Text style={styles.dropdownValue}>{formatDate(adjustmentDate)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>REFERENCE NUMBER</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter Ref #"
                                    value={referenceNumber}
                                    onChangeText={setReferenceNumber}
                                />
                            </View>
                        </View>

                        <View style={styles.cardRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>ADJUSTMENT REASON</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowReasonModal(true)}
                                >
                                    <Text style={styles.dropdownValue} numberOfLines={1}>{reason}</Text>
                                    <Feather name="chevron-down" size={18} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                                <Text style={styles.inputLabel}>ADJUSTMENT ACCOUNT</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowAccountModal(true)}
                                >
                                    <Text style={styles.dropdownValue} numberOfLines={1}>
                                        {adjustmentAccountId ? accounts.find(a => String(a.id) === String(adjustmentAccountId))?.name : 'Select Account'}
                                    </Text>
                                    <Feather name="book-open" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Table Header Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PRODUCTS TO ADJUST</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={clearAllLines} style={styles.clearBtn}>
                                <Text style={styles.clearBtnText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={addLineItem}>
                                <LinearGradient colors={[SUCCESS_GREEN, '#0d9488']} style={styles.miniAddBtn}>
                                    <Ionicons name="add" size={18} color="#fff" />
                                    <Text style={styles.miniAddText}>Add Line</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Adjustment Table Items */}
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
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemTitle} numberOfLines={1}>
                                            {item.name || 'Select Product / Variant'}
                                        </Text>
                                        {item.sku ? <Text style={styles.itemSkuText}>{item.sku}</Text> : null}
                                    </View>
                                    <Feather name="package" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeLineItem(index)} style={styles.deleteIcon}>
                                    <Feather name="trash-2" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.itemBody}>
                                <View style={styles.itemRow}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.smallLabel}>QTY ON HAND</Text>
                                        <View style={styles.disabledInput}>
                                            <Text style={styles.disabledValue}>{item.qtyOnHand}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.2, marginLeft: 10 }]}>
                                        <Text style={styles.smallLabel}>NEW QTY</Text>
                                        <TextInput
                                            style={[styles.smallInput, styles.activeSmallInput]}
                                            value={item.newQty}
                                            onChangeText={(v) => updateLineItem(index, 'newQty', v)}
                                            keyboardType="decimal-pad"
                                            placeholder="0"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.2, marginLeft: 10 }]}>
                                        <Text style={styles.smallLabel}>CHANGE IN QTY</Text>
                                        <View style={[styles.disabledInput, { backgroundColor: item.changeInQty < 0 ? '#fef2f2' : item.changeInQty > 0 ? '#f0fdf4' : '#f1f5f9' }]}>
                                            <Text style={[styles.disabledValue, { color: item.changeInQty < 0 ? '#ef4444' : item.changeInQty > 0 ? SUCCESS_GREEN : PRIMARY_BLUE }]}>
                                                {item.changeInQty > 0 ? '+' : ''}{item.changeInQty}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Memo Card */}
                    <View style={[styles.card, { marginTop: 10 }]}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>ADJUSTMENT MEMO / NOTES</Text>
                            <TextInput
                                style={[styles.textInput, styles.multilineInput]}
                                multiline
                                value={memo}
                                onChangeText={setMemo}
                                placeholder="Why are you making this adjustment?..."
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
                                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" style={{ marginRight: 12 }} />
                                    <Text style={styles.saveBtnText}>Record Adjustment</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Selection Modals */}
            <SelectionModal
                visible={showItemModal}
                title="Select Product / Variant"
                data={inventoryItems}
                onSelect={(id: string | number) => { updateLineItem(editingLineIndex, 'itemId', id); setShowItemModal(false); }}
                onClose={() => setShowItemModal(false)}
            />

            <SelectionModal
                visible={showReasonModal}
                title="Adjustment Reason"
                data={reasons}
                onSelect={(id: string | number) => { setReason(String(id)); setShowReasonModal(false); }}
                onClose={() => setShowReasonModal(false)}
            />

            <SelectionModal
                visible={showAccountModal}
                title="Adjustment Account"
                data={accounts}
                onSelect={(id: string | number) => { setAdjustmentAccountId(String(id)); setShowAccountModal(false); }}
                onClose={() => setShowAccountModal(false)}
            />

            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                date={adjustmentDate}
                onSelect={(d: Date) => { setAdjustmentDate(d); setShowDatePicker(false); }}
                title="Select Adjustment Date"
            />
        </View>
    );
}

// Reuse components with same styling for consistency
function SelectionModal({ visible, title, data, onSelect, onClose }: any) {
    const [search, setSearch] = useState('');
    const filteredData = (data || []).filter((item: any) => item.name?.toLowerCase().includes(search.toLowerCase()));

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
    headerRight: { padding: 5 },

    scrollView: { flex: 1 },
    scrollContent: { padding: 15 },

    card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    cardRow: { flexDirection: 'row', marginBottom: 15 },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 6 },
    dropdownTrigger: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    dropdownValue: { fontSize: 14, color: TEXT_DARK, fontWeight: '600', flex: 1 },

    textInput: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15, fontSize: 15, color: TEXT_DARK, fontWeight: '500' },
    multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: 15 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 15, paddingHorizontal: 5 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: TEXT_DARK, letterSpacing: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    clearBtn: { marginRight: 15 },
    clearBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
    miniAddBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
    miniAddText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

    itemCard: { backgroundColor: '#fff', borderRadius: 24, padding: 15, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: ACCENT_ORANGE, elevation: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    itemBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: LIGHT_BLUE, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    itemBadgeText: { fontSize: 12, fontWeight: 'bold', color: PRIMARY_BLUE },
    itemTrigger: { flex: 1, height: 50, backgroundColor: '#f1f5f9', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    itemTitle: { fontSize: 14, fontWeight: 'bold', color: TEXT_DARK },
    itemSkuText: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600' },
    deleteIcon: { padding: 8, marginLeft: 5 },

    itemBody: { paddingHorizontal: 2 },
    itemRow: { flexDirection: 'row' },
    smallLabel: { fontSize: 9, color: TEXT_MUTED, fontWeight: 'bold', marginBottom: 4 },
    smallInput: { height: 45, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 12, fontSize: 14, color: TEXT_DARK, fontWeight: 'bold' },
    activeSmallInput: { borderColor: PRIMARY_BLUE, backgroundColor: '#fff' },
    disabledInput: { height: 45, backgroundColor: '#f1f5f9', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, justifyContent: 'center', paddingHorizontal: 12 },
    disabledValue: { fontSize: 14, fontWeight: '900', color: PRIMARY_BLUE },

    saveBtn: { marginTop: 10, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
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
