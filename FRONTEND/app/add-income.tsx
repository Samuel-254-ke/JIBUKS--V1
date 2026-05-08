import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Switch,
  Modal,
  FlatList,
  Image,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import apiService, { Account } from '@/services/api';
import { useAccounts } from '@/contexts/AccountsContext';

type Mode = 'QUICK' | 'SALARY';

// Brand Colors
const COLORS = {
  primary: '#122f8a', // Deep Blue
  primaryLight: '#3b5998',
  secondary: '#fe9900', // Orange
  secondaryLight: '#ffb74d',
  white: '#ffffff',
  bg: '#F3F4F6',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444'
};

interface DeductionRow {
  id: string;
  accountId: string;
  name: string;
  amount: string;
}

// Income source tiles
const INCOME_SOURCES = [
  { key: 'salary',   label: 'SALARY',   icon: 'briefcase' },
  { key: 'business', label: 'BUSINESS', icon: 'trending-up' },
  { key: 'gift',     label: 'GIFT',     icon: 'gift' },
  { key: 'other',    label: 'OTHER',    icon: 'add-circle-outline' },
] as const;

// Reusable Dropdown Modal
const SelectorModal = ({
  visible,
  onClose,
  title,
  items,
  onSelect,
  renderItem
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: any[];
  onSelect: (item: any) => void;
  renderItem?: (item: any) => React.ReactNode;
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              {renderItem ? renderItem(item) : <Text style={styles.modalItemText}>{item.name}</Text>}
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

export default function AddIncomeScreen() {
  const router = useRouter();
  const { accounts: contextAccounts, refreshAccounts } = useAccounts();

  // State
  const [mode, setMode] = useState<Mode>('SALARY');
  const [activeSource, setActiveSource] = useState<string>('salary');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Shared State
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');

  // ================= MODE 1 STATE =================
  const [amount, setAmount] = useState('');

  // Dropdown Selections
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null); // "Received From"
  const [selectedDepositAccount, setSelectedDepositAccount] = useState<Account | null>(null); // "Deposit To"
  const [selectedCategory, setSelectedCategory] = useState<any>(null); // "Category"
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null); // "Payment Method"

  const [attachment, setAttachment] = useState<string | null>(null);

  // ================= MODE 2 STATE =================
  const [grossAmount, setGrossAmount] = useState('');
  const [employer, setEmployer] = useState('');
  const [salaryIncomeAccount, setSalaryIncomeAccount] = useState<Account | null>(null);
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);

  // ================= MODAL VISIBILITY STATE =================
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showIncomeAccountModal, setShowIncomeAccountModal] = useState(false);
  const [showDeductionAccountModal, setShowDeductionAccountModal] = useState<{ visible: boolean, rowId: string | null }>({ visible: false, rowId: null });

  // Data State
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedAccounts, fetchedCats, fetchedMethods, fetchedCustomers] = await Promise.all([
        apiService.getAccounts({ includeBalances: true }),
        apiService.getCategories(),
        apiService.getPaymentMethods(),
        apiService.getCustomers({ active: true })
      ]);
      setAllAccounts(fetchedAccounts);
      setCategories(fetchedCats.filter((c: any) => c.type === 'income'));
      setPaymentMethods(fetchedMethods);
      setCustomers(fetchedCustomers);

      // Set defaults
      const defaultBank = fetchedAccounts.find(a => a.type === 'ASSET' && (a.name.includes('Check') || a.name.includes('Bank') || a.code === '1010'));
      if (defaultBank) setSelectedDepositAccount(defaultBank);

      const defaultMethod = fetchedMethods.find((m: any) => m.name === 'Cash') || fetchedMethods[0];
      if (defaultMethod) setSelectedPaymentMethod(defaultMethod);

      const defaultSalary = fetchedAccounts.find((a: any) => a.type === 'INCOME' && a.name.toLowerCase().includes('salary'))
        || fetchedAccounts.find((a: any) => a.type === 'INCOME');
      if (defaultSalary) setSalaryIncomeAccount(defaultSalary);

    } catch (error) {
      console.error('Failed to load data', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Account Lists
  const incomeAccounts = useMemo(() =>
    allAccounts.filter(a => a.type === 'INCOME'),
    [allAccounts]);

  const assetAccounts = useMemo(() =>
    allAccounts.filter(a => {
      // 1. Must be Asset
      if (a.type !== 'ASSET') return false;

      // 2. Strict SubType Check (Bank, Cash, Mobile Money, Wallet, Savings)
      const validSubTypes = ['bank', 'cash', 'mobile money', 'wallet', 'savings', 'current'];
      const subType = (a.subtype || '').toLowerCase();

      // Check subtype or flexible name matching if subtype is missing
      if (validSubTypes.some(t => subType.includes(t))) return true;

      // Fallback: Name matching for common keywords if subtype isn't explicit
      const name = a.name.toLowerCase();
      if (name.includes('bank') || name.includes('cash') || name.includes('m-pesa') || name.includes('wallet')) return true;

      // Fallback: Standard Code Range for Current Assets (1000-1199)
      const code = parseInt(a.code || '0');
      if (code >= 1000 && code < 1200) return true;

      return false;
    }),
    [allAccounts]);

  // PERFECT PAYSLIP ENGINE: Separate Statutory Deductions from Transfers
  const deductionHeadings = useMemo(() => {
    const statutory: Array<Account & { category: string }> = []; // Taxes & Mandatory Contributions (Expenses)
    const transfers: Array<Account & { category: string }> = [];  // Sacco, Loans (Assets/Liabilities)

    allAccounts.forEach(a => {
      const code = parseInt(a.code || '0');

      // STATUTORY DEDUCTIONS (These reduce Net Worth - Money is GONE)
      if (a.type === 'EXPENSE' && code >= 6600 && code < 6700) {
        statutory.push({ ...a, category: 'Statutory' });
      }

      // TRANSFERS (These maintain Net Worth - Money is MOVED)
      if (a.type === 'LIABILITY' && (a.name.includes('Loan') || a.name.includes('Sacco'))) {
        transfers.push({ ...a, category: 'Transfer' });
      }
      if (a.type === 'ASSET' && (a.name.includes('Saving') || a.name.includes('Sacco'))) {
        transfers.push({ ...a, category: 'Transfer' });
      }
    });

    // Sort each group by code, then combine with statutory first
    statutory.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    transfers.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    return [...statutory, ...transfers];
  }, [allAccounts]);

  // Calculations
  const totalDeductions = useMemo(() => {
    return deductions.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  }, [deductions]);

  const netSalary = useMemo(() => {
    const gross = parseFloat(grossAmount) || 0;
    return gross - totalDeductions;
  }, [grossAmount, totalDeductions]);

  // Image Picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAttachment(result.assets[0].uri);
    }
  };

  // Handlers
  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      if (mode === 'QUICK') {
        if (!amount || !selectedCategory || !selectedPaymentMethod || !selectedDepositAccount) {
          Alert.alert('Missing Fields', 'Please fill in Amount, Category, Deposit Account, and Payment Method');
          setSubmitting(false);
          return;
        }

        // Map Payment Method to Account if possible, or use Deposit Account
        await apiService.createTransaction({
          type: 'INCOME',
          amount: parseFloat(amount),
          category: selectedCategory.name,
          description: description || `Income from ${selectedCustomer?.name || 'Unknown'}`,
          paymentMethod: selectedPaymentMethod.name,
          date: date.toISOString(),
          notes: description,
          // IMPORTANT: In Quick Mode, money increases the CHOSEN Asset Account
          debitAccountId: parseInt(selectedDepositAccount.id), // Debit Asset (Increase)
          payee: selectedCustomer?.name
        });

      } else {
        // SALARY MODE
        if (!grossAmount || parseFloat(grossAmount) <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid Gross Amount');
          setSubmitting(false);
          return;
        }
        if (!salaryIncomeAccount) {
          Alert.alert('Missing Field', 'Please select the Income Account (e.g. Salary)');
          setSubmitting(false);
          return;
        }

        const gross = parseFloat(grossAmount);

        // Construct Splits
        // 1. Deductions
        const splitLines = deductions.map(d => ({
          accountId: d.accountId,
          category: d.name,
          amount: parseFloat(d.amount) || 0,
          description: d.name
        }));

        // 2. The Net Deposit goes to Bank
        if (netSalary > 0 && selectedDepositAccount) {
          splitLines.push({
            accountId: selectedDepositAccount.id,
            category: 'Net Salary Deposit',
            amount: netSalary,
            description: `Net Pay to ${selectedDepositAccount.name}`
          });
        }

        // Validate
        const totalSplit = splitLines.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(totalSplit - gross) > 1.0) {
          Alert.alert('Math Error', `Splits (${totalSplit}) do not equal Gross (${gross}). Check your numbers.`);
          setSubmitting(false);
          return;
        }

        await apiService.createTransaction({
          type: 'INCOME',
          amount: gross,
          category: 'Salary',
          description: description || `Salary: ${employer || 'Unknown'}`,
          date: date.toISOString(),
          creditAccountId: parseInt(salaryIncomeAccount.id), // Revenue Source
          splits: splitLines as any,
          payee: employer
        });
      }

      Alert.alert('Success', 'Income Recorded Successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      refreshAccounts();

    } catch (error: any) {
      Alert.alert('Error', error.error || error.message || 'Failed to record income');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleSourceSelect = (key: string) => {
    setActiveSource(key);
    if (key === 'salary') {
      setMode('SALARY');
      setGrossAmount(amount);
    } else {
      setMode('QUICK');
      const cat = categories.find((c: any) => c.name.toLowerCase().includes(key)) || categories[0];
      if (cat) setSelectedCategory(cat);
    }
  };

  // Renderers for Modals
  const renderAccountItem = (account: Account) => (
    <View style={styles.dropdownItem}>
      <View style={styles.dropdownIcon}>
        <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.dropdownTitle}>{account.name}</Text>
        <Text style={styles.dropdownSubtitle}>{account.code} • Bal: KES {account.balance?.toLocaleString() || '0'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </View>
  );

  const renderCustomerItem = (customer: any) => (
    <View style={styles.dropdownItem}>
      <View style={[styles.dropdownIcon, { backgroundColor: '#E0E7FF' }]}>
        <Ionicons name="person" size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.dropdownTitle}>{customer.name}</Text>
    </View>
  );

  const dateLabel = (() => {
    const t = new Date();
    if (date.toDateString() === t.toDateString()) return 'Today';
    const y = new Date(t); y.setDate(t.getDate() - 1);
    if (date.toDateString() === y.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  })();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── HEADER ── */}
      <LinearGradient colors={['#1a3a8f', '#0e2470']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFAA00" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add income</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── AMOUNT CARD ── */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={styles.amountKes}>KES</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(v) => { setAmount(v); if (activeSource === 'salary') setGrossAmount(v); }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#CBD5E1"
              />
            </View>
            <TouchableOpacity style={styles.datePill}>
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text style={styles.datePillText}>{dateLabel}</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* ── SOURCE ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Source</Text>
            <View style={styles.sourceGrid}>
              {INCOME_SOURCES.map((src) => {
                const active = activeSource === src.key;
                return (
                  <TouchableOpacity
                    key={src.key}
                    style={[styles.sourceCard, active && styles.sourceCardActive]}
                    onPress={() => handleSourceSelect(src.key)}
                  >
                    <View style={[styles.sourceIconWrap, active && styles.sourceIconWrapActive]}>
                      <Ionicons name={src.icon as any} size={28} color={active ? '#fff' : '#9CA3AF'} />
                    </View>
                    <Text style={[styles.sourceLabel, active && styles.sourceLabelActive]}>{src.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── DETAILS ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsRow}>
              <Ionicons name="document-text-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.detailsInput}
                placeholder="What was this from?"
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>

          {/* ── SUBMIT ── */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitTxt}>Save Income</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── FOOTER ── */}
          <View style={styles.footer}>
            <Text style={styles.footerTxt}>Powered by </Text>
            <Text style={styles.footerBrand}>Apbc 🌍</Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODALS */}
      <SelectorModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
        items={categories}
        onSelect={(cat) => setSelectedCategory(cat)}
      />
      <SelectorModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Deposit Account"
        items={assetAccounts}
        onSelect={(acc) => setSelectedDepositAccount(acc)}
        renderItem={renderAccountItem}
      />
      <SelectorModal
        visible={showIncomeAccountModal}
        onClose={() => setShowIncomeAccountModal(false)}
        title="Income Account"
        items={incomeAccounts}
        onSelect={(acc) => setSalaryIncomeAccount(acc)}
        renderItem={renderAccountItem}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFAA00' },
  scroll: { paddingBottom: 20 },
  amountCard: { marginHorizontal: 16, marginTop: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  amountLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountKes: { fontSize: 22, fontWeight: '600', color: '#9CA3AF' },
  amountInput: { fontSize: 42, fontWeight: '800', color: '#1F2937', minWidth: 120 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  datePillText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sourceCard: { width: '46%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1.5, borderColor: 'transparent' as any },
  sourceCardActive: { borderColor: '#1a3a8f', backgroundColor: '#EEF2FF' },
  sourceIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  sourceIconWrapActive: { backgroundColor: '#1a3a8f' },
  sourceLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8 },
  sourceLabelActive: { color: '#1a3a8f' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  detailsInput: { flex: 1, fontSize: 14, color: '#1F2937', paddingVertical: 14 },
  submitBtn: { backgroundColor: '#F97316', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  footerTxt: { fontSize: 12, color: '#9CA3AF' },
  footerBrand: { fontSize: 12, fontWeight: '700', color: '#1a3a8f' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' as any, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  closeBtn: {},
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  modalItemText: { fontSize: 15, color: '#1F2937', flex: 1 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dropdownIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  dropdownTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  dropdownSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  // legacy aliases kept for any remaining references
  toggleContainer: {} as any,
  toggleBtn: {} as any,
  toggleBtnActive: {} as any,
  toggleText: {} as any,
  toggleTextActive: {} as any,
  content: {} as any,
  formContainer: {} as any,
  card: {} as any,
  headerTop: {} as any,
}) as any;
const _: any = ({
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700'
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    padding: 4
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  toggleText: {
    color: '#bfdbfe',
    fontWeight: '600'
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  content: {
    padding: 20,
  },
  groupHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 10,
    marginTop: 5,
    letterSpacing: 0.5
  },
  autoFillBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  autoFillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  formContainer: {
    gap: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
    marginBottom: 8
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10
  },
  currency: {
    fontSize: 24,
    color: COLORS.textLight,
    fontWeight: '600',
    marginRight: 10
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1
  },

  // Custom Selector Styles
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  selectorText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500'
  },
  placeholderText: {
    color: '#9CA3AF'
  },
  balanceText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10
  },
  input: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16
  },

  // Attachment
  uploadBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB'
  },
  uploadText: {
    color: COLORS.textLight,
    marginTop: 8
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8
  },
  attachmentText: {
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8
  },

  // Chips
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary
  },
  chipText: {
    color: COLORS.textLight,
    fontWeight: '500'
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '600'
  },

  // Grid
  deductionSelector: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    marginRight: 10
  },
  deductionSelectorText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1
  },
  gridHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 8
  },
  gridHeadText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  gridInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    textAlign: 'right',
    fontSize: 14,
    color: COLORS.text
  },
  trashBtn: {
    padding: 8,
    marginLeft: 8
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
    marginTop: 10
  },
  addBtnText: {
    color: COLORS.secondary,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.danger
  },

  // Net Card
  netLabel: {
    color: '#bfdbfe',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  netAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800'
  },
  netSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    justifyContent: 'space-between'
  },
  netSelectorText: {
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 15
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '80%',
    paddingBottom: 40
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary
  },
  closeBtn: {
    padding: 5
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text
  },

  // Custom Modal Items
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  dropdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF', // Light Blue
    alignItems: 'center',
    justifyContent: 'center'
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  dropdownSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  submitBtn: {
    backgroundColor: COLORS.secondary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  }
});
