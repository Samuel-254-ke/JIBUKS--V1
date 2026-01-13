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

export default function IncomeScreen() {
  const router = useRouter();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const [transactionsData, statsData] = await Promise.all([
        apiService.getTransactions({ type: 'INCOME', limit: 100 }),
        apiService.getTransactionStats(),
      ]);
      setIncomes(transactionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncomes();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${Math.abs(amount).toLocaleString()}`;
  };

  const getCategoryIcon = (category: string): any => {
    const iconMap: { [key: string]: any } = {
      'Salary': 'cash',
      'Business': 'briefcase',
      'Investment': 'trending-up',
      'Gift': 'gift',
      'Freelance': 'laptop',
      'Bonus': 'star',
      'Refund': 'return-up-back',
    };
    return iconMap[category] || 'wallet';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Salary': '#52C41A',
      'Business': '#1890FF',
      'Investment': '#722ED1',
      'Gift': '#EB2F96',
      'Freelance': '#13C2C2',
      'Bonus': '#FAAD14',
      'Refund': '#52C41A',
    };
    return colorMap[category] || '#10b981';
  };

  const filteredIncomes = selectedCategory === 'All'
    ? incomes
    : incomes.filter(i => i.category === selectedCategory);

  const categories = ['All', ...Array.from(new Set(incomes.map(i => i.category)))];

  const groupIncomesByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    filteredIncomes.forEach(income => {
      const date = new Date(income.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(income);
    });
    return grouped;
  };

  const groupedIncomes = groupIncomesByDate();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Income</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading income...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Income</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-income' as any)}
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
            <Text style={styles.statLabel}>Total Income</Text>
            <Text style={styles.statValue}>{formatCurrency(stats?.totalIncome || 0)}</Text>
            <Text style={styles.statSubtext}>This month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{filteredIncomes.length}</Text>
            <Text style={styles.statSubtext}>
              {selectedCategory === 'All' ? 'All sources' : selectedCategory}
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

        {/* Grouped Incomes */}
        {Object.keys(groupedIncomes).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No income found</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedCategory === 'All'
                ? 'Start tracking your income'
                : `No income from ${selectedCategory}`}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/add-income' as any)}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.emptyStateButtonText}>Add Income</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.keys(groupedIncomes).map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {groupedIncomes[date].map((income) => (
                <View key={income.id} style={styles.incomeCard}>
                  <View style={styles.incomeLeft}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: getCategoryColor(income.category) + '20' },
                      ]}
                    >
                      <Ionicons
                        name={getCategoryIcon(income.category)}
                        size={24}
                        color={getCategoryColor(income.category)}
                      />
                    </View>
                    <View style={styles.incomeDetails}>
                      <Text style={styles.incomeName}>
                        {income.description || income.category}
                      </Text>
                      <View style={styles.incomeMeta}>
                        <Text style={styles.incomeCategory}>{income.category}</Text>
                        {income.user && (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.incomeMember}>{income.user.name}</Text>
                          </>
                        )}
                        {income.paymentMethod && (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.incomePayment}>{income.paymentMethod}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.incomeAmount}>+{formatCurrency(income.amount)}</Text>
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
        onPress={() => router.push('/add-income' as any)}
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
    color: '#10b981',
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
    backgroundColor: '#10b981',
    borderColor: '#10b981',
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
  incomeCard: {
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
  incomeLeft: {
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
  incomeDetails: {
    flex: 1,
  },
  incomeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  incomeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeCategory: {
    fontSize: 13,
    color: '#6b7280',
  },
  metaDot: {
    fontSize: 13,
    color: '#d1d5db',
    marginHorizontal: 6,
  },
  incomeMember: {
    fontSize: 13,
    color: '#6b7280',
  },
  incomePayment: {
    fontSize: 13,
    color: '#6b7280',
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
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
    backgroundColor: '#10b981',
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
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
