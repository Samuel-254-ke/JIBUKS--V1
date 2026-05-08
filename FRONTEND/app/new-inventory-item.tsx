import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '@/services/api';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

// Color Palette
const COLORS = {
    primary: '#122f8a',
    primaryLight: '#1a3bb0',
    secondary: '#fe9900',
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
    success: '#10b981',
    error: '#ef4444',
    white: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    tagBg: '#f0f4ff',
    tagText: '#475569',
};

const INCOME_DETAIL_TYPES = [
    'Discounts/Refunds Given',
    'Non-Profit Income',
    'Other Primary Income',
    'Revenue - General',
    'Sales - retail',
    'Sales - wholesale',
    'Sales of Product Income',
    'Service/Fee Income',
    'Unapplied Cash Payment Income'
];

const EXPENSE_DETAIL_TYPES = [
    'Cost of Goods Sold',
    'Operating Expense',
    'Other Expense',
    'Supplies & Materials',
];

const ASSET_DETAIL_TYPES = [
    'Other Current Asset',
    'Inventory',
    'Prepaid Expenses',
    'Fixed Asset',
];

interface AccountData {
    id: number | string;
    _dbId?: number;
    code: string;
    name: string;
    detailType?: string;
    subtype?: string;
    type?: string;
}

interface CategoryData {
    id: number | string;
    name: string;
    type: string;
}

interface ItemTypeData {
    id: number;
    name: string;
    code: string;
}

interface SectionProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

// Helper: get account type tag for display
const getAccountTag = (account: AccountData): string => {
    if (!account) return '';
    const st = (account.subtype || '').toLowerCase();
    const dt = (account.detailType || '').toLowerCase();
    const tp = (account.type || '').toUpperCase();

    // Income accounts
    if (tp === 'INCOME') return 'Income';
    // COGS / Expense accounts
    if (st === 'cogs' || dt.includes('cost of goods')) return 'Cost Of Goods Sold';
    if (tp === 'EXPENSE') return 'Expense';
    // Asset accounts
    if (st === 'inventory' || st === 'other_current_asset') return 'Other Current Asset';
    if (st === 'prepayment') return 'Prepaid Expenses';
    if (st.includes('fixed_asset')) return 'Fixed Asset';
    if (tp === 'ASSET') return 'Asset';
    return tp || '';
};

const CollapsibleSection = ({ title, isOpen, onToggle, children }: SectionProps) => (
    <View style={styles.sectionContainer}>
        <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textLight}
            />
        </TouchableOpacity>
        {isOpen && <View style={styles.sectionContent}>{children}</View>}
    </View>
);

export default function NewInventoryItemScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    // Form Sections State
    const [sections, setSections] = useState({
        basic: true,
        inventory: true,
        sales: true,
        purchasing: true,
    });

    // Accounts & Metadata State
    const [itemTypes, setItemTypes] = useState<ItemTypeData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [accounts, setAccounts] = useState({
        assets: [] as AccountData[],
        income: [] as AccountData[],
        expenses: [] as AccountData[],
    });
    const [vendors, setVendors] = useState<any[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        itemType: 'INVENTORY_ITEM',
        sku: '',
        category: '',
        imageUrl: '',

        // Inventory Info
        initialQuantity: '',
        asOfDate: new Date(),
        reorderLevel: '',
        assetAccountId: '',

        // Sales Info
        salesDescription: '',
        sellingPrice: '',
        incomeAccountId: '',

        // Purchasing Info
        purchaseDescription: '',
        costPrice: '',
        cogsAccountId: '',
        preferredVendorId: '',
    });

    const [showDatePicker, setShowDatePicker] = useState(false);

    // Modals State - only for "Add New" forms
    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isIncomeAccountModalVisible, setIsIncomeAccountModalVisible] = useState(false);
    const [isExpenseAccountModalVisible, setIsExpenseAccountModalVisible] = useState(false);
    const [isAssetAccountModalVisible, setIsAssetAccountModalVisible] = useState(false);
    const [isVendorModalVisible, setIsVendorModalVisible] = useState(false);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newIncomeAccountData, setNewIncomeAccountData] = useState({
        name: '',
        detailType: 'Sales of Product Income'
    });
    const [newExpenseAccountData, setNewExpenseAccountData] = useState({
        name: '',
        detailType: 'Cost of Goods Sold'
    });
    const [newAssetAccountData, setNewAssetAccountData] = useState({
        name: '',
        detailType: 'Other Current Asset'
    });
    const [newVendorData, setNewVendorData] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [savingModal, setSavingModal] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [assets, income, expenses, vendorList, itypes, cats] = await Promise.all([
                apiService.get<AccountData[]>('/accounts', { params: { type: 'ASSET' } }),
                apiService.get<AccountData[]>('/accounts', { params: { type: 'INCOME' } }),
                apiService.get<AccountData[]>('/accounts', { params: { type: 'EXPENSE' } }),
                apiService.get<any[]>('/vendors'),
                apiService.get<ItemTypeData[]>('/inventory/item-types'),
                apiService.get<CategoryData[]>('/categories')
            ]);

            setAccounts({
                assets: assets || [],
                income: income || [],
                expenses: expenses || []
            });
            setVendors(vendorList || []);
            setItemTypes(itypes || []);
            setCategories(cats || []);

            // Set Smart Defaults from Chart of Accounts
            const inventoryAsset = (assets || []).find((a: AccountData) => a.code === '1201' || a.name.toLowerCase().includes('inventory'));
            const salesIncome = (income || []).find((a: AccountData) => a.code === '4190' || a.name.toLowerCase().includes('sales of product'));
            const cogsExpense = (expenses || []).find((a: AccountData) => a.code === '5001' || a.name.toLowerCase().includes('cost of sales'));
            const defaultItemType = (itypes || []).find(it => it.code === 'INVENTORY_ITEM')?.code || 'INVENTORY_ITEM';

            setFormData(prev => ({
                ...prev,
                itemType: defaultItemType,
                assetAccountId: inventoryAsset ? ((inventoryAsset as any)._dbId?.toString() || inventoryAsset.id.toString()) : '',
                incomeAccountId: salesIncome ? ((salesIncome as any)._dbId?.toString() || salesIncome.id.toString()) : '',
                cogsAccountId: cogsExpense ? ((cogsExpense as any)._dbId?.toString() || cogsExpense.id.toString()) : '',
                category: cats?.[0]?.name || ''
            }));

        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setFetchingData(false);
        }
    };

    const toggleSection = (section: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
        }
    };

    // ==========================================
    // ADD NEW handlers
    // ==========================================

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        setSavingModal(true);
        try {
            const res = await apiService.post('/categories', {
                name: newCategoryName,
                type: 'income'
            });
            setCategories(prev => [...prev, res]);
            setFormData(prev => ({ ...prev, category: res.name }));
            setIsCategoryModalVisible(false);
            setNewCategoryName('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add category');
        } finally {
            setSavingModal(false);
        }
    };

    const handleAddIncomeAccount = async () => {
        if (!newIncomeAccountData.name.trim()) return;
        setSavingModal(true);
        try {
            const maxCode = accounts.income.reduce((max, acc) => {
                const num = parseInt(acc.code);
                return !isNaN(num) && num > max ? num : max;
            }, 4000);

            const res = await apiService.post('/accounts', {
                name: newIncomeAccountData.name,
                type: 'INCOME',
                detailType: newIncomeAccountData.detailType,
                code: String(maxCode + 1)
            });

            setAccounts(prev => ({
                ...prev,
                income: [...prev.income, res]
            }));
            setFormData(prev => ({ ...prev, incomeAccountId: res._dbId?.toString() || res.id.toString() }));
            setIsIncomeAccountModalVisible(false);
            setNewIncomeAccountData({ name: '', detailType: 'Sales of Product Income' });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add income account');
        } finally {
            setSavingModal(false);
        }
    };

    const handleAddExpenseAccount = async () => {
        if (!newExpenseAccountData.name.trim()) return;
        setSavingModal(true);
        try {
            const maxCode = accounts.expenses.reduce((max, acc) => {
                const num = parseInt(acc.code);
                return !isNaN(num) && num > max ? num : max;
            }, 5000);

            const res = await apiService.post('/accounts', {
                name: newExpenseAccountData.name,
                type: 'EXPENSE',
                detailType: newExpenseAccountData.detailType,
                code: String(maxCode + 1)
            });

            setAccounts(prev => ({
                ...prev,
                expenses: [...prev.expenses, res]
            }));
            setFormData(prev => ({ ...prev, cogsAccountId: res._dbId?.toString() || res.id.toString() }));
            setIsExpenseAccountModalVisible(false);
            setNewExpenseAccountData({ name: '', detailType: 'Cost of Goods Sold' });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add expense account');
        } finally {
            setSavingModal(false);
        }
    };

    const handleAddAssetAccount = async () => {
        if (!newAssetAccountData.name.trim()) return;
        setSavingModal(true);
        try {
            const maxCode = accounts.assets.reduce((max, acc) => {
                const num = parseInt(acc.code);
                return !isNaN(num) && num > max ? num : max;
            }, 1200);

            const res = await apiService.post('/accounts', {
                name: newAssetAccountData.name,
                type: 'ASSET',
                detailType: newAssetAccountData.detailType,
                code: String(maxCode + 1)
            });

            setAccounts(prev => ({
                ...prev,
                assets: [...prev.assets, res]
            }));
            setFormData(prev => ({ ...prev, assetAccountId: res._dbId?.toString() || res.id.toString() }));
            setIsAssetAccountModalVisible(false);
            setNewAssetAccountData({ name: '', detailType: 'Other Current Asset' });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add asset account');
        } finally {
            setSavingModal(false);
        }
    };

    const handleAddVendor = async () => {
        if (!newVendorData.name.trim()) return;
        setSavingModal(true);
        try {
            const res = await apiService.post('/vendors', {
                name: newVendorData.name,
                email: newVendorData.email || undefined,
                phone: newVendorData.phone || undefined,
            });
            setVendors(prev => [...prev, res]);
            setFormData(prev => ({ ...prev, preferredVendorId: res.id.toString() }));
            setIsVendorModalVisible(false);
            setNewVendorData({ name: '', email: '', phone: '' });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add supplier');
        } finally {
            setSavingModal(false);
        }
    };

    // ==========================================
    // Validation & Save
    // ==========================================

    const validateForm = () => {
        if (!formData.name.trim()) {
            Alert.alert('Required Field', 'Please enter a name for the product.');
            return false;
        }
        if (formData.itemType === 'INVENTORY_ITEM') {
            if (!formData.initialQuantity) {
                Alert.alert('Required Field', 'Please enter initial quantity on hand.');
                return false;
            }
            if (!formData.assetAccountId) {
                Alert.alert('Required Field', 'Please select an inventory asset account.');
                return false;
            }
        }
        if (!formData.incomeAccountId) {
            Alert.alert('Required Field', 'Please select an income account.');
            return false;
        }
        if (!formData.cogsAccountId) {
            Alert.alert('Required Field', 'Please select a cost of sales account.');
            return false;
        }
        return true;
    };

    const handleSave = async (isNew = false) => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                productType: formData.itemType,
                sku: formData.sku || undefined,
                category: formData.category,
                description: formData.salesDescription || formData.purchaseDescription,
                costPrice: Number(formData.costPrice) || 0,
                sellingPrice: Number(formData.sellingPrice) || 0,
                initialQuantity: Number(formData.initialQuantity) || 0,
                reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : null,
                assetAccountId: formData.assetAccountId ? parseInt(formData.assetAccountId) : null,
                incomeAccountId: formData.incomeAccountId ? parseInt(formData.incomeAccountId) : null,
                cogsAccountId: formData.cogsAccountId ? parseInt(formData.cogsAccountId) : null,
                preferredVendorId: formData.preferredVendorId ? parseInt(formData.preferredVendorId) : null,
            };

            await apiService.post('/inventory/products', payload);

            Alert.alert('Success', 'Inventory item created successfully!');

            if (isNew) {
                setFormData(prev => ({
                    ...prev,
                    name: '',
                    sku: '',
                    initialQuantity: '',
                    sellingPrice: '',
                    costPrice: '',
                    imageUrl: '',
                    salesDescription: '',
                    purchaseDescription: '',
                    asOfDate: new Date(),
                }));
            } else {
                router.back();
            }
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', error.message || 'Failed to create inventory item.');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // Helper: Build picker label with tag
    // ==========================================
    const buildAccountLabel = (account: AccountData): string => {
        const tag = getAccountTag(account);
        if (tag) {
            return `[${tag}]  ${account.name}`;
        }
        return account.name;
    };

    // Get the account ID value used in Picker
    const getAccountValue = (account: AccountData): string => {
        return (account as any)._dbId?.toString() || account.id.toString();
    };

    // Get account name only (no tag) for selected display
    const getSelectedAccountName = (accountList: AccountData[], selectedId: string): string => {
        if (!selectedId) return '';
        const found = accountList.find(a => getAccountValue(a) === selectedId);
        return found ? found.name : '';
    };

    // ==========================================
    // Render
    // ==========================================

    if (fetchingData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading configurations...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.headerGradient}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
                            <Ionicons name="close" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add a new product</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.contentScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* ======================== BASIC INFO ======================== */}
                    <CollapsibleSection
                        title="Basic info"
                        isOpen={sections.basic}
                        onToggle={() => toggleSection('basic')}
                    >
                        <View style={styles.formRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Name*</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g. Blue Widget"
                                    placeholderTextColor="#475569"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                />
                            </View>
                            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
                                {formData.imageUrl ? (
                                    <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="image-outline" size={24} color={COLORS.primary} />
                                        <Text style={styles.imageLabel}>Add image</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Item Type - Simple Dropdown */}
                        <Text style={styles.inputLabel}>Item type</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={formData.itemType}
                                onValueChange={(val) => setFormData({ ...formData, itemType: val })}
                                style={styles.picker}
                            >
                                {itemTypes.map(it => (
                                    <Picker.Item key={it.id} label={it.name} value={it.code} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.inputLabel}>SKU</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Stock Keeping Unit"
                            placeholderTextColor="#64748b"
                            value={formData.sku}
                            onChangeText={(text) => setFormData({ ...formData, sku: text })}
                        />

                        {/* Category - Dropdown with Add New */}
                        <Text style={styles.inputLabel}>Category</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={formData.category}
                                onValueChange={(val) => {
                                    if (val === '__ADD_NEW__') {
                                        setIsCategoryModalVisible(true);
                                    } else {
                                        setFormData({ ...formData, category: val });
                                    }
                                }}
                                style={styles.picker}
                            >
                                <Picker.Item label="＋ Add New Category" value="__ADD_NEW__" color={COLORS.primary} />
                                <Picker.Item label="Select Category" value="" color={COLORS.textLight} />
                                {categories.map(cat => (
                                    <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
                                ))}
                            </Picker>
                        </View>
                    </CollapsibleSection>

                    {/* ======================== INVENTORY INFO ======================== */}
                    {formData.itemType === 'INVENTORY_ITEM' && (
                        <CollapsibleSection
                            title="Inventory info"
                            isOpen={sections.inventory}
                            onToggle={() => toggleSection('inventory')}
                        >
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.inputLabel}>Initial quantity on hand*</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="0"
                                        placeholderTextColor="#475569"
                                        keyboardType="numeric"
                                        value={formData.initialQuantity}
                                        onChangeText={(text) => setFormData({ ...formData, initialQuantity: text })}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.inputLabel}>As of date*</Text>
                                    <TouchableOpacity
                                        style={styles.dateSelector}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text style={styles.dateText}>{formData.asOfDate.toLocaleDateString()}</Text>
                                        <Ionicons name="calendar-outline" size={18} color={COLORS.textLight} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showDatePicker && (
                                <View style={styles.datePickerContainer}>
                                    <DateTimePicker
                                        value={formData.asOfDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                        style={{ width: '100%' }}
                                        themeVariant="light"
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === 'android') setShowDatePicker(false);
                                            if (selectedDate) setFormData({ ...formData, asOfDate: selectedDate });
                                        }}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity
                                            style={styles.doneButton}
                                            onPress={() => setShowDatePicker(false)}
                                        >
                                            <Text style={styles.doneButtonText}>Confirm Date</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* Inventory Asset Account - Dropdown with Add New + Tags */}
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Inventory asset account*</Text>
                                    <View style={styles.pickerWrapper}>
                                        <Picker
                                            selectedValue={formData.assetAccountId}
                                            onValueChange={(val) => {
                                                if (val === '__ADD_NEW__') {
                                                    setIsAssetAccountModalVisible(true);
                                                } else {
                                                    setFormData({ ...formData, assetAccountId: val });
                                                }
                                            }}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="＋ Add New Account" value="__ADD_NEW__" color={COLORS.primary} />
                                            <Picker.Item label="Select Account" value="" color={COLORS.textLight} />
                                            {accounts.assets
                                                .filter(a => {
                                                    const st = (a.subtype || '').toLowerCase();
                                                    return st === 'inventory' || st === 'other_current_asset' || a.name.toLowerCase().includes('inventory');
                                                })
                                                .map(a => (
                                                    <Picker.Item
                                                        key={a.id}
                                                        label={buildAccountLabel(a)}
                                                        value={getAccountValue(a)}
                                                    />
                                                ))}
                                        </Picker>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginTop: 12 }}>
                                    <Text style={styles.inputLabel}>Reorder point</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Min Qty"
                                        placeholderTextColor="#475569"
                                        keyboardType="numeric"
                                        value={formData.reorderLevel}
                                        onChangeText={(text) => setFormData({ ...formData, reorderLevel: text })}
                                    />
                                </View>
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* ======================== SALES ======================== */}
                    <CollapsibleSection
                        title="Sales"
                        isOpen={sections.sales}
                        onToggle={() => toggleSection('sales')}
                    >
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder="Appears on sales forms"
                            placeholderTextColor="#64748b"
                            multiline
                            numberOfLines={3}
                            value={formData.salesDescription}
                            onChangeText={(text) => setFormData({ ...formData, salesDescription: text })}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.inputLabel}>Price/rate</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="0.00"
                                    placeholderTextColor="#475569"
                                    keyboardType="numeric"
                                    value={formData.sellingPrice}
                                    onChangeText={(text) => setFormData({ ...formData, sellingPrice: text })}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                {/* Income Account - Dropdown with Add New + Tags */}
                                <Text style={styles.inputLabel}>Income account*</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={formData.incomeAccountId}
                                        onValueChange={(val) => {
                                            if (val === '__ADD_NEW__') {
                                                setIsIncomeAccountModalVisible(true);
                                            } else {
                                                setFormData({ ...formData, incomeAccountId: val });
                                            }
                                        }}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="＋ Add New Account" value="__ADD_NEW__" color={COLORS.primary} />
                                        <Picker.Item label="Select Account" value="" color={COLORS.textLight} />
                                        {accounts.income.map(a => (
                                            <Picker.Item
                                                key={a.id}
                                                label={buildAccountLabel(a)}
                                                value={getAccountValue(a)}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>
                    </CollapsibleSection>

                    {/* ======================== PURCHASING ======================== */}
                    <CollapsibleSection
                        title="Purchasing"
                        isOpen={sections.purchasing}
                        onToggle={() => toggleSection('purchasing')}
                    >
                        <Text style={styles.inputLabel}>Purchase description</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            placeholder="Appears on purchase forms"
                            placeholderTextColor="#64748b"
                            multiline
                            numberOfLines={3}
                            value={formData.purchaseDescription}
                            onChangeText={(text) => setFormData({ ...formData, purchaseDescription: text })}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.inputLabel}>Purchase cost</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="0.00"
                                    placeholderTextColor="#475569"
                                    keyboardType="numeric"
                                    value={formData.costPrice}
                                    onChangeText={(text) => setFormData({ ...formData, costPrice: text })}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                {/* Expense Account - Dropdown with Add New + Tags */}
                                <Text style={styles.inputLabel}>Expense account*</Text>
                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={formData.cogsAccountId}
                                        onValueChange={(val) => {
                                            if (val === '__ADD_NEW__') {
                                                setIsExpenseAccountModalVisible(true);
                                            } else {
                                                setFormData({ ...formData, cogsAccountId: val });
                                            }
                                        }}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="＋ Add New Account" value="__ADD_NEW__" color={COLORS.primary} />
                                        <Picker.Item label="Select Account" value="" color={COLORS.textLight} />
                                        {accounts.expenses
                                            .filter(a => {
                                                const st = (a.subtype || '').toLowerCase();
                                                return st === 'cogs';
                                            })
                                            .map(a => (
                                                <Picker.Item
                                                    key={a.id}
                                                    label={buildAccountLabel(a)}
                                                    value={getAccountValue(a)}
                                                />
                                            ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        {/* Preferred Supplier - Dropdown with Add New */}
                        <Text style={styles.inputLabel}>Preferred supplier</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={formData.preferredVendorId}
                                onValueChange={(val) => {
                                    if (val === '__ADD_NEW__') {
                                        setIsVendorModalVisible(true);
                                    } else {
                                        setFormData({ ...formData, preferredVendorId: val });
                                    }
                                }}
                                style={styles.picker}
                            >
                                <Picker.Item label="＋ Add New Supplier" value="__ADD_NEW__" color={COLORS.primary} />
                                <Picker.Item label="Select a preferred supplier" value="" color={COLORS.textLight} />
                                {vendors.map(v => (
                                    <Picker.Item key={v.id} label={v.name} value={v.id.toString()} />
                                ))}
                            </Picker>
                        </View>
                    </CollapsibleSection>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ======================== FOOTER ======================== */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.primaryActions}>
                    <TouchableOpacity style={styles.saveNewBtn} onPress={() => handleSave(true)} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color={COLORS.text} /> : <Text style={styles.saveNewText}>Save and new</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveCloseBtn} onPress={() => handleSave(false)} disabled={loading}>
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.saveGradient}>
                            {loading ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.saveCloseText}>Save and close</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ======================== MODALS ======================== */}

            {/* Add New Category Modal */}
            <Modal visible={isCategoryModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Category</Text>
                            <TouchableOpacity onPress={() => setIsCategoryModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>Category Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Raw Materials"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            autoFocus
                        />
                        <TouchableOpacity
                            style={styles.modalSaveBtn}
                            onPress={handleAddCategory}
                            disabled={savingModal}
                        >
                            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.modalSaveGradient}>
                                {savingModal ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveText}>Create Category</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add New Income Account Modal */}
            <Modal visible={isIncomeAccountModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Income Account</Text>
                            <TouchableOpacity onPress={() => setIsIncomeAccountModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Account Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Consulting Revenue"
                            value={newIncomeAccountData.name}
                            onChangeText={val => setNewIncomeAccountData(p => ({ ...p, name: val }))}
                            autoFocus
                        />

                        <Text style={styles.inputLabel}>Detail Type</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={newIncomeAccountData.detailType}
                                onValueChange={val => setNewIncomeAccountData(p => ({ ...p, detailType: val }))}
                            >
                                {INCOME_DETAIL_TYPES.map(dt => (
                                    <Picker.Item key={dt} label={dt} value={dt} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.hintText}>This account will be restricted to INCOME transactions.</Text>

                        <TouchableOpacity
                            style={styles.modalSaveBtn}
                            onPress={handleAddIncomeAccount}
                            disabled={savingModal}
                        >
                            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.modalSaveGradient}>
                                {savingModal ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveText}>Create Account</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add New Expense Account Modal */}
            <Modal visible={isExpenseAccountModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Expense Account</Text>
                            <TouchableOpacity onPress={() => setIsExpenseAccountModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Account Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Direct Labor Costs"
                            value={newExpenseAccountData.name}
                            onChangeText={val => setNewExpenseAccountData(p => ({ ...p, name: val }))}
                            autoFocus
                        />

                        <Text style={styles.inputLabel}>Detail Type</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={newExpenseAccountData.detailType}
                                onValueChange={val => setNewExpenseAccountData(p => ({ ...p, detailType: val }))}
                            >
                                {EXPENSE_DETAIL_TYPES.map(dt => (
                                    <Picker.Item key={dt} label={dt} value={dt} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.hintText}>This account will be restricted to EXPENSE/COGS transactions.</Text>

                        <TouchableOpacity
                            style={styles.modalSaveBtn}
                            onPress={handleAddExpenseAccount}
                            disabled={savingModal}
                        >
                            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.modalSaveGradient}>
                                {savingModal ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveText}>Create Account</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add New Asset Account Modal */}
            <Modal visible={isAssetAccountModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Asset Account</Text>
                            <TouchableOpacity onPress={() => setIsAssetAccountModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Account Name</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Work In Progress Inventory"
                            value={newAssetAccountData.name}
                            onChangeText={val => setNewAssetAccountData(p => ({ ...p, name: val }))}
                            autoFocus
                        />

                        <Text style={styles.inputLabel}>Detail Type</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={newAssetAccountData.detailType}
                                onValueChange={val => setNewAssetAccountData(p => ({ ...p, detailType: val }))}
                            >
                                {ASSET_DETAIL_TYPES.map(dt => (
                                    <Picker.Item key={dt} label={dt} value={dt} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.hintText}>This account will be restricted to ASSET transactions.</Text>

                        <TouchableOpacity
                            style={styles.modalSaveBtn}
                            onPress={handleAddAssetAccount}
                            disabled={savingModal}
                        >
                            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.modalSaveGradient}>
                                {savingModal ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveText}>Create Account</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add New Vendor/Supplier Modal */}
            <Modal visible={isVendorModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Supplier</Text>
                            <TouchableOpacity onPress={() => setIsVendorModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Supplier Name*</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Acme Supplies Ltd"
                            value={newVendorData.name}
                            onChangeText={val => setNewVendorData(p => ({ ...p, name: val }))}
                            autoFocus
                        />

                        <Text style={styles.inputLabel}>Email (optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. supplier@example.com"
                            value={newVendorData.email}
                            onChangeText={val => setNewVendorData(p => ({ ...p, email: val }))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.inputLabel}>Phone (optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. +254 700 000 000"
                            value={newVendorData.phone}
                            onChangeText={val => setNewVendorData(p => ({ ...p, phone: val }))}
                            keyboardType="phone-pad"
                        />

                        <TouchableOpacity
                            style={styles.modalSaveBtn}
                            onPress={handleAddVendor}
                            disabled={savingModal}
                        >
                            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.modalSaveGradient}>
                                {savingModal ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalSaveText}>Create Supplier</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 12, fontSize: 16, color: COLORS.primary, fontWeight: '500' },
    headerGradient: { paddingTop: 10, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIconButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
    contentScroll: { flex: 1, padding: 16 },
    sectionContainer: { backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: COLORS.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: COLORS.card },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
    sectionContent: { padding: 18, paddingTop: 0 },
    formRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 12 },
    inputLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8, marginTop: 12 },
    textInput: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#0f172a' },
    textArea: { height: 80, textAlignVertical: 'top' },
    pickerWrapper: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12, overflow: 'hidden' },
    picker: { height: 50, width: '100%' },
    row: { flexDirection: 'row', alignItems: 'center' },
    dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flex: 1 },
    dateText: { fontSize: 16, color: COLORS.text },
    imagePickerButton: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' },
    imagePlaceholder: { alignItems: 'center' },
    imageLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
    previewImage: { width: '100%', height: '100%', borderRadius: 12 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10 },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 16 },
    cancelBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    primaryActions: { flexDirection: 'row', gap: 12 },
    saveNewBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: COLORS.border },
    saveNewText: { fontWeight: '700', color: COLORS.text },
    saveCloseBtn: { borderRadius: 10, overflow: 'hidden' },
    saveGradient: { paddingVertical: 12, paddingHorizontal: 20 },
    saveCloseText: { color: COLORS.white, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: COLORS.modalOverlay, justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: COLORS.white, width: width * 0.9, borderRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    modalSaveBtn: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
    modalSaveGradient: { paddingVertical: 16, alignItems: 'center' },
    modalSaveText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
    hintText: { fontSize: 12, color: COLORS.textLight, marginTop: 10, fontStyle: 'italic' },
    datePickerContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 320,
        justifyContent: 'center',
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    doneButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
