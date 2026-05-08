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

// Brand Colors - Matching the Luxury Blue Theme
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
    qtyToTransfer: string;
    qtyOnHand: number;
};

export default function StockTransferScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);

    // Form State
    const [transferDate, setTransferDate] = useState(new Date());
    const [referenceNumber, setReferenceNumber] = useState('');
    const [sourceLocation, setSourceLocation] = useState('Main Warehouse');
    const [destLocation, setDestLocation] = useState('Retail Store');
    const [memo, setMemo] = useState('');

    // Line Items State
    const [lineItems, setLineItems] = useState<LineItem[]>([
        {
            id: '1',
            itemId: null,
            name: '',
            sku: '',
            qtyToTransfer: '',
            qtyOnHand: 0
        }
    ]);

    // UI Modals
    const [showItemModal, setShowItemModal] = useState(false);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [showDestModal, setShowDestModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editingLineIndex, setEditingLineIndex] = useState<number>(0);

    const locations = [
        { id: 'Loc-1', name: 'Main Warehouse' },
        { id: 'Loc-2', name: 'Retail Store' },
        { id: 'Loc-3', name: 'Showroom' },
        { id: 'Loc-4', name: 'Distribution Center' },
        { id: 'Loc-5', name: 'Overflow Storage' }
    ];

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const itemsData = await apiService.getInventory({ active: true });
            setInventoryItems(itemsData);
            setReferenceNumber('TRF-' + Math.floor(1000 + Math.random() * 9000));
        } catch (error) {
            console.error('Error loading inventory:', error);
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
            qtyToTransfer: '',
            qtyOnHand: 0
        }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(prev => prev.filter((_, i) => i !== index));
        }
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
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setLineItems(updated);
    };

    const handleSave = async () => {
        const validItems = lineItems.filter(i => i.itemId && parseFloat(i.qtyToTransfer) > 0);
        if (validItems.length === 0) {
            Alert.alert('Required', 'Please add at least one valid item to transfer');
            return;
        }

        if (sourceLocation === destLocation) {
            Alert.alert('Selection Error', 'Source and Destination locations must be different');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                transferDate: transferDate.toISOString(),
                referenceNumber,
                sourceLocation,
                destLocation,
                memo,
                items: validItems.map(item => ({
                    itemId: item.itemId,
                    quantity: parseFloat(item.qtyToTransfer)
                }))
            };

            await apiService.createStockTransfer(payload);

            Alert.alert('Success', 'Stock transfer recorded successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to save Stock Transfer');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Premium Header - Dynamic Linear Gradient */}
            <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Stock Transfer</Text>
                            <Text style={styles.headerSubtitle}>Move inventory between locations</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <MaterialCommunityIcons name="swap-horizontal-bold" size={28} color={ACCENT_ORANGE} />
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
                    {/* Transfer Route Card */}
                    <View style={styles.card}>
                        <View style={styles.routeContainer}>
                            <View style={styles.routePoint}>
                                <Text style={styles.routeLabel}>FROM (SOURCE)</Text>
                                <TouchableOpacity
                                    style={styles.locationSelector}
                                    onPress={() => setShowSourceModal(true)}
                                >
                                    <Text style={styles.locationName} numberOfLines={1}>{sourceLocation}</Text>
                                    <Feather name="chevron-down" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.routeIndicator}>
                                <View style={styles.routeLine} />
                                <View style={styles.routeIconBox}>
                                    <MaterialCommunityIcons name="arrow-right-circle" size={24} color={ACCENT_ORANGE} />
                                </View>
                                <View style={styles.routeLine} />
                            </View>

                            <View style={styles.routePoint}>
                                <Text style={styles.routeLabel}>TO (DESTINATION)</Text>
                                <TouchableOpacity
                                    style={styles.locationSelector}
                                    onPress={() => setShowDestModal(true)}
                                >
                                    <Text style={styles.locationName} numberOfLines={1}>{destLocation}</Text>
                                    <Feather name="chevron-down" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Details Card */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>TRANSFER DATE</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Feather name="calendar" size={18} color={PRIMARY_BLUE} style={{ marginRight: 10 }} />
                                    <Text style={styles.dropdownValue}>{formatDate(transferDate)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                                <Text style={styles.inputLabel}>REF NUMBER</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Enter Ref #"
                                    value={referenceNumber}
                                    onChangeText={setReferenceNumber}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Items Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>ITEMS TO TRANSFER</Text>
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
                                    <Text style={styles.itemBadgeText}>{index + 1}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.itemTrigger}
                                    onPress={() => { setEditingLineIndex(index); setShowItemModal(true); }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemTitle} numberOfLines={1}>
                                            {item.name || 'Select Item to move...'}
                                        </Text>
                                        {item.sku ? <Text style={styles.skuText}>SKU: {item.sku}</Text> : null}
                                    </View>
                                    <Feather name="box" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeLineItem(index)} style={styles.deleteBtn}>
                                    <Feather name="trash-2" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.itemFooter}>
                                <View style={styles.stockInfo}>
                                    <Text style={styles.stockLabel}>Stock on Hand</Text>
                                    <Text style={styles.stockValue}>{item.qtyOnHand}</Text>
                                </View>
                                <View style={styles.qtyInputBox}>
                                    <Text style={styles.qtyLabel}>TRANSFER QTY</Text>
                                    <TextInput
                                        style={styles.qtyInput}
                                        value={item.qtyToTransfer}
                                        onChangeText={(v) => updateLineItem(index, 'qtyToTransfer', v)}
                                        keyboardType="decimal-pad"
                                        placeholder="0"
                                    />
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Memo Card */}
                    <View style={styles.card}>
                        <Text style={styles.inputLabel}>INTERNAL MEMO / REASON</Text>
                        <TextInput
                            style={[styles.textInput, styles.multilineInput]}
                            multiline
                            placeholder="Add any notes here..."
                            value={memo}
                            onChangeText={setMemo}
                        />
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                        style={styles.transferBtn}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.transferBtnGradient}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.btnContent}>
                                    <MaterialCommunityIcons name="check-decagram" size={24} color="#fff" style={{ marginRight: 12 }} />
                                    <Text style={styles.transferBtnText}>Complete Transfer</Text>
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
                title="Select Inventory Item"
                data={inventoryItems}
                onSelect={(id: any) => { updateLineItem(editingLineIndex, 'itemId', id); setShowItemModal(false); }}
                onClose={() => setShowItemModal(false)}
            />

            <SelectionModal
                visible={showSourceModal}
                title="Select Source Location"
                data={locations}
                onSelect={(name: string) => { setSourceLocation(name); setShowSourceModal(false); }}
                onClose={() => setShowSourceModal(false)}
                isLocation
            />

            <SelectionModal
                visible={showDestModal}
                title="Select Destination Location"
                data={locations}
                onSelect={(name: string) => { setDestLocation(name); setShowDestModal(false); }}
                onClose={() => setShowDestModal(false)}
                isLocation
            />

            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                date={transferDate}
                onSelect={(d: Date) => { setTransferDate(d); setShowDatePicker(false); }}
                title="Select Transfer Date"
            />
        </View>
    );
}

// Sub-components
function SelectionModal({ visible, title, data, onSelect, onClose, isLocation }: any) {
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
                                onPress={() => { onSelect(isLocation ? item.name : item.id); setSearch(''); }}
                            >
                                <View style={styles.modalItemLeft}>
                                    <View style={[styles.modalItemIcon, { backgroundColor: isLocation ? '#f0fdf4' : LIGHT_BLUE }]}>
                                        <MaterialCommunityIcons
                                            name={isLocation ? "storefront-outline" : "package-variant-closed"}
                                            size={22}
                                            color={isLocation ? SUCCESS_GREEN : PRIMARY_BLUE}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.modalItemName}>{item.name}</Text>
                                        {item.sku && <Text style={styles.modalItemCode}>{item.sku}</Text>}
                                    </View>
                                </View>
                                <Feather name="plus-circle" size={18} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                            </TouchableOpacity>
                        )) : (
                            <View style={styles.modalEmpty}>
                                <Text style={styles.modalEmptyText}>Nothing found matches your search</Text>
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
    cardRow: { flexDirection: 'row', marginBottom: 5 },

    routeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    routePoint: { flex: 1 },
    routeLabel: { fontSize: 10, fontWeight: '900', color: TEXT_MUTED, letterSpacing: 0.5, marginBottom: 8 },
    locationSelector: { backgroundColor: BG_OFF_WHITE, borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    locationName: { fontSize: 13, fontWeight: 'bold', color: PRIMARY_BLUE, flex: 1 },

    routeIndicator: { paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
    routeLine: { width: 2, height: 10, backgroundColor: BORDER_COLOR, flex: 1 },
    routeIconBox: { padding: 5 },

    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 6 },
    dropdownTrigger: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    dropdownValue: { fontSize: 14, color: TEXT_DARK, fontWeight: '600', flex: 1 },

    textInput: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15, fontSize: 15, color: TEXT_DARK, fontWeight: '500' },
    multilineInput: { height: 80, textAlignVertical: 'top', paddingTop: 15 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 15, paddingHorizontal: 5 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: TEXT_DARK, letterSpacing: 1 },
    miniAddBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12 },
    miniAddText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },

    itemCard: { backgroundColor: '#fff', borderRadius: 24, padding: 15, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: PRIMARY_BLUE, elevation: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    itemBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: LIGHT_BLUE, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    itemBadgeText: { fontSize: 12, fontWeight: 'bold', color: PRIMARY_BLUE },
    itemTrigger: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' },
    itemTitle: { fontSize: 14, fontWeight: 'bold', color: TEXT_DARK, flex: 1 },
    skuText: { fontSize: 10, color: TEXT_MUTED, marginTop: 2 },
    deleteBtn: { padding: 8, marginLeft: 5 },

    itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    stockInfo: { flex: 1 },
    stockLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: '600' },
    stockValue: { fontSize: 16, fontWeight: '900', color: PRIMARY_BLUE },
    qtyInputBox: { flex: 1, alignItems: 'flex-end' },
    qtyLabel: { fontSize: 9, color: TEXT_MUTED, fontWeight: '900', marginBottom: 4 },
    qtyInput: { width: 100, height: 40, backgroundColor: '#fffbeb', borderRadius: 8, borderWidth: 1.5, borderColor: '#fde68a', textAlign: 'center', fontSize: 15, fontWeight: 'bold', color: '#92400e' },

    transferBtn: { marginTop: 10, borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    transferBtnGradient: { height: 70, justifyContent: 'center', alignItems: 'center' },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    transferBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '85%', overflow: 'hidden' },
    modalHeader: { paddingTop: 10, paddingBottom: 15 },
    modalBar: { width: 45, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, alignSelf: 'center', marginVertical: 10 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: TEXT_DARK },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BG_OFF_WHITE, alignItems: 'center', justifyContent: 'center' },

    modalSearchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    modalSearchBar: { height: 55, backgroundColor: BG_OFF_WHITE, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1.5, borderColor: BORDER_COLOR },
    modalSearchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: TEXT_DARK, fontWeight: '500' },

    modalList: { flex: 1 },
    modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 25, borderBottomWidth: 1, borderBottomColor: BG_OFF_WHITE },
    modalItemLeft: { flexDirection: 'row', alignItems: 'center' },
    modalItemIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    modalItemName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    modalItemCode: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
    modalEmpty: { padding: 40, alignItems: 'center' },
    modalEmptyText: { color: TEXT_MUTED, fontSize: 15 },

    dateSelectorMock: { padding: 30, alignItems: 'center' },
    dateBox: { width: 100, height: 100, backgroundColor: LIGHT_BLUE, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    dateNum: { fontSize: 36, fontWeight: '900', color: PRIMARY_BLUE },
    dateMonth: { fontSize: 18, fontWeight: 'bold', color: TEXT_DARK },
    dateYear: { fontSize: 14, color: TEXT_MUTED },
    modalActionRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20 },
    modalCancelBtn: { flex: 1, height: 55, alignItems: 'center', justifyContent: 'center' },
    modalCancelText: { color: TEXT_MUTED, fontSize: 16, fontWeight: 'bold' },
    modalConfirmBtn: { flex: 2, height: 55, borderRadius: 18, overflow: 'hidden' },
    modalConfirmGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
