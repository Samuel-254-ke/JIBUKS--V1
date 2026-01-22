import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
    TextInput, Platform, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import apiService, { Account } from '@/services/api';

export default function EnterBillScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [billDate, setBillDate] = useState(new Date());
    const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PARTIAL' | 'PAID'>('UNPAID');
    const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);

    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
    const [showBillDatePicker, setShowBillDatePicker] = useState(false);

    useEffect(() => {
        loadInitialData();
        generateReferenceNumber();
    }, []);

    // Auto-fill category when supplier is selected
    useEffect(() => {
        if (selectedSupplierId && expenseAccounts.length > 0) {
            // Logic: Try to find a category related to supplier, or default to first one
            // Ideally backend provides 'defaultAccountId' on vendor. For now, pick first.
            const defaultCategory = expenseAccounts[0];
            if (defaultCategory) {
                setCategoryId(String(defaultCategory.id));
            }
        }
    }, [selectedSupplierId, expenseAccounts]);

    const generateReferenceNumber = () => {
        const randomNum = Math.floor(Math.random() * 10000000);
        const refNumber = `B${String(randomNum).padStart(7, '0')}`;
        setReference(refNumber);
    };

    const loadInitialData = async () => {
        try {
            const [vendorsData, accountsData, methodsData] = await Promise.all([
                apiService.getVendors({ active: true }),
                apiService.getAccounts({ type: 'EXPENSE' }),
                apiService.getPaymentMethods()
            ]);
            setSuppliers(vendorsData);
            setExpenseAccounts(accountsData);
            setPaymentMethods(methodsData);

            // DEBUG: Check account structure
            if (accountsData.length > 0) {
                console.log('First account:', accountsData[0]);
                // Remove this alert after debugging
                // Alert.alert('Debug Account', JSON.stringify(accountsData[0]));
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            Alert.alert('Connection Error', 'Failed to load suppliers/accounts. Please check your connection.');
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });
            if (!result.canceled) {
                setAttachments([...attachments, result.assets[0].uri]);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleSave = async () => {
        if (!selectedSupplierId) {
            Alert.alert('Required', 'Please select a supplier');
            return;
        }
        if (!amount) {
            Alert.alert('Required', 'Please enter an amount');
            return;
        }

        // SAFETY NET: If no category is selected, pick the first one available
        let finalCategoryId = categoryId;
        if (!finalCategoryId && expenseAccounts.length > 0) {
            // Find first valid account (ensure id exists)
            const validAcc = expenseAccounts.find(a => a && a.id);
            if (validAcc) {
                finalCategoryId = String(validAcc.id);
            }
        }

        if (!finalCategoryId) {
            Alert.alert(
                'Critical Error',
                `No valid expense accounts found. Please check settings. (Loaded: ${expenseAccounts.length})`
            );
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('vendorId', String(selectedSupplierId));
            formData.append('purchaseDate', billDate.toISOString());
            formData.append('dueDate', dueDate.toISOString());
            formData.append('billNumber', reference);
            formData.append('notes', notes);
            formData.append('status', paymentStatus);

            // Ensure accountId is a valid number
            // Handle string IDs like "acct-5000" by stripping non-digits
            const cleanId = String(finalCategoryId).replace(/\D/g, '');
            const accountIdNum = parseInt(cleanId, 10);

            if (isNaN(accountIdNum)) {
                throw new Error(`Invalid Account ID conversion. Value: ${finalCategoryId}`);
            }

            formData.append('items', JSON.stringify([{
                description: `Bill from ${suppliers.find(s => s.id === selectedSupplierId)?.name}`,
                quantity: 1,
                unitPrice: parseFloat(amount),
                accountId: accountIdNum
            }]));

            if (attachments.length > 0) {
                const filename = attachments[0].split('/').pop() || 'bill.jpg';
                const type = `image/${filename.split('.').pop()}`;
                // @ts-ignore
                formData.append('attachment', { uri: attachments[0], name: filename, type });
            }

            await apiService.createPurchase(formData);
            Alert.alert('Success', 'Bill saved successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save bill');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#122f8a', '#0a1a5c']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Enter Bill</Text>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="notifications-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="settings-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Bill Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bill Details</Text>
                    <View style={styles.divider} />

                    <View style={styles.field}>
                        <Text style={styles.label}>Supplier</Text>
                        <TouchableOpacity style={styles.select} onPress={() => setShowSupplierModal(true)}>
                            <Text style={[styles.selectText, !selectedSupplierId && styles.placeholder]}>
                                {suppliers.find(s => s.id === selectedSupplierId)?.name || 'Choose Supplier ▼'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Bill Category</Text>
                        <TouchableOpacity
                            style={styles.select}
                            onPress={() => setShowCategoryModal(true)}
                        >
                            <Text style={[styles.selectText, (!categoryId && expenseAccounts.length === 0) && { color: '#ef4444' }]}>
                                {categoryId
                                    ? expenseAccounts.find(a => String(a.id) === categoryId)?.name
                                    : expenseAccounts.length === 0
                                        ? 'Loading Categories...'
                                        : 'Auto-fill from Supplier or choose ▼'}
                            </Text>
                        </TouchableOpacity>
                        {expenseAccounts.length === 0 && (
                            <TouchableOpacity onPress={() => loadInitialData()} style={{ marginTop: 8 }}>
                                <Text style={{ color: '#122f8a', fontSize: 13 }}>↻ Retry Loading</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Bill Amount</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            keyboardType="numeric"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Due Date</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowDueDatePicker(true)}
                            >
                                <Text style={styles.dateText}>{formatDate(dueDate)} ▼</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Bill Date</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowBillDatePicker(true)}
                            >
                                <Text style={styles.dateText}>{formatDate(billDate)} ▼</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Payment Status Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Status</Text>
                    <View style={styles.divider} />

                    <View style={styles.statusRow}>
                        {[
                            { value: 'UNPAID', label: 'Unpaid' },
                            { value: 'PARTIAL', label: 'Partially Paid' },
                            { value: 'PAID', label: 'Paid' }
                        ].map((status) => (
                            <TouchableOpacity
                                key={status.value}
                                style={[styles.statusBtn, paymentStatus === status.value && styles.statusBtnActive]}
                                onPress={() => setPaymentStatus(status.value as any)}
                            >
                                <View style={[styles.radio, paymentStatus === status.value && styles.radioActive]}>
                                    {paymentStatus === status.value && <View style={styles.radioDot} />}
                                </View>
                                <Text style={[styles.statusLabel, paymentStatus === status.value && styles.statusLabelActive]}>
                                    {status.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Optional Fields Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Optional Fields</Text>
                    <View style={styles.divider} />

                    <View style={styles.field}>
                        <Text style={styles.label}>Reference Number</Text>
                        <TextInput
                            style={styles.input}
                            value={reference}
                            onChangeText={setReference}
                            placeholder="e.g. Invoice #, Meter #"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Additional notes..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </View>

                {/* Attachments Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Attachments</Text>
                    <View style={styles.divider} />

                    <View style={styles.attachmentRow}>
                        <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
                            <Ionicons name="camera" size={20} color="#122f8a" />
                            <Text style={styles.uploadText}>Upload Bill Photo</Text>
                        </TouchableOpacity>
                        {attachments.length < 3 && (
                            <TouchableOpacity style={styles.addBtn} onPress={handlePickImage}>
                                <Ionicons name="add" size={20} color="#fe9900" />
                                <Text style={styles.addText}>Add Another</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {attachments.length > 0 && (
                        <View style={styles.previewRow}>
                            {attachments.map((uri, index) => (
                                <View key={index} style={styles.previewContainer}>
                                    <Image source={{ uri }} style={styles.preview} />
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Financial Mapping Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Mapping</Text>
                    <View style={styles.divider} />

                    <View style={styles.field}>
                        <Text style={styles.label}>Expense Account</Text>
                        <View style={styles.readOnly}>
                            <Text style={styles.readOnlyText}>
                                {categoryId
                                    ? `Auto-filled: ${expenseAccounts.find(a => String(a.id) === categoryId)?.name}`
                                    : 'Select Bill Category above'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Payment Method</Text>
                        <TouchableOpacity
                            style={[styles.select, paymentStatus === 'UNPAID' && styles.selectDisabled]}
                            onPress={() => paymentStatus !== 'UNPAID' && setShowPaymentMethodModal(true)}
                            disabled={paymentStatus === 'UNPAID'}
                        >
                            <Text style={[styles.selectText, !paymentMethodId && styles.placeholder]}>
                                {paymentStatus === 'UNPAID'
                                    ? 'None yet (Bill is unpaid) ▼'
                                    : paymentMethods.find(m => m.id === paymentMethodId)?.name || 'Choose Payment Method ▼'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Bill</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <CustomDatePicker
                visible={showDueDatePicker}
                onClose={() => setShowDueDatePicker(false)}
                date={dueDate}
                onChange={setDueDate}
                title="Select Due Date"
            />

            <CustomDatePicker
                visible={showBillDatePicker}
                onClose={() => setShowBillDatePicker(false)}
                date={billDate}
                onChange={setBillDate}
                title="Select Bill Date"
            />

            <Modal visible={showSupplierModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Supplier</Text>
                            <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {suppliers.map(s => (
                                <TouchableOpacity
                                    key={s.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedSupplierId(s.id);
                                        setShowSupplierModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{s.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showCategoryModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {expenseAccounts.length > 0 ? (
                                expenseAccounts.map(a => (
                                    <TouchableOpacity
                                        key={a.id}
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setCategoryId(String(a.id));
                                            setShowCategoryModal(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{a.name}</Text>
                                        {a.code && <Text style={styles.modalItemSub}>{a.code}</Text>}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={{ padding: 20 }}>
                                    <Text style={{ textAlign: 'center', color: '#64748b' }}>
                                        No expense types found.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showPaymentMethodModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payment Method</Text>
                            <TouchableOpacity onPress={() => setShowPaymentMethodModal(false)}>
                                <Ionicons name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {paymentMethods.map(m => (
                                <TouchableOpacity
                                    key={m.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setPaymentMethodId(m.id);
                                        setShowPaymentMethodModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{m.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Simple JS Date Picker Component
const CustomDatePicker = ({ visible, onClose, date, onChange, title }: any) => {
    const [tempDate, setTempDate] = useState(date || new Date());

    // Generate dates for current month
    const currentYear = tempDate.getFullYear();
    const currentMonth = tempDate.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const changeMonth = (increment: number) => {
        const newDate = new Date(tempDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setTempDate(newDate);
    };

    const confirmDate = () => {
        onChange(tempDate);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modal, { maxHeight: 'auto' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ padding: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => changeMonth(-1)} style={{ padding: 10 }}>
                                <Ionicons name="chevron-back" size={24} color="#122f8a" />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>
                                {months[tempDate.getMonth()]} {tempDate.getFullYear()}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)} style={{ padding: 10 }}>
                                <Ionicons name="chevron-forward" size={24} color="#122f8a" />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {days.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    style={{
                                        width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
                                        borderRadius: 20,
                                        backgroundColor: tempDate.getDate() === day ? '#122f8a' : '#f1f5f9'
                                    }}
                                    onPress={() => {
                                        const newDate = new Date(tempDate);
                                        newDate.setDate(day);
                                        setTempDate(newDate);
                                    }}
                                >
                                    <Text style={{
                                        color: tempDate.getDate() === day ? '#fff' : '#334155',
                                        fontWeight: tempDate.getDate() === day ? '700' : '400'
                                    }}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={{
                                backgroundColor: '#122f8a', marginTop: 20, padding: 16,
                                borderRadius: 12, alignItems: 'center'
                            }}
                            onPress={confirmDate}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Date</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingHorizontal: 20, paddingVertical: 16, paddingTop: Platform.OS === 'android' ? 40 : 16 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
    headerIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

    content: { flex: 1 },
    section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#122f8a', marginBottom: 8 },
    divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 16 },

    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0f172a' },
    textArea: { height: 90, textAlignVertical: 'top', paddingTop: 14 },
    select: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    selectDisabled: { opacity: 0.6 },
    selectText: { fontSize: 15, color: '#0f172a' },
    placeholder: { color: '#9ca3af' },

    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },
    dateInput: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    dateText: { fontSize: 15, color: '#0f172a' },

    statusRow: { flexDirection: 'row', gap: 8 },
    statusBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#fff' },
    statusBtnActive: { borderColor: '#fe9900', backgroundColor: '#fff7ed' },
    radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
    radioActive: { borderColor: '#fe9900' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fe9900' },
    statusLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    statusLabelActive: { color: '#fe9900' },

    attachmentRow: { flexDirection: 'row', gap: 12 },
    uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#dbeafe', borderRadius: 12, paddingVertical: 14, gap: 8 },
    uploadText: { fontSize: 14, fontWeight: '600', color: '#122f8a' },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#fed7aa', borderRadius: 12, paddingHorizontal: 16, gap: 6 },
    addText: { fontSize: 14, fontWeight: '600', color: '#fe9900' },

    previewRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    previewContainer: { position: 'relative' },
    preview: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#e5e7eb' },
    removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 10 },

    readOnly: { backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    readOnlyText: { fontSize: 14, color: '#64748b', fontStyle: 'italic' },

    footer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    saveBtn: { backgroundColor: '#122f8a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#122f8a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    modalItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    modalItemText: { fontSize: 16, color: '#334155', fontWeight: '500' },
    modalItemSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
});
