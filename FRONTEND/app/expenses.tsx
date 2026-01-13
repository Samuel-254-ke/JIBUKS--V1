import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const [transactionsData, statsData] = await Promise.all([
        apiService.getTransactions({ type: 'EXPENSE', limit: 100 }),
        apiService.getTransactionStats(),
      ]);
      setExpenses(transactionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Math.abs(amount).toLocaleString()}`;
  };

  const getCategoryIcon = (category: string): any => {
    const iconMap: { [key: string]: any } = {
      'Food': 'restaurant',
      'Transport': 'car',
      'Housing': 'home',
      'Utilities': 'flash',
      'Entertainment': 'film',
      'Healthcare': 'medical',
      'Education': 'school',
      'Shopping': 'bag',
    };
    return iconMap[category] || 'ellipse';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Food': '#FF6B6B',
      'Transport': '#4ECDC4',
      'Housing': '#45B7D1',
      'Utilities': '#FFA07A',
      'Entertainment': '#98D8C8',
      'Healthcare': '#F7DC6F',
      'Education': '#BB8FCE',
      'Shopping': '#85C1E2',
    };
    return colorMap[category] || '#6b7280';
  };

  const filteredExpenses = selectedCategory === 'All'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))];

  const groupExpensesByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(expense);
    });
    return grouped;
  };

  const groupedExpenses = groupExpensesByDate();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Expenses</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expenses</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-expense' as any)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>{formatCurrency(stats?.totalExpenses || 0)}</Text>
            <Text style={styles.statSubtext}>This month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{filteredExpenses.length}</Text>
            <Text style={styles.statSubtext}>
              {selectedCategory === 'All' ? 'All categories' : selectedCategory}
            </Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grouped Expenses */}
        {Object.keys(groupedExpenses).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No expenses found</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedCategory === 'All'
                ? 'Start tracking your expenses'
                : `No expenses in ${selectedCategory}`}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/add-expense' as any)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.emptyStateButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.keys(groupedExpenses).map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {groupedExpenses[date].map((expense) => (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseLeft}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: getCategoryColor(expense.category) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(expense.category)}
                        size={24}
                        color={getCategoryColor(expense.category)}
                      />
                    </View>
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseName}>
                        {expense.description || expense.category}
                      </Text>
                      <View style={styles.expenseMeta}>
                        <Text style={styles.expenseCategory}>{expense.category}</Text>
                        {expense.user && (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.expenseMember}>{expense.user.name}</Text>
                          </>
                        )}
                        {expense.paymentMethod && (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.expensePayment}>{expense.paymentMethod}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
                </View>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-expense' as any)}
      >
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  filterScroll: {
    marginTop: 20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  dateGroup: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 13,
    color: '#6b7280',
  },
  metaDot: {
    fontSize: 13,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  expenseMember: {
    fontSize: 13,
    color: '#6b7280',
  },
  expensePayment: {
    fontSize: 13,
    color: '#6b7280',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
