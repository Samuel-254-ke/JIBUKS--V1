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

// Premium Design Palette
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
    description: string;
    quantity: string;
    costPrice: string;
    expiryDate: string;
    amount: number;
};

export default function ReceiveStockScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [locations, setLocations] = useState([
        { id: '1', name: 'Main Warehouse' },
        { id: '2', name: 'Retail Store' },
        { id: '3', name: 'Secondary Storage' }
    ]);

    // Form State
    const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
    const [referenceNo, setReferenceNo] = useState('');
    const [receiveDate, setReceiveDate] = useState(new Date());
    const [selectedLocation, setSelectedLocation] = useState('Main Warehouse');
    const [notes, setNotes] = useState('');

    // Line Items State
    const [lineItems, setLineItems] = useState<LineItem[]>([
        {
            id: '1',
            itemId: null,
            name: '',
            description: '',
            quantity: '',
            costPrice: '',
            expiryDate: '',
            amount: 0
        }
    ]);

    // UI Modals
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editingLineIndex, setEditingLineIndex] = useState<number>(0);

    useEffect(() => { loadInitialData(); }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [vendorsData, itemsData] = await Promise.all([
                apiService.request('/vendors'),
                apiService.getInventory({ active: true })
            ]);
            setVendors(vendorsData || []);
            setInventoryItems(itemsData || []);
            setReferenceNo('GRN-' + Math.floor(10000 + Math.random() * 90000));
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
            description: '',
            quantity: '',
            costPrice: '',
            expiryDate: '',
            amount: 0
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
            const item = inventoryItems.find(i => String(i.id) === String(value));
            if (item) {
                updated[index].itemId = String(item.id);
                updated[index].name = item.name;
                updated[index].description = item.description || '';
                updated[index].costPrice = String(item.costPrice || item.purchasePrice || '');
            }
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }

        // Recalculate item amount
        const qty = parseFloat(updated[index].quantity) || 0;
        const cost = parseFloat(updated[index].costPrice) || 0;
        updated[index].amount = qty * cost;

        setLineItems(updated);
    };

    const calculateTotalValue = () => {
        return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const handleSave = async () => {
        const validItems = lineItems.filter(i => i.itemId && parseFloat(i.quantity) > 0);
        if (validItems.length === 0) {
            Alert.alert('Required', 'Please add at least one item with a valid quantity');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                vendorId: selectedVendorId,
                referenceNo,
                receiveDate: receiveDate.toISOString(),
                location: selectedLocation,
                items: validItems.map(item => ({
                    itemId: item.itemId,
                    quantity: parseFloat(item.quantity),
                    costPrice: parseFloat(item.costPrice),
                    expiryDate: item.expiryDate
                })),
                notes,
                totalValue: calculateTotalValue()
            };

            await apiService.receiveStock(payload);

            Alert.alert('Success', 'Stock received and inventory updated', [
                { text: 'View Inventory', onPress: () => router.push('/inventory') },
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.error || 'Failed to receive stock');
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
                            <Text style={styles.headerTitle}>Receive Stock</Text>
                            <Text style={styles.headerSubtitle}>Goods Received Note (GRN)</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text style={styles.valueLabel}>TOTAL VALUE</Text>
                            <Text style={styles.headerValue}>KES {calculateTotalValue().toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
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
                    {/* Header Info Card */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={[styles.inputGroup, { flex: 1.5 }]}>
                                <Text style={styles.inputLabel}>SUPPLIER / VENDOR</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowVendorModal(true)}
                                >
                                    <Text style={styles.dropdownValue} numberOfLines={1}>
                                        {selectedVendorId ? vendors.find(v => v.id === selectedVendorId)?.name : 'Select Supplier'}
                                    </Text>
                                    <Feather name="user" size={18} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                                <Text style={styles.inputLabel}>REF / BILL NO.</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. INV-902"
                                    value={referenceNo}
                                    onChangeText={setReferenceNo}
                                />
                            </View>
                        </View>

                        <View style={[styles.cardRow, { marginTop: 10 }]}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>RECEIVE DATE</Text>
                                <TouchableOpacity
                                    style={styles.dateSelector}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Feather name="calendar" size={18} color={PRIMARY_BLUE} style={{ marginRight: 10 }} />
                                    <Text style={styles.dateValue}>{formatDate(receiveDate)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 15 }]}>
                                <Text style={styles.inputLabel}>STORAGE LOCATION</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setShowLocationModal(true)}
                                >
                                    <Text style={styles.dropdownValue}>{selectedLocation}</Text>
                                    <Feather name="map-pin" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Line Items Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>RECEIVED ITEMS</Text>
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
                                    style={styles.itemSelector}
                                    onPress={() => { setEditingLineIndex(index); setShowItemModal(true); }}
                                >
                                    <Text style={styles.itemLabel} numberOfLines={1}>
                                        {item.name || 'Select Item to receive...'}
                                    </Text>
                                    <Feather name="box" size={16} color={PRIMARY_BLUE} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeLineItem(index)} style={styles.deleteBtn}>
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
                                            placeholder="0"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.5, marginLeft: 10 }]}>
                                        <Text style={styles.smallLabel}>COST PRICE (KES)</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.costPrice}
                                            onChangeText={(v) => updateLineItem(index, 'costPrice', v)}
                                            keyboardType="decimal-pad"
                                            placeholder="0.00"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1.5, marginLeft: 10 }]}>
                                        <Text style={styles.smallLabel}>EXPIRY (OPTIONAL)</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.expiryDate}
                                            onChangeText={(v) => updateLineItem(index, 'expiryDate', v)}
                                            placeholder="DD/MM/YY"
                                        />
                                    </View>
                                </View>
                                <View style={styles.amountDisplay}>
                                    <Text style={styles.amountLabel}>Line Total Value:</Text>
                                    <Text style={styles.amountValue}>KES {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Notes Card */}
                    <View style={styles.card}>
                        <Text style={styles.inputLabel}>RECEPTION NOTES / MEMO</Text>
                        <TextInput
                            style={[styles.textInput, styles.multilineInput]}
                            multiline
                            placeholder="Add any details about this delivery..."
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    {/* Main Action Button */}
                    <TouchableOpacity
                        style={styles.mainBtn}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <LinearGradient colors={[PRIMARY_BLUE, SECONDARY_BLUE]} style={styles.mainBtnGradient}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.btnContent}>
                                    <MaterialCommunityIcons name="truck-check" size={26} color="#fff" style={{ marginRight: 12 }} />
                                    <Text style={styles.mainBtnText}>Confirm Reception</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Selection Modals */}
            <SelectionModal
                visible={showVendorModal}
                title="Select Supplier"
                data={vendors}
                onSelect={(id: any) => { setSelectedVendorId(id); setShowVendorModal(false); }}
                onClose={() => setShowVendorModal(false)}
            />

            <SelectionModal
                visible={showItemModal}
                title="Select Inventory Item"
                data={inventoryItems}
                onSelect={(id: any) => { updateLineItem(editingLineIndex, 'itemId', id); setShowItemModal(false); }}
                onClose={() => setShowItemModal(false)}
            />

            <SelectionModal
                visible={showLocationModal}
                title="Storage Location"
                data={locations}
                onSelect={(id: any) => { setSelectedLocation(locations.find(l => l.id === id)?.name || ''); setShowLocationModal(false); }}
                onClose={() => setShowLocationModal(false)}
            />
        </View>
    );
}

// Reusable Selection Modal
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
                                placeholder="Quick search..."
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
                                <Feather name="check-circle" size={18} color={SUCCESS_GREEN} style={{ opacity: 0.2 }} />
                            </TouchableOpacity>
                        )) : (
                            <View style={styles.modalEmpty}>
                                <Text style={styles.modalEmptyText}>No results found</Text>
                            </View>
                        )}
                        <View style={{ height: 50 }} />
                    </ScrollView>
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
    valueLabel: { fontSize: 10, color: ACCENT_ORANGE, fontWeight: '900' },
    headerValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

    scrollView: { flex: 1 },
    scrollContent: { padding: 15 },

    card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
    cardRow: { flexDirection: 'row' },
    inputGroup: { flex: 1 },
    inputLabel: { fontSize: 10, color: TEXT_MUTED, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 8 },
    dropdownTrigger: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    dropdownValue: { fontSize: 14, color: TEXT_DARK, fontWeight: '600', flex: 1 },
    textInput: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15, fontSize: 15, color: TEXT_DARK, fontWeight: '500' },
    dateSelector: { height: 55, backgroundColor: '#f8fafc', borderRadius: 16, borderWidth: 1.5, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
    dateValue: { fontSize: 14, color: TEXT_DARK, fontWeight: '600' },
    multilineInput: { height: 100, textAlignVertical: 'top', paddingTop: 15 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, marginBottom: 15, paddingHorizontal: 5 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: TEXT_DARK, letterSpacing: 1 },
    miniAddBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12 },
    miniAddText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 6 },

    itemCard: { backgroundColor: '#fff', borderRadius: 24, padding: 15, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: SUCCESS_GREEN, elevation: 2 },
    itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    itemBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    itemBadgeText: { fontSize: 12, fontWeight: 'bold', color: SUCCESS_GREEN },
    itemSelector: { flex: 1, height: 45, backgroundColor: '#f1f5f9', borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    itemLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginRight: 8 },
    deleteBtn: { padding: 8, marginLeft: 5 },

    itemBody: { paddingHorizontal: 2 },
    itemRow: { flexDirection: 'row' },
    smallLabel: { fontSize: 9, color: TEXT_MUTED, fontWeight: 'bold', marginBottom: 4 },
    smallInput: { height: 45, backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 10, fontSize: 14, color: TEXT_DARK, fontWeight: 'bold' },
    amountDisplay: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
    amountLabel: { fontSize: 11, color: TEXT_MUTED, marginRight: 8 },
    amountValue: { fontSize: 15, fontWeight: '900', color: PRIMARY_BLUE },

    mainBtn: { borderRadius: 20, overflow: 'hidden', elevation: 8, shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
    mainBtnGradient: { height: 65, justifyContent: 'center', alignItems: 'center' },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    mainBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },

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
    modalItemIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: LIGHT_BLUE, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    modalItemInitial: { fontSize: 18, fontWeight: 'bold', color: PRIMARY_BLUE },
    modalItemName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    modalItemCode: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
    modalEmpty: { padding: 40, alignItems: 'center' },
    modalEmptyText: { color: TEXT_MUTED, fontSize: 15 },
});
