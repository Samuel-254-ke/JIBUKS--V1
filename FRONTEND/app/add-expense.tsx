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
  Image,
  StatusBar,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import apiService from '@/services/api';

// Brand Colors
const COLORS = {
  primary: '#122f8a',
  secondary: '#fe9900',
  white: '#ffffff',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  error: '#ef4444',
  blue50: '#eff6ff',
  orange50: '#fff7ed',
};

interface Category {
  id: string | number;
  name: string;
  icon?: string;
  color?: string;
  type: string;
}

interface Account {
  id: string | number;
  name: string;
  code: string;
  type: string;
  balance?: number;
}

interface Member {
  id: string | number;
  name: string;
}

interface SplitLine {
  id: number;
  category: Category | null;
  description: string;
  amount: string;
  member: Member | null;
}

// Smart Category Mappings
const VENDOR_CATEGORY_MAP: { [key: string]: string } = {
  'Safaricom': 'Airtime/Data',
  'Airtel': 'Airtime/Data',
  'Telkom': 'Airtime/Data',
  'Shell': 'Fuel',
  'Total': 'Fuel',
  'Rubis': 'Fuel',
  'KPLC': 'Electricity',
  'Kenya Power': 'Electricity',
  'Nairobi Water': 'Water',
};

export default function SpendMoneyScreen() {
  const router = useRouter();

  // Zone 1: Money Source
  const [account, setAccount] = useState<Account | null>(null);
  const [date] = useState(new Date());
  const [reference, setReference] = useState('');

  // Zone 2: Quick Entry
  const [payee, setPayee] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [meterNumber, setMeterNumber] = useState('');

  // Payment Method (for Cheque support)
  const [paymentMethod, setPaymentMethod] = useState('Cash/M-PESA');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date());
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showChequeDateModal, setShowChequeDateModal] = useState(false);


  // Zone 3: Split Mode
  const [splitMode, setSplitMode] = useState(false);
  const [splitLines, setSplitLines] = useState<SplitLine[]>([
    { id: 1, category: null, description: '', amount: '', member: null }
  ]);

  // Zone 4: Attachments
  const [receipt, setReceipt] = useState<string | null>(null);
  const [showTax, setShowTax] = useState(false);
  const [taxAmount, setTaxAmount] = useState('');

  // Database Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeSplitLine, setActiveSplitLine] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, accs, dashboard, vendorList] = await Promise.all([
        apiService.getCategories(),
        apiService.getPaymentEligibleAccounts(),
        apiService.getDashboard(),
        apiService.getVendors({ active: true }).catch(() => [])
      ]);

      const expenseCats = cats.filter((c: any) => c.type?.toLowerCase() === 'expense');
      setCategories(expenseCats);
      setAccounts(accs);

      if (dashboard?.familyMembers) {
        setMembers(dashboard.familyMembers);
      }

      // Auto-select M-PESA or first cash account
      const mpesa = accs.find((a: any) => a.name?.toLowerCase().includes('mpesa') || a.name?.toLowerCase().includes('m-pesa'));
      const cash = accs.find((a: any) => a.code === '1000' || a.name?.toLowerCase().includes('cash'));
      setAccount(mpesa || cash || accs[0]);

      // Load vendors from backend
      if (vendorList && vendorList.length > 0) {
        // Unique names just in case
        const names = Array.from(new Set(vendorList.map((v: any) => v.name)));
        setVendors(names as string[]);
      } else {
        setVendors(['Safaricom', 'Airtel', 'Shell', 'Total', 'Rubis', 'KPLC', 'Kenya Power', 'Naivas', 'Carrefour']);
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Smart Auto-Fill when Payee changes
  const handlePayeeChange = (text: string) => {
    setPayee(text);

    // Auto-fill category based on vendor
    const matchedCategory = VENDOR_CATEGORY_MAP[text];
    if (matchedCategory) {
      const cat = categories.find(c => c.name.toLowerCase().includes(matchedCategory.toLowerCase()));
      if (cat) {
        setCategory(cat);

        // Auto-fill description
        if (matchedCategory === 'Airtime/Data') {
          setDescription('Prepaid bundle');
        } else if (matchedCategory === 'Fuel') {
          setDescription('Fuel purchase');
        } else if (matchedCategory === 'Electricity') {
          setDescription('Electricity tokens');
        }
      }
    }
  };

  // Dynamic reference label based on account
  const getReferenceLabel = () => {
    if (account?.name?.toLowerCase().includes('mpesa') || account?.name?.toLowerCase().includes('m-pesa')) {
      return 'M-PESA Code *';
    }
    return 'Reference / Receipt #';
  };

  // Show special fields based on category
  const shouldShowPhoneNumber = () => {
    return category?.name?.toLowerCase().includes('airtime') ||
      category?.name?.toLowerCase().includes('data');
  };

  const shouldShowMeterNumber = () => {
    return category?.name?.toLowerCase().includes('electricity') ||
      category?.name?.toLowerCase().includes('power');
  };

  const addSplitLine = () => {
    setSplitLines([...splitLines, {
      id: Date.now(),
      category: null,
      description: '',
      amount: '',
      member: null
    }]);
  };

  const removeSplitLine = (id: number) => {
    if (splitLines.length > 1) {
      setSplitLines(splitLines.filter(l => l.id !== id));
    }
  };

  const updateSplitLine = (id: number, field: keyof SplitLine, value: any) => {
    setSplitLines(splitLines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const getSplitTotal = () => {
    return splitLines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0].uri);
    }
  };

  const save = async () => {
    // Validation
    if (!account) {
      Alert.alert('Required', 'Select payment account');
      return;
    }

    if (!splitMode) {
      // Simple mode validation
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Invalid Amount', 'Enter expense amount');
        return;
      }
      if (!category) {
        Alert.alert('Required', 'Select category');
        return;
      }
      if (!payee.trim()) {
        Alert.alert('Required', 'Enter payee name');
        return;
      }
      if (account.name?.toLowerCase().includes('mpesa') && !reference.trim()) {
        Alert.alert('Required', 'Enter M-PESA code');
        return;
      }
      // Cheque validation
      if (paymentMethod === 'Cheque' && !chequeNumber.trim()) {
        Alert.alert('Required', 'Enter cheque number');
        return;
      }
    } else {
      // Split mode validation
      const invalidLine = splitLines.find(l => !l.category || !l.amount || parseFloat(l.amount) <= 0);
      if (invalidLine) {
        Alert.alert('Invalid Split', 'All lines must have category and amount');
        return;
      }
    }

    try {
      setSaving(true);

      // If Payment Method is Cheque, Create Cheque Record First
      if (paymentMethod === 'Cheque') {
        const currentUser = await apiService.getCurrentUser();
        if (currentUser.tenantId) {
          const accountInfo = accounts.find(a => a.id === account.id);
          const accountNumber = accountInfo?.code?.slice(-4) || '****';

          await apiService.createCheque({
            tenantId: currentUser.tenantId,
            chequeNumber: chequeNumber,
            payee: payee || 'Multiple Items',
            amount: splitMode ? getSplitTotal() : parseFloat(amount),
            dueDate: chequeDate.toISOString(),
            bankAccountId: typeof account.id === 'string' ? parseInt(account.id) : account.id,
            accountNumber: accountNumber,
            purpose: description || (splitMode ? 'Split Expense' : (category?.name || 'Expense')),
            notes: `Expense transaction via cheque. Ref: ${reference}`,
            reference: reference || chequeNumber,
          });
        }
      }

      if (!splitMode) {
        // Simple transaction
        const finalAmount = showTax && taxAmount ?
          parseFloat(amount) + parseFloat(taxAmount) :
          parseFloat(amount);

        await apiService.createTransaction({
          type: 'EXPENSE',
          amount: finalAmount,
          category: category!.name,
          description: description.trim() || `${category!.name} - ${payee}`,
          payee: payee.trim(),
          paymentMethod: paymentMethod,
          date: date.toISOString(),
          notes: [
            reference.trim(),
            `Payment: ${paymentMethod}`,
            paymentMethod === 'Cheque' ? `Cheque #${chequeNumber}` : '',
            paymentMethod === 'Cheque' ? `Cheque Date: ${chequeDate.toLocaleDateString()}` : '',
            paymentMethod === 'Cheque' ? 'Status: Pending' : '',
            phoneNumber ? `Phone: ${phoneNumber}` : '',
            meterNumber ? `Meter: ${meterNumber}` : '',
            member ? `For: ${member.name}` : '',
          ].filter(Boolean).join(' | '),
          creditAccountId: typeof account.id === 'string' ? parseInt(account.id) : account.id,
        });
      } else {
        // Split transaction
        const totalAmount = getSplitTotal();

        await apiService.createTransaction({
          type: 'EXPENSE',
          amount: totalAmount,
          category: 'Multiple Categories',
          description: `Split expense - ${payee || 'Multiple items'}`,
          payee: payee.trim() || 'Multiple',
          paymentMethod: account.name,
          date: date.toISOString(),
          notes: reference.trim(),
          creditAccountId: typeof account.id === 'string' ? parseInt(account.id) : account.id,
          splits: splitLines.map(line => ({
            category: line.category!.name,
            description: `${line.description || line.category!.name}${line.member ? ` (For: ${line.member.name})` : ''}`,
            amount: parseFloat(line.amount),
          })),
        });
      }

      Alert.alert(
        '✅ Money Spent!',
        `KES ${splitMode ? getSplitTotal().toFixed(2) : parseFloat(amount).toFixed(2)} recorded`,
        [
          {
            text: 'Save & New',
            onPress: () => {
              resetForm();
            }
          },
          {
            text: 'Save & Close',
            onPress: () => router.back(),
            style: 'cancel'
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to save');
    } finally {
      setSaving(false);
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
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Add Expense</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

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
              </TouchableOpacity>
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
          </View>

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
});
