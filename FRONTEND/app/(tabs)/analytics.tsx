import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiService from '@/services/api';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const loadAnalytics = async () => {
    try {
      const data = await apiService.getAnalytics('month');
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  if (loading && !analyticsData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Analytics</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Analyzing financial data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use real data or fallback to zeros if something is missing
  const summary = analyticsData?.summary || { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 };
  const spendingByCategory = analyticsData?.spendingByCategory || [];
  const monthlyComparison = analyticsData?.monthlyComparison || {
    thisMonth: { income: 0, expenses: 0 },
    lastMonth: { income: 0, expenses: 0 }
  };

  const maxAmount = spendingByCategory.length > 0
    ? Math.max(...spendingByCategory.map((c: any) => c.amount))
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Ionicons name="filter" size={24} color="#fff" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#10b981' }]}>
              <Ionicons name="arrow-down" size={24} color="#fff" />
              <Text style={styles.summaryAmount}>{formatCurrency(summary.totalIncome)}</Text>
              <Text style={styles.summaryLabel}>Total Income</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="arrow-up" size={24} color="#fff" />
              <Text style={styles.summaryAmount}>{formatCurrency(summary.totalExpenses)}</Text>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#2563eb' }]}>
              <Ionicons name="wallet" size={24} color="#fff" />
              <Text style={styles.summaryAmount}>{formatCurrency(summary.netSavings)}</Text>
              <Text style={styles.summaryLabel}>Net Savings</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: '#f59e0b' }]}>
              <Ionicons name="trending-up" size={24} color="#fff" />
              <Text style={styles.summaryAmount}>{summary.savingsRate}%</Text>
              <Text style={styles.summaryLabel}>Savings Rate</Text>
            </View>
          </View>
        </View>

        {/* Spending by Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <Text style={styles.sectionSubtitle}>This Month</Text>
          </View>

          {spendingByCategory.length > 0 ? (
            <View style={styles.categoryCard}>
              {spendingByCategory.map((category: any, index: number) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryName}>{category.category}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
                    <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="pie-chart-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No expense data for this month</Text>
            </View>
          )}
        </View>

        {/* Category Bar Chart */}
        {spendingByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <View style={styles.chartCard}>
              {spendingByCategory.map((category: any, index: number) => (
                <View key={index} style={styles.chartRow}>
                  <Text style={styles.chartLabel} numberOfLines={1}>{category.category}</Text>
                  <View style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          width: `${(category.amount / maxAmount) * 100}%`,
                          backgroundColor: category.color
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>{formatCurrency(category.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Comparison</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>This Month</Text>
              <View style={styles.comparisonValues}>
                <View style={styles.comparisonItem}>
                  <Ionicons name="arrow-down" size={16} color="#10b981" />
                  <Text style={styles.comparisonIncome}>
                    {formatCurrency(monthlyComparison.thisMonth.income)}
                  </Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Ionicons name="arrow-up" size={16} color="#ef4444" />
                  <Text style={styles.comparisonExpense}>
                    {formatCurrency(monthlyComparison.thisMonth.expenses)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Last Month</Text>
              <View style={styles.comparisonValues}>
                <View style={styles.comparisonItem}>
                  <Ionicons name="arrow-down" size={16} color="#10b981" />
                  <Text style={styles.comparisonIncome}>
                    {formatCurrency(monthlyComparison.lastMonth.income)}
                  </Text>
                </View>
                <View style={styles.comparisonItem}>
                  <Ionicons name="arrow-up" size={16} color="#ef4444" />
                  <Text style={styles.comparisonExpense}>
                    {formatCurrency(monthlyComparison.lastMonth.expenses)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Coming Soon Message */}
        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <Ionicons name="analytics" size={64} color="#cbd5e1" />
            <Text style={styles.comingSoonTitle}>More Analytics Coming Soon!</Text>
            <Text style={styles.comingSoonText}>
              We're working on adding more detailed charts and insights including:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>📊 Interactive charts and graphs</Text>
              <Text style={styles.featureItem}>📈 Trend analysis over time</Text>
              <Text style={styles.featureItem}>🎯 Budget vs. actual comparison</Text>
              <Text style={styles.featureItem}>💡 Smart spending insights</Text>
              <Text style={styles.featureItem}>📅 Custom date range selection</Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing for Tab Bar */}
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    width: (width - 56) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: 80,
  },
  chartBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 12,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    width: 80,
    textAlign: 'right',
  },
  comparisonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonRow: {
    paddingVertical: 12,
  },
  comparisonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  comparisonValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  comparisonIncome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  comparisonExpense: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureList: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    paddingLeft: 8,
  },
  emptyStateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 16,
  }
});
