import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';

// Premium Design Palette
const PRIMARY_BLUE = '#122f8a';
const SECONDARY_BLUE = '#1a3bb0';
const ACCENT_ORANGE = '#fe9900';
const SUCCESS_GREEN = '#2e7d32';
const TEXT_DARK = '#1e293b';
const TEXT_MUTED = '#64748b';
const BORDER_COLOR = '#e2e8f0';
const BG_COLOR = '#f8fafc';

export default function AddSupplierScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Name & Contact');

    // Section 1: Name and Contact
    const [formData, setFormData] = useState({
        title: '',
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        displayName: '',
        companyName: '',
        email: '',
        phone: '',
        mobile: '',
        fax: '',
        other: '',
        website: '',
        // Section 2: Address
        street1: '',
        street2: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Kenya',
        // Section 3: Notes & Attachments
        notes: '',
        // Section 4: Additional Info
        taxId: '',
        expenseRate: '',
        billingRate: '',
        terms: 'Net 30',
        accountNo: '',
        defaultExpenseCategory: '',
        openingBalance: '0.00',
        asOfDate: '2026-02-25',
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            // Auto-fill Display Name if it's empty and name fields change
            if (field === 'firstName' || field === 'lastName' || field === 'companyName') {
                if (!prev.displayName) {
                    newData.displayName = newData.companyName || `${newData.firstName} ${newData.lastName}`.trim();
                }
            }
            return newData;
        });
    };

    const handleSave = async () => {
        if (!formData.displayName) {
            Alert.alert('Required', 'Supplier display name is required');
            return;
        }

        setLoading(true);
        try {
            // Transform for backend
            const payload = {
                name: formData.displayName,
                email: formData.email,
                phone: formData.phone || formData.mobile,
                address: `${formData.street1}, ${formData.city}`,
                paymentTerms: formData.terms,
                // Add more metadata if backend supports it
                metadata: {
                    fullName: `${formData.title} ${formData.firstName} ${formData.middleName} ${formData.lastName} ${formData.suffix}`.trim(),
                    companyName: formData.companyName,
                    website: formData.website,
                    province: formData.province,
                    taxId: formData.taxId,
                    accountNo: formData.accountNo,
                    openingBalance: formData.openingBalance,
                    openingBalanceDate: formData.asOfDate
                }
            };

            await apiService.createVendor(payload);

            Alert.alert('Success', 'Supplier created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Error saving supplier:', error);
            Alert.alert('Error', error.message || 'Failed to save supplier');
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label: string, field: keyof typeof formData, placeholder = '', icon?: string, half = false) => (
        <View style={[styles.inputGroup, half && { flex: 1 }]}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputWrapper}>
                {icon && <Feather name={icon as any} size={16} color={TEXT_MUTED} style={styles.inputIcon} />}
                <TextInput
                    style={styles.textInput}
                    value={formData[field]}
                    onChangeText={(val) => updateField(field, val)}
                    placeholder={placeholder}
                    placeholderTextColor={TEXT_MUTED}
                />
            </View>
        </View>
    );

    const tabs = ['Name & Contact', 'Address', 'Notes & Attachments', 'Additional Info'];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView edges={['top']} style={styles.headerWrapper}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
                        <Ionicons name="close" size={28} color={TEXT_DARK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Supplier Information</Text>
                    <TouchableOpacity
                        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {activeTab === 'Name & Contact' && (
                        <View style={styles.section}>
                            <View style={styles.row}>
                                {renderInput('Title', 'title', 'Mr/Ms', undefined, true)}
                                {renderInput('First name', 'firstName', '', undefined, true)}
                            </View>
                            <View style={styles.row}>
                                {renderInput('Middle name', 'middleName', '', undefined, true)}
                                {renderInput('Last name', 'lastName', '', undefined, true)}
                            </View>
                            {renderInput('Suffix', 'suffix', 'Jr/III')}
                            {renderInput('Supplier display name *', 'displayName', 'How you\'ll see this supplier')}
                            {renderInput('Company name', 'companyName', '', 'briefcase')}
                            {renderInput('Email', 'email', 'name@example.com', 'mail')}
                            <View style={styles.row}>
                                {renderInput('Phone number', 'phone', '', 'phone', true)}
                                {renderInput('Mobile number', 'mobile', '', 'smartphone', true)}
                            </View>
                            <View style={styles.row}>
                                {renderInput('Fax', 'fax', '', 'printer', true)}
                                {renderInput('Other', 'other', '', 'info', true)}
                            </View>
                            {renderInput('Website', 'website', 'https://...', 'globe')}
                        </View>
                    )}

                    {activeTab === 'Address' && (
                        <View style={styles.section}>
                            {renderInput('Street address 1', 'street1', '', 'map-pin')}
                            {renderInput('Street address 2', 'street2')}
                            <TouchableOpacity style={styles.addLineBtn}>
                                <Ionicons name="add" size={20} color={PRIMARY_BLUE} />
                                <Text style={styles.addLineText}>Add lines</Text>
                            </TouchableOpacity>
                            <View style={styles.row}>
                                {renderInput('City', 'city', '', undefined, true)}
                                {renderInput('Province', 'province', '', undefined, true)}
                            </View>
                            <View style={styles.row}>
                                {renderInput('Postal code', 'postalCode', '', undefined, true)}
                                {renderInput('Country', 'country', 'Kenya', undefined, true)}
                            </View>

                            <View style={styles.previewBox}>
                                <Text style={styles.previewLabel}>Preview address</Text>
                                <Text style={styles.previewText}>
                                    {formData.street1 || 'No address provided'}
                                    {formData.street2 ? `\n${formData.street2}` : ''}
                                    {formData.city ? `\n${formData.city}, ${formData.province}` : ''}
                                    {formData.postalCode ? `\n${formData.postalCode}` : ''}
                                    {`\n${formData.country}`}
                                </Text>
                            </View>
                        </View>
                    )}

                    {activeTab === 'Notes & Attachments' && (
                        <View style={styles.section}>
                            <Text style={styles.inputLabel}>Notes</Text>
                            <TextInput
                                style={styles.textArea}
                                value={formData.notes}
                                onChangeText={(val) => updateField('notes', val)}
                                multiline
                                placeholder="Add notes about this supplier..."
                                placeholderTextColor={TEXT_MUTED}
                            />

                            <View style={styles.attachmentSection}>
                                <Text style={styles.inputLabel}>Add attachment</Text>
                                <TouchableOpacity style={styles.attachmentBox}>
                                    <View style={styles.attachmentIcon}>
                                        <Feather name="upload-cloud" size={32} color={PRIMARY_BLUE} />
                                    </View>
                                    <Text style={styles.attachmentTitle}>Drop files here or click to upload</Text>
                                    <Text style={styles.attachmentSub}>Max file size: 20 MB</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {activeTab === 'Additional Info' && (
                        <View style={styles.section}>
                            <View style={styles.subSectionTitle}>
                                <Ionicons name="calculator" size={18} color={TEXT_DARK} />
                                <Text style={styles.subSectionText}>Taxes</Text>
                            </View>
                            {renderInput('Business ID No. / Social Insurance No.', 'taxId')}

                            <View style={styles.subSectionTitle}>
                                <Ionicons name="trending-up" size={18} color={TEXT_DARK} />
                                <Text style={styles.subSectionText}>Expense rates</Text>
                            </View>
                            <View style={styles.row}>
                                {renderInput('Billing rate (/hr)', 'billingRate', '0.00', undefined, true)}
                                <View style={{ flex: 1 }} />
                            </View>

                            <View style={styles.subSectionTitle}>
                                <Ionicons name="card" size={18} color={TEXT_DARK} />
                                <Text style={styles.subSectionText}>Payments</Text>
                            </View>
                            {renderInput('Terms', 'terms', 'Net 30')}
                            {renderInput('Account no.', 'accountNo')}

                            <View style={styles.subSectionTitle}>
                                <Ionicons name="book" size={18} color={TEXT_DARK} />
                                <Text style={styles.subSectionText}>Accounting</Text>
                            </View>
                            {renderInput('Default expense category', 'defaultExpenseCategory', 'Choose account')}

                            <View style={styles.subSectionTitle}>
                                <Ionicons name="wallet" size={18} color={TEXT_DARK} />
                                <Text style={styles.subSectionText}>Opening balance</Text>
                            </View>
                            <View style={styles.row}>
                                {renderInput('Opening balance', 'openingBalance', '0.00', undefined, true)}
                                {renderInput('As of', 'asOfDate', '25/02/2026', 'calendar', true)}
                            </View>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    headerWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, height: 60 },
    headerBack: { padding: 5, marginLeft: -5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT_DARK, flex: 1, textAlign: 'center' },
    saveBtn: { backgroundColor: SUCCESS_GREEN, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    saveBtnDisabled: { opacity: 0.7 },

    tabsWrapper: { borderBottomWidth: 1, borderBottomColor: BORDER_COLOR },
    tabsContent: { paddingHorizontal: 15, paddingVertical: 10, gap: 10 },
    tab: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#f1f5f9' },
    tabActive: { backgroundColor: PRIMARY_BLUE },
    tabText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '600' },
    tabTextActive: { color: '#fff' },

    content: { flex: 1, backgroundColor: BG_COLOR },
    scrollContent: { padding: 20 },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: BORDER_COLOR },

    row: { flexDirection: 'row', gap: 12 },
    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: TEXT_DARK, marginBottom: 8 },
    inputWrapper: { height: 48, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
    inputIcon: { marginRight: 10 },
    textInput: { flex: 1, fontSize: 14, color: TEXT_DARK },
    textArea: { height: 120, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: BORDER_COLOR, padding: 12, textAlignVertical: 'top', fontSize: 14, color: TEXT_DARK, marginBottom: 20 },

    addLineBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 18 },
    addLineText: { fontSize: 14, color: PRIMARY_BLUE, fontWeight: '600' },

    previewBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 15, borderWidth: 1, borderColor: BORDER_COLOR, borderStyle: 'dashed', marginTop: 10 },
    previewLabel: { fontSize: 12, fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8, textTransform: 'uppercase' },
    previewText: { fontSize: 14, color: TEXT_DARK, lineHeight: 20 },

    attachmentSection: { marginTop: 10 },
    attachmentBox: { height: 150, borderRadius: 8, borderWidth: 2, borderColor: BORDER_COLOR, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafbfc' },
    attachmentIcon: { marginBottom: 10 },
    attachmentTitle: { fontSize: 14, color: TEXT_DARK, fontWeight: '600' },
    attachmentSub: { fontSize: 12, color: TEXT_MUTED, marginTop: 4 },

    subSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 15 },
    subSectionText: { fontSize: 15, fontWeight: 'bold', color: TEXT_DARK },
});
