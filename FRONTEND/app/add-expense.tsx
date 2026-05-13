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
  Switch,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';


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
  const [saving, setSaving] = useState(false);
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
  const [splitMode, setSplitMode] = useState(false);


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
      setSaving(true);

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
      setSaving(false);
    }
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
    const matched = expenseAccounts.find((a: any) =>
      a.name.toLowerCase().includes(key) || key.includes(a.name.toLowerCase())
    );
    const cat = matched ?? { id: key, name: key.charAt(0).toUpperCase() + key.slice(1) };
    updateLineItem(0, 'categoryId', String(cat.id));
    updateLineItem(0, 'categoryName', cat.name);
  };

  const dateLabel = (() => {
    const today = new Date();
    if (paymentDate.toDateString() === today.toDateString()) return 'Today';
    const yday = new Date(today); yday.setDate(today.getDate() - 1);
    if (paymentDate.toDateString() === yday.toDateString()) return 'Yesterday';
    return paymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  })();

  if (pageLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#1a3a8f" />
      </View>
    );
  }

  const selectedAccountName = accounts.find((a: any) => String(a.id) === selectedAccountId)?.name || 'Select Account';

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1a3a8f', '#0e2470']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#FFAA00" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Add Expense</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Amount display */}
          <View style={s.amountCard}>
            <Text style={s.amountCardLabel}>TOTAL AMOUNT</Text>
            <View style={s.amountDisplay}>
              <Text style={s.amountCurrency}>KES</Text>
              <Text style={s.amountValue}>{parseFloat(totalAmount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
            </View>
            <TouchableOpacity style={s.datePill} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={14} color="#6B7280" />
              <Text style={s.datePillText}>{dateLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* Payee */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Who did you pay?</Text>
            <TouchableOpacity style={s.selector} onPress={() => setShowSupplierModal(true)}>
              <Ionicons name="people-outline" size={18} color="#1a3a8f" style={{ marginRight: 8 }} />
              <Text style={[s.selectorText, !payee && { color: '#9CA3AF' }]}>{payee || 'Select Supplier'}</Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <TextInput
              style={[s.input, { marginTop: 8 }]}
              placeholder="Or type payee name..."
              placeholderTextColor="#9CA3AF"
              value={payee}
              onChangeText={setPayee}
            />
          </View>

          {/* Quick categories */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Category</Text>
              <TouchableOpacity onPress={() => { setActiveLineIndex(0); setShowCategoryModal(true); }}>
                <Text style={s.link}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={s.catGrid}>
              {QUICK_CATS.map((qc) => {
                const active = lineItems[0].categoryName?.toLowerCase().includes(qc.key);
                return (
                  <TouchableOpacity key={qc.key}
                    style={[s.catCard, active && s.catCardActive]}
                    onPress={() => selectQuickCat(qc.key)}>
                    <Text style={s.catEmoji}>{qc.emoji}</Text>
                    <Text style={[s.catLabel, active && s.catLabelActive]}>{qc.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={s.catCard} onPress={() => { setActiveLineIndex(0); setShowCategoryModal(true); }}>
                <Ionicons name="add" size={22} color="#6B7280" />
                <Text style={s.catLabel}>More</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account + Payment method */}
          <View style={s.section}>
            <View style={s.row}>
              <View style={[s.field, { flex: 1, marginRight: 10 }]}>
                <Text style={s.label}>Account</Text>
                <TouchableOpacity style={s.selector} onPress={() => setShowAccountModal(true)}>
                  <Text style={s.selectorText} numberOfLines={1}>{selectedAccountName}</Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <Text style={s.balText}>Bal: <Text style={{ color: '#22C55E', fontWeight: '700' }}>KES {accountBalance.toLocaleString()}</Text></Text>
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Method</Text>
                <TouchableOpacity style={s.selector} onPress={() => setShowPaymentMethodModal(true)}>
                  <Text style={s.selectorText}>{paymentMethod}</Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Line items */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Line Items</Text>
            {lineItems.map((item, index) => (
              <View key={item.id} style={s.itemCard}>
                <View style={s.itemHeader}>
                  <Text style={s.itemIndex}>#{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeLine(index)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={s.selector} onPress={() => { setActiveLineIndex(index); setShowCategoryModal(true); }}>
                  <Text style={s.selectorText}>{item.categoryName}</Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <View style={[s.row, { marginTop: 8, gap: 8 }]}>
                  <TextInput
                    style={[s.input, { flex: 2 }]}
                    placeholder="Description"
                    placeholderTextColor="#9CA3AF"
                    value={item.description}
                    onChangeText={(v) => updateLineItem(index, 'description', v)}
                  />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={item.amount}
                    onChangeText={(v) => updateLineItem(index, 'amount', v)}
                  />
                </View>
                <TouchableOpacity style={s.vatPill} onPress={() => { setActiveLineIndex(index); setShowVatModal(true); }}>
                  <Text style={s.vatPillText}>Tax: {item.vatRate}%</Text>
                  <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addLineBtn} onPress={addLine}>
              <Ionicons name="add-circle" size={22} color="#1a3a8f" />
              <Text style={s.addLineTxt}>Add another item</Text>
            </TouchableOpacity>
          </View>

          {/* Ref + Tax treatment */}
          <View style={s.section}>
            <View style={s.row}>
              <View style={[s.field, { flex: 1, marginRight: 10 }]}>
                <Text style={s.label}>Ref No.</Text>
                <TextInput style={s.input} placeholder="Reference #" value={refNo} onChangeText={setRefNo} />
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Amounts are</Text>
                <TouchableOpacity style={s.selector} onPress={() => setShowTaxTreatmentModal(true)}>
                  <Text style={s.selectorText} numberOfLines={1}>{taxTreatment}</Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Split with family */}
          <View style={s.section}>
            <View style={s.splitRow}>
              <View style={s.splitLeft}>
                <View style={s.splitIcon}>
                  <Ionicons name="people" size={18} color="#1a3a8f" />
                </View>
                <View>
                  <Text style={s.splitTitle}>Split with Family?</Text>
                  <Text style={s.splitSub}>Instantly divide with your household</Text>
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

          {/* Submit */}
          <View style={s.section}>
            <TouchableOpacity
              style={[s.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={s.submitTxt}>Save Expense</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <SelectionModal
        visible={showAccountModal} title="Payment Account"
        options={accounts.map((a: any) => ({ label: a.name, value: String(a.id), balance: a.balance }))}
        onSelect={(val: string) => {
          setSelectedAccountId(val);
          const acc = accounts.find((a: any) => String(a.id) === val);
          setAccountBalance(acc?.balance || 0);
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
      />
      <SelectionModal
        visible={showCategoryModal} title="Select Expense Category"
        options={expenseAccounts.map((a: any) => ({ label: `${a.code ? a.code + ' - ' : ''}${a.name}`, value: String(a.id) }))}
        onSelect={(val: string) => {
          const acc = expenseAccounts.find((a: any) => String(a.id) === val);
          updateLineItem(activeLineIndex, 'categoryId', val);
          updateLineItem(activeLineIndex, 'categoryName', acc?.name || val);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />
      <SelectionModal
        visible={showSupplierModal} title="Select Supplier"
        options={suppliers.map((s: any) => ({ label: s.name, value: String(s.id) }))}
        onSelect={(val: string) => {
          const sup = suppliers.find((s: any) => String(s.id) === val);
          setSelectedSupplierId(val);
          setPayee(sup?.name || '');
          if (sup?.lastExpenseAmount) {
            const items = [...lineItems];
            items[0].amount = String(sup.lastExpenseAmount);
            if (sup.lastExpenseAccountId) {
              items[0].categoryId = String(sup.lastExpenseAccountId);
              items[0].categoryName = sup.lastExpenseCategory || '';
            }
            setLineItems(items);
          }
          setShowSupplierModal(false);
        }}
        onClose={() => setShowSupplierModal(false)}
      />
      <SelectionModal
        visible={showPaymentMethodModal} title="Payment Method"
        options={['Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card', 'Cheque'].map(m => ({ label: m, value: m }))}
        onSelect={(val: string) => { setPaymentMethod(val); setShowPaymentMethodModal(false); }}
        onClose={() => setShowPaymentMethodModal(false)}
      />
      <SelectionModal
        visible={showTaxTreatmentModal} title="Amounts are"
        options={[
          { label: 'Exclusive of Tax', value: 'Exclusive of Tax' },
          { label: 'Inclusive of Tax', value: 'Inclusive of Tax' },
          { label: 'Out of Scope of Tax', value: 'Out of Scope of Tax' },
        ]}
        onSelect={(val: any) => { setTaxTreatment(val); setShowTaxTreatmentModal(false); }}
        onClose={() => setShowTaxTreatmentModal(false)}
      />
      <SelectionModal
        visible={showVatModal} title="Select Tax Rate"
        options={vatRates.map((v: any) => ({ label: `${v.name} (${v.rate}%)`, value: String(v.id), rate: v.rate }))}
        onSelect={(val: string) => {
          const v = vatRates.find((r: any) => String(r.id) === val);
          updateLineItem(activeLineIndex, 'vatRateId', val);
          updateLineItem(activeLineIndex, 'vatRate', v?.rate || 0);
          setShowVatModal(false);
        }}
        onClose={() => setShowVatModal(false)}
      />

      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.dateCard}>
            <Text style={s.modalTitle}>Set Date</Text>
            <View style={s.dateRow}>
              <TextInput style={s.dateInput} defaultValue={paymentDate.getDate().toString()} keyboardType="numeric"
                onChangeText={(v) => { const d = new Date(paymentDate); d.setDate(parseInt(v) || 1); setPaymentDate(d); }} />
              <TextInput style={s.dateInput} defaultValue={(paymentDate.getMonth() + 1).toString()} keyboardType="numeric"
                onChangeText={(v) => { const d = new Date(paymentDate); d.setMonth((parseInt(v) || 1) - 1); setPaymentDate(d); }} />
              <TextInput style={[s.dateInput, { width: 80 }]} defaultValue={paymentDate.getFullYear().toString()} keyboardType="numeric"
                onChangeText={(v) => { const d = new Date(paymentDate); d.setFullYear(parseInt(v) || 2026); setPaymentDate(d); }} />
            </View>
            <TouchableOpacity style={s.confirmBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={s.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SelectionModal({ visible, title, options, onSelect, onClose }: {
  visible: boolean; title: string;
  options: { label: string; value: string; balance?: number; rate?: number }[];
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <ScrollView style={s.modalScroll}>
            {options.map((opt) => (
              <TouchableOpacity key={opt.value} style={s.modalItem} onPress={() => onSelect(opt.value)}>
                <Text style={[s.modalItemText, { flex: 1 }]}>{opt.label}</Text>
                {opt.balance != null && <Text style={s.modalItemSub}>KES {opt.balance.toLocaleString()}</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingBottom: 16, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFAA00' },
  scroll: { paddingBottom: 20 },
  amountCard: { marginHorizontal: 16, marginTop: 12, marginBottom: 8, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  amountCardLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 8 },
  amountDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  amountCurrency: { fontSize: 22, fontWeight: '600', color: '#9CA3AF' },
  amountValue: { fontSize: 38, fontWeight: '800', color: '#1F2937' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  datePillText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  link: { fontSize: 13, fontWeight: '600', color: '#1a3a8f' },
  selector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: '#E5E7EB' },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1F2937' },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#1F2937', borderWidth: 1.5, borderColor: '#E5E7EB' },
  balText: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  field: {},
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: '30%', aspectRatio: 1, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1.5, borderColor: 'transparent' },
  catCardActive: { borderColor: '#1a3a8f', backgroundColor: '#EEF2FF' },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  catLabelActive: { color: '#1a3a8f' },
  itemCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemIndex: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  vatPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#E5E7EB' },
  vatPillText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  addLineBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, justifyContent: 'center' },
  addLineTxt: { fontSize: 14, fontWeight: '600', color: '#1a3a8f' },
  splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#E5E7EB' },
  splitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  splitIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  splitTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  splitSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1a3a8f', borderRadius: 16, paddingVertical: 16 },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' as any },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  modalScroll: { paddingHorizontal: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB', gap: 10 },
  modalItemText: { fontSize: 15, color: '#1F2937' },
  modalItemSub: { fontSize: 12, color: '#6B7280' },
  dateCard: { margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  dateRow: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  dateInput: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, textAlign: 'center', fontSize: 16 },
  confirmBtn: { backgroundColor: '#1a3a8f', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
