import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [activeFilter, searchQuery, transactions]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTransactions({ limit: 100 });
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(t => t.type.toLowerCase() === activeFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

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

  const getIconName = (category: string): any => {
    const iconMap: { [key: string]: any } = {
      'Food': 'restaurant',
      'Transport': 'car',
      'Housing': 'home',
      'Utilities': 'flash',
      'Entertainment': 'film',
      'Healthcare': 'medical',
      'Education': 'school',
      'Shopping': 'bag',
      'Salary': 'cash',
      'Business': 'briefcase',
      'Investment': 'trending-up',
      'Gift': 'gift',
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
      'Salary': '#52C41A',
      'Business': '#1890FF',
      'Investment': '#722ED1',
      'Gift': '#EB2F96',
    };
    return colorMap[category] || '#6b7280';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSubtitle}>{filteredTransactions.length} transactions</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'income' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('income')}
          >
            <Ionicons
              name="arrow-down"
              size={16}
              color={activeFilter === 'income' ? '#fff' : '#10b981'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterText, activeFilter === 'income' && styles.filterTextActive]}>
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'expense' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('expense')}
          >
            <Ionicons
              name="arrow-up"
              size={16}
              color={activeFilter === 'expense' ? '#fff' : '#ef4444'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterText, activeFilter === 'expense' && styles.filterTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateText}>No transactions found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try a different search term' : 'Start adding transactions to see them here'}
              </Text>
            </View>
          ) : (
            filteredTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: getCategoryColor(transaction.category) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getIconName(transaction.category)}
                      size={24}
                      color={getCategoryColor(transaction.category)}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionName}>
                      {transaction.description || transaction.category}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                      <Text style={styles.transactionDot}>•</Text>
                      <Text style={styles.transactionCategory}>{transaction.category}</Text>
                      {transaction.user && (
                        <>
                          <Text style={styles.transactionDot}>•</Text>
                          <Text style={styles.transactionMember}>{transaction.user.name}</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'INCOME' ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {transaction.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  transactionsList: {
    paddingHorizontal: 20,
  },
  transactionCard: {
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
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
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
  },
  transactionDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  transactionDot: {
    fontSize: 13,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#6b7280',
  },
  transactionMember: {
    fontSize: 13,
    color: '#6b7280',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
});
