import React, { useState, useEffect } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

// Premium Design System
const COLORS = {
  primary: '#122f8a',      // Deep Blue
  secondary: '#fe9900',    // Brand Orange
  success: '#10b981',
  danger: '#ef4444',
  text: '#1e293b',
  textLight: '#64748b',
  bg: '#f1f5f9',
  white: '#ffffff',
  border: '#e2e8f0',
  cardBg: '#ffffff',
};

type TaxTreatment = 'Exclusive of Tax' | 'Inclusive of Tax' | 'Out of Scope of Tax';

interface LineItem {
  id: string;
  categoryId: string | null;
  categoryName: string;
  description: string;
  amount: string;
  vatRateId: string | null;
  vatRate: number;
}

export default function ExpenseScreen() {
  const router = useRouter();

  // --- CORE STATE ---
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [payee, setPayee] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [refNo, setRefNo] = useState('');
  const [taxTreatment, setTaxTreatment] = useState<TaxTreatment>('Exclusive of Tax');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);


  // --- DATA ---
  const [accounts, setAccounts] = useState<any[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [vatRates, setVatRates] = useState<any[]>([]);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', categoryId: null, categoryName: 'Select Category', description: '', amount: '', vatRateId: null, vatRate: 0 }
  ]);

  // --- MODALS ---
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showTaxTreatmentModal, setShowTaxTreatmentModal] = useState(false);
  const [showVatModal, setShowVatModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [activeLineIndex, setActiveLineIndex] = useState(0);

  // --- LOAD DATA ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setPageLoading(true);
      const [accs, expAccs, sups, vats] = await Promise.all([
        apiService.getPaymentEligibleAccounts(),
        apiService.getAccounts({ type: 'EXPENSE' }),
        apiService.getVendors({ active: true }),
        apiService.getVatRates()
      ]);

      setAccounts(accs);
      setExpenseAccounts(expAccs);
      setSuppliers(sups);
      setVatRates(vats);

      // Default Account (Cash or M-Pesa)
      const defaultAcc = accs.find((a: any) => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('mpesa')) || accs[0];
      if (defaultAcc) {
        setSelectedAccountId(String(defaultAcc.id));
        setAccountBalance(defaultAcc.balance || 0);
      }
    } catch (error) {
      console.error('Failed to load data', error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setPageLoading(false);
    }
  };


  // --- CALCULATION LOGIC ---
  useEffect(() => {
    const sum = lineItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

    // Calculate VAT if exclusive
    let vatSum = 0;
    if (taxTreatment === 'Exclusive of Tax') {
      lineItems.forEach(item => {
        const amt = parseFloat(item.amount) || 0;
        const rate = (item.vatRate || 0) / 100;
        vatSum += amt * rate;
      });
    }

    setTotalAmount((sum + vatSum).toFixed(2));
  }, [lineItems, taxTreatment]);

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const addLine = () => {
    setLineItems([...lineItems, {
      id: Date.now().toString(),
      categoryId: null,
      categoryName: 'Select Category',
      description: '',
      amount: '',
      vatRateId: null,
      vatRate: 0
    }]);
  };

  const removeLine = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (!payee || !selectedAccountId || parseFloat(totalAmount) <= 0) {
      Alert.alert('Missing Fields', 'Please fill in Payee, Account and at least one item.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        type: 'EXPENSE',
        amount: parseFloat(totalAmount),
        category: lineItems[0].categoryName || 'General Expense',
        description: lineItems[0].description || `Expense to ${payee}`,
        payee: payee,
        vendorId: selectedSupplierId ? parseInt(selectedSupplierId) : null,
        paymentMethod: paymentMethod,
        date: paymentDate.toISOString(),
        notes: refNo,
        creditAccountId: parseInt(selectedAccountId),
        splits: lineItems.map(item => ({
          category: item.categoryName,
          description: item.description || item.categoryName,
          amount: parseFloat(item.amount) || 0,
          vatRate: item.vatRate,
          accountId: item.categoryId
        })),
        taxTreatment: taxTreatment
      };

      await apiService.createTransaction(payload as any);

      Alert.alert('Success', 'Expense recorded successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };


  const resetForm = () => {
    setPayee('');
    setCategory(null);
    setDescription('');
    setAmount('');
    setMember(null);
    setPhoneNumber('');
    setMeterNumber('');
    setReference('');
    setReceipt(null);
    setTaxAmount('');
    setSplitMode(false);
    setSplitLines([{ id: 1, category: null, description: '', amount: '', member: null }]);
  };

  // ── Figma quick-category tiles ──────────────────────────────────────────────
  const QUICK_CATS = [
    { label: 'Food',      emoji: '🍎', key: 'food' },
    { label: 'Transport', emoji: '🚗', key: 'transport' },
    { label: 'Bills',     emoji: '📄', key: 'bills' },
    { label: 'Shopping',  emoji: '🛍️', key: 'shopping' },
    { label: 'Fun',       emoji: '🎮', key: 'fun' },
  ];

  const selectQuickCat = (key: string) => {
    const matched = categories.find(c =>
      c.name.toLowerCase().includes(key) || key.includes(c.name.toLowerCase())
    );
    setCategory(matched ?? { id: key, name: key.charAt(0).toUpperCase() + key.slice(1), type: 'expense' });
  };

  const dateLabel = (() => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yday = new Date(today); yday.setDate(today.getDate() - 1);
    if (date.toDateString() === yday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  })();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a3a8f" />

  // --- UI COMPONENTS ---
  if (pageLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />

      </View>
    );
  }

  const selectedAccountName = accounts.find(a => String(a.id) === selectedAccountId)?.name || 'Select Account';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />


      {/* ── HEADER ── */}
      <LinearGradient colors={['#1a3a8f', '#0e2470']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFAA00" />

      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#0a1a5c']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Expense</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Who did you pay? (Payee/Supplier)</Text>
            <TouchableOpacity style={styles.selector} onPress={() => setShowSupplierModal(true)}>
              <Text style={styles.selectorText}>{payee || 'Select Supplier'}</Text>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />

            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={{ width: 38 }} />
          </View>


      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── AMOUNT CARD ── */}
          <View style={styles.amountCard}>
            <Text style={styles.amountCardLabel}>AMOUNT</Text>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountCurrency}>KES</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#CBD5E1"
              />
            </View>
            <TouchableOpacity style={styles.datePill}>
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text style={styles.datePillText}>{dateLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* ── CATEGORY ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.catGrid}>
              {QUICK_CATS.map((qc) => {
                const active = category?.name?.toLowerCase().includes(qc.key);
                return (
                  <TouchableOpacity
                    key={qc.key}
                    style={[styles.catCard, active && styles.catCardActive]}
                    onPress={() => selectQuickCat(qc.key)}
                  >
                    <Text style={styles.catEmoji}>{qc.emoji}</Text>
                    <Text style={[styles.catLabel, active && styles.catLabelActive]}>{qc.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[
                  styles.catCard,
                  (category && !QUICK_CATS.some(q => category?.name?.toLowerCase().includes(q.key))) && styles.catCardActive,
                ]}
                onPress={() => setShowCategoryModal(true)}
              >
                <Ionicons name="add" size={22} color="#6B7280" />
                <Text style={styles.catLabel}>More</Text>


          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Payment Account</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setShowAccountModal(true)}>
                <Text style={styles.selectorText} numberOfLines={1}>{selectedAccountName}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
              <Text style={styles.balanceText}>Balance: <Text style={{ fontWeight: '700', color: COLORS.success }}>KES {accountBalance.toLocaleString()}</Text></Text>
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Total Amount</Text>
              <View style={styles.amountBox}>
                <Text style={styles.currencyPrefix}>KES</Text>
                <Text style={styles.totalAmountText}>{parseFloat(totalAmount).toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Payment Date</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.selectorText}>{paymentDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Payment Method</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setShowPaymentMethodModal(true)}>
                <Text style={styles.selectorText}>{paymentMethod}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />

              </TouchableOpacity>
            </View>
          </View>


          {/* ── DETAILS ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsRow}>
              <TextInput
                style={styles.detailsInput}
                placeholder="What was this for?"
                placeholderTextColor="#9CA3AF"
                value={description || payee}
                onChangeText={(t) => { setDescription(t); setPayee(t); }}
              />
              <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                {receipt ? (
                  <Image source={{ uri: receipt }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                ) : (
                  <Ionicons name="camera" size={22} color="#fff" />
                )}

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Ref No.</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Reference #"
                value={refNo}
                onChangeText={setRefNo}
              />
            </View>

            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Amounts are</Text>
              <TouchableOpacity style={styles.selector} onPress={() => setShowTaxTreatmentModal(true)}>
                <Text style={styles.selectorText} numberOfLines={1}>{taxTreatment}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />

              </TouchableOpacity>
            </View>
          </View>
        </View>


          {/* ── SPLIT WITH FAMILY ── */}
          <View style={styles.section}>
            <View style={styles.splitFamilyRow}>
              <View style={styles.splitLeft}>
                <View style={styles.splitIcon}>
                  <Ionicons name="people" size={18} color="#1a3a8f" />
                </View>
                <View>
                  <Text style={styles.splitFamilyTitle}>Split with Family?</Text>
                  <Text style={styles.splitFamilySub}>Instantly divide with your household</Text>
                </View>
              </View>
              <Switch
                value={splitMode}
                onValueChange={setSplitMode}
                trackColor={{ false: '#E5E7EB', true: '#1a3a8f' }}
                thumbColor={splitMode ? '#F97316' : '#f3f4f6'}
              />
            </View>
          </View>

          {/* ── SUBMIT ── */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitTxt}>Add Expense</Text>
                </>
              )}
            </TouchableOpacity>

        {/* Line Items Section */}
        <Text style={styles.sectionTitle}>Line Items</Text>
        {lineItems.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndex}>#{index + 1}</Text>
              <TouchableOpacity onPress={() => removeLine(index)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {
                  setActiveLineIndex(index);
                  setShowCategoryModal(true);
                }}
              >
                <Text style={styles.selectorText}>{item.categoryName}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What was this for?"
                value={item.description}
                onChangeText={(v) => updateLineItem(index, 'description', v)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 2, marginRight: 10 }]}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={item.amount}
                  onChangeText={(v) => updateLineItem(index, 'amount', v)}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Tax Rate</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => {
                    setActiveLineIndex(index);
                    setShowVatModal(true);
                  }}
                >
                  <Text style={styles.selectorTextSmall}>{item.vatRate}%</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        ))}


          {/* ── FOOTER ── */}
          <View style={styles.footer}>
            <Text style={styles.footerTxt}>Powered by </Text>
            <Text style={styles.footerBrand}>Apbc 🌍</Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>


      {/* ── ACCOUNT MODAL ── */}
      <Modal visible={showAccountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.modalItem, account?.id === acc.id && styles.modalItemActive]}
                  onPress={() => { setAccount(acc); setShowAccountModal(false); }}
                >
                  <Ionicons name="wallet" size={22} color="#1a3a8f" />
                  <Text style={[styles.modalItemText, { flex: 1 }]}>{acc.name}</Text>
                  {account?.id === acc.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── CATEGORY MODAL ── */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Category</Text>
              <TouchableOpacity onPress={() => { setShowCategoryModal(false); setActiveSplitLine(null); }}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.modalItem, category?.id === cat.id && styles.modalItemActive]}
                  onPress={() => {
                    if (activeSplitLine !== null) {
                      updateSplitLine(activeSplitLine, 'category', cat);
                      setActiveSplitLine(null);
                    } else {
                      setCategory(cat);
                    }
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.catEmojiSm}>{cat.icon || '💰'}</Text>
                  <Text style={styles.modalItemText}>{cat.name}</Text>
                  {category?.id === cat.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

        <TouchableOpacity style={styles.addLineBtn} onPress={addLine}>
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          <Text style={styles.addLineText}>Add another item</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Save Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Expense</Text>}
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      <SelectionModal
        visible={showAccountModal}
        title="Payment Account"
        options={accounts.map(a => ({ label: a.name, value: String(a.id), balance: a.balance }))}
        onSelect={(val: string) => {
          setSelectedAccountId(val);
          const acc = accounts.find(a => String(a.id) === val);
          setAccountBalance(acc?.balance || 0);
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
      />

      <SelectionModal
        visible={showCategoryModal}
        title="Select Expense Account"
        options={expenseAccounts.map(a => ({ label: `${a.code ? a.code + ' - ' : ''}${a.name}`, value: String(a.id), name: a.name }))}
        onSelect={(val: string) => {
          const acc = expenseAccounts.find(a => String(a.id) === val);
          updateLineItem(activeLineIndex, 'categoryId', val);
          updateLineItem(activeLineIndex, 'categoryName', acc.name);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />

      <SelectionModal
        visible={showSupplierModal}
        title="Select Supplier"
        options={suppliers.map(s => ({
          label: s.name,
          value: String(s.id),
          balance: s.balance,
          lastAmount: s.lastExpenseAmount,
          lastCategory: s.lastExpenseCategory,
          lastAccountId: s.lastExpenseAccountId
        }))}
        onSelect={(val: string) => {
          const sup = suppliers.find(s => String(s.id) === val);
          setSelectedSupplierId(val);
          setPayee(sup.name);

          // Autofill Amount and Category from last expense
          if (sup.lastExpenseAmount || sup.lastExpenseCategory) {
            const newItems = [...lineItems];
            if (sup.lastExpenseAmount) {
              newItems[0].amount = String(sup.lastExpenseAmount);
            }
            if (sup.lastExpenseCategory && sup.lastExpenseAccountId) {
              newItems[0].categoryId = String(sup.lastExpenseAccountId);
              newItems[0].categoryName = sup.lastExpenseCategory;
            }
            setLineItems(newItems);
          } else if (sup.balance > 0) {
            // Fallback to balance if no last expense
            const newItems = [...lineItems];
            newItems[0].amount = String(sup.balance);
            setLineItems(newItems);
          }

          setShowSupplierModal(false);
        }}
        onClose={() => setShowSupplierModal(false)}
      />


      <SelectionModal
        visible={showPaymentMethodModal}
        title="Payment Method"
        options={['Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card', 'Cheque'].map(m => ({ label: m, value: m }))}
        onSelect={(val: string) => {
          setPaymentMethod(val);
          setShowPaymentMethodModal(false);
        }}
        onClose={() => setShowPaymentMethodModal(false)}
      />

      <SelectionModal
        visible={showTaxTreatmentModal}
        title="Amounts are"
        options={[
          { label: 'Exclusive of Tax', value: 'Exclusive of Tax' },
          { label: 'Inclusive of Tax', value: 'Inclusive of Tax' },
          { label: 'Out of Scope of Tax', value: 'Out of Scope of Tax' },
        ]}
        onSelect={(val: any) => {
          setTaxTreatment(val);
          setShowTaxTreatmentModal(false);
        }}
        onClose={() => setShowTaxTreatmentModal(false)}
      />

      <SelectionModal
        visible={showVatModal}
        title="Select Tax Rate"
        options={vatRates.map(v => ({ label: `${v.name} (${v.rate}%)`, value: String(v.id), rate: v.rate }))}
        onSelect={(val: string) => {
          const v = vatRates.find(rate => String(rate.id) === val);
          updateLineItem(activeLineIndex, 'vatRateId', val);
          updateLineItem(activeLineIndex, 'vatRate', v.rate);
          setShowVatModal(false);
        }}
        onClose={() => setShowVatModal(false)}
      />

      {/* Simple Date Picker (Fallback) */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerCard}>
            <Text style={styles.modalTitle}>Set Date</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                defaultValue={paymentDate.getDate().toString()}
                keyboardType="numeric"
                onChangeText={(v) => {
                  const d = new Date(paymentDate);
                  d.setDate(parseInt(v) || 1);
                  setPaymentDate(d);
                }}
              />
              <TextInput
                style={styles.dateInput}
                defaultValue={(paymentDate.getMonth() + 1).toString()}
                keyboardType="numeric"
                onChangeText={(v) => {
                  const d = new Date(paymentDate);
                  d.setMonth((parseInt(v) || 1) - 1);
                  setPaymentDate(d);
                }}
              />
              <TextInput
                style={[styles.dateInput, { width: 80 }]}
                defaultValue={paymentDate.getFullYear().toString()}
                keyboardType="numeric"
                onChangeText={(v) => {
                  const d = new Date(paymentDate);
                  d.setFullYear(parseInt(v) || 2026);
                  setPaymentDate(d);
                }}
              />
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  header: { paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFAA00' },
  scroll: { paddingBottom: 20 },
  amountCard: { marginHorizontal: 16, marginTop: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  amountCardLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
  amountDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountCurrency: { fontSize: 22, fontWeight: '600', color: '#9CA3AF' },
  amountInput: { fontSize: 42, fontWeight: '800', color: '#1F2937', minWidth: 120 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  datePillText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#1a3a8f' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: '30%', aspectRatio: 1, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1.5, borderColor: 'transparent' },
  catCardActive: { borderColor: '#1a3a8f', backgroundColor: '#EEF2FF' },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  catLabelActive: { color: '#1a3a8f' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  detailsInput: { flex: 1, fontSize: 14, color: '#1F2937', paddingVertical: 14 },
  cameraBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  splitFamilyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  splitLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  splitIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  splitFamilyTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  splitFamilySub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  submitBtn: { backgroundColor: '#F97316', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  footerTxt: { fontSize: 12, color: '#9CA3AF' },
  footerBrand: { fontSize: 12, fontWeight: '700', color: '#1a3a8f' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%' as any, paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  modalScroll: { paddingHorizontal: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  modalItemActive: { backgroundColor: '#F0FDF4' },
  modalItemText: { fontSize: 15, color: '#1F2937', flex: 1 },
  catEmojiSm: { fontSize: 20 },

    </SafeAreaView>
  );
}

const SelectionModal = ({ visible, title, options, onSelect, onClose }: any) => (
  <Modal visible={visible} transparent animationType="slide">
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 400 }}>
          {options.map((opt: any) => (
            <TouchableOpacity key={opt.value} style={styles.modalItem} onPress={() => onSelect(opt.value)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalItemText}>{opt.label}</Text>
                {opt.balance !== undefined && <Text style={styles.modalItemSubtext}>Bal: KES {opt.balance.toLocaleString()}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  backBtn: { padding: 4 },

  scrollView: { flex: 1, padding: 16 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },

  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 15, color: COLORS.text },

  row: { flexDirection: 'row' },
  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12 },
  selectorText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },
  selectorTextSmall: { fontSize: 14, color: COLORS.text },

  balanceText: { fontSize: 12, color: COLORS.textLight, marginTop: 4, marginLeft: 2 },
  amountBox: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  currencyPrefix: { fontSize: 11, color: COLORS.primary, fontWeight: '800' },
  totalAmountText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12, marginLeft: 4 },

  itemCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.secondary, shadowColor: '#000', shadowOpacity: 0.02, elevation: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemIndex: { fontSize: 12, fontWeight: '800', color: COLORS.secondary },

  addLineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, marginTop: 10 },
  addLineText: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: COLORS.primary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 30, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  modalItemText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  modalItemSubtext: { fontSize: 12, color: COLORS.success, marginTop: 2 },

  datePickerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '80%', alignSelf: 'center', marginBottom: '50%' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  dateInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 10, width: 50, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  confirmBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '800' }

});
