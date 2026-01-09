import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const categoryOptions = [
  { id: '1', name: 'Food & Groceries' },
  { id: '2', name: 'Transport' },
  { id: '3', name: 'Utilities' },
  { id: '4', name: 'Entertainment' },
  { id: '5', name: 'Healthcare' },
  { id: '6', name: 'Education' },
  { id: '7', name: 'Housing' },
  { id: '8', name: 'Shopping' },
  { id: '9', name: 'Other' },
];

const sourceOptions = [
  { id: '1', name: 'Cash' },
  { id: '2', name: 'Mpesa' },
  { id: '3', name: 'Bank' },
  { id: '4', name: 'Airtel Money' },
  { id: '5', name: 'Credit Card' },
  { id: '6', name: 'Other' },
];

// Mock family members - TODO: Load from API
const familyMembers = [
  { id: '1', name: 'David' },
  { id: '2', name: 'Sarah' },
  { id: '3', name: 'John' },
];

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Groceries');
  const [source, setSource] = useState('Cash');
  const [paidBy, setPaidBy] = useState('David');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [splitWithFamily, setSplitWithFamily] = useState(false);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSubmit = () => {
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    // TODO: Submit to API
    const expenseData = {
      amount: parseFloat(amount),
      category,
      source,
      paidBy,
      date: date.toISOString(),
      description,
      splitWithFamily,
    };

    console.log('Expense data:', expenseData);

    // Show success message
    Alert.alert(
      'Success',
      'Expense added successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            try {
              router.back();
            } catch (error) {
              console.error('Navigation error:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f59e0b" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Expense</Text>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>KES</Text>
              <TextInput
                style={styles.input}
                placeholder="2,400"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Category Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowSourceDropdown(false);
                setShowMemberDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>{category}</Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={styles.dropdownMenu}>
                {categoryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setCategory(option.name);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownMenuItemText,
                        category === option.name && styles.dropdownMenuItemTextSelected,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Source Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Source</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowSourceDropdown(!showSourceDropdown);
                setShowCategoryDropdown(false);
                setShowMemberDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>{source}</Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showSourceDropdown && (
              <View style={styles.dropdownMenu}>
                {sourceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setSource(option.name);
                      setShowSourceDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownMenuItemText,
                        source === option.name && styles.dropdownMenuItemTextSelected,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Paid By Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paid By</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowMemberDropdown(!showMemberDropdown);
                setShowCategoryDropdown(false);
                setShowSourceDropdown(false);
              }}
            >
              <Text style={styles.dropdownText}>{paidBy}</Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showMemberDropdown && (
              <View style={styles.dropdownMenu}>
                {familyMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={styles.dropdownMenuItem}
                    onPress={() => {
                      setPaidBy(member.name);
                      setShowMemberDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownMenuItemText,
                        paidBy === member.name && styles.dropdownMenuItemTextSelected,
                      ]}
                    >
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                // TODO: Implement native date picker
                Alert.alert('Date Picker', 'Date picker will be implemented with native component');
              }}
            >
              <Text style={styles.dropdownText}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Vegetables"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Split Option */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setSplitWithFamily(!splitWithFamily)}
          >
            <View style={styles.checkbox}>
              {splitWithFamily && (
                <Ionicons name="checkmark" size={18} color="#2563eb" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Split this expense with family</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1f2937',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
  },
  dropdownMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownMenuItemText: {
    fontSize: 15,
    color: '#4b5563',
  },
  dropdownMenuItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#4b5563',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
