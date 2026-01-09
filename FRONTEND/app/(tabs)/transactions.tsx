import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock transactions data
// TODO: Replace with real API calls when backend is ready
const mockTransactions = [
  { id: 1, name: "Supermarket", amount: -2400, date: "2026-01-08T15:24:00", time: "3:24 PM", category: "Food", icon: "cart", member: "Sarah", type: 'expense' as const },
  { id: 2, name: "Salary", amount: 50000, date: "2026-01-08T12:00:00", time: "12:00 PM", category: "Income", icon: "cash", member: "John", type: 'income' as const },
  { id: 3, name: "Uber", amount: -800, date: "2026-01-08T09:15:00", time: "9:15 AM", category: "Transport", icon: "car", member: "David", type: 'expense' as const },
  { id: 4, name: "Electricity", amount: -3500, date: "2026-01-07T10:00:00", time: "10:00 AM", category: "Utilities", icon: "flash", member: "Sarah", type: 'expense' as const },
  { id: 5, name: "Restaurant", amount: -4200, date: "2026-01-06T19:30:00", time: "7:30 PM", category: "Food", icon: "restaurant", member: "Family", type: 'expense' as const },
  { id: 6, name: "Freelance Work", amount: 15000, date: "2026-01-06T14:00:00", time: "2:00 PM", category: "Income", icon: "briefcase", member: "John", type: 'income' as const },
  { id: 7, name: "Rent", amount: -12500, date: "2026-01-05T08:00:00", time: "8:00 AM", category: "Housing", icon: "home", member: "Sarah", type: 'expense' as const },
  { id: 8, name: "Grocery Shopping", amount: -5600, date: "2026-01-04T16:45:00", time: "4:45 PM", category: "Food", icon: "cart", member: "Sarah", type: 'expense' as const },
  { id: 9, name: "Movie Tickets", amount: -1800, date: "2026-01-03T20:00:00", time: "8:00 PM", category: "Entertainment", icon: "film", member: "Family", type: 'expense' as const },
  { id: 10, name: "M-Pesa", amount: 21400, date: "2026-01-03T11:30:00", time: "11:30 AM", category: "Transfer", icon: "phone-portrait", member: "John", type: 'income' as const },
];

type FilterType = 'all' | 'today' | 'week' | 'month';

export default function TransactionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const formatCurrency = (amount: number) => {
    return `KES ${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getIconName = (icon: string): any => {
    const iconMap: { [key: string]: any } = {
      cart: 'cart',
      cash: 'cash',
      car: 'car',
      flash: 'flash',
      restaurant: 'restaurant',
      briefcase: 'briefcase',
      home: 'home',
      film: 'film',
      'phone-portrait': 'phone-portrait',
    };
    return iconMap[icon] || 'cash';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      Food: '#f59e0b',
      Income: '#10b981',
      Transport: '#3b82f6',
      Utilities: '#8b5cf6',
      Housing: '#ef4444',
      Entertainment: '#ec4899',
      Transfer: '#10b981',
    };
    return colorMap[category] || '#6b7280';
  };

  // Filter transactions based on search and filter
  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.member.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;

    const transactionDate = new Date(transaction.date);
    const today = new Date();
    
    if (selectedFilter === 'today') {
      return transactionDate.toDateString() === today.toDateString();
    }
    
    if (selectedFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return transactionDate >= weekAgo;
    }
    
    if (selectedFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return transactionDate >= monthAgo;
    }

    return true;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Ionicons name="filter" size={24} color="#fff" />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'today' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('today')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'today' && styles.filterChipTextActive]}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'week' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('week')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'week' && styles.filterChipTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'month' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('month')}
          >
            <Text style={[styles.filterChipText, selectedFilter === 'month' && styles.filterChipTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="arrow-down" size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Income</Text>
                <Text style={styles.summaryIncome}>{formatCurrency(totalIncome)}</Text>
              </View>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="arrow-up" size={20} color="#ef4444" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Expenses</Text>
                <Text style={styles.summaryExpense}>{formatCurrency(totalExpenses)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.transactionsContainer}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try adjusting your search or filters' : 'Add your first transaction to get started'}
              </Text>
            </View>
          ) : (
            filteredTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.type === 'income' ? '#d1fae5' : '#fee2e2' }
                ]}>
                  <Ionicons
                    name={getIconName(transaction.icon)}
                    size={24}
                    color={transaction.type === 'income' ? '#10b981' : '#ef4444'}
                  />
                </View>

                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionName}>{transaction.name}</Text>
                  <View style={styles.transactionMeta}>
                    <Text style={styles.transactionTime}>{formatDate(transaction.date)} · {transaction.time}</Text>
                    <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(transaction.category) + '20' }]}>
                      <Text style={[styles.categoryTagText, { color: getCategoryColor(transaction.category) }]}>
                        {transaction.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.transactionMember}>by {transaction.member}</Text>
                </View>

                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                  ]}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bottom Spacing for Tab Bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryIncome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  summaryExpense: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  transactionsContainer: {
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionMember: {
    fontSize: 11,
    color: '#9ca3af',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
