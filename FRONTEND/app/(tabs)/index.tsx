import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import apiService from '@/services/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await apiService.getCurrentUser();
      if (user && user.name) {
        setUserName(user.name);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboard();

      // Transform the data to match the component's expected format
      const transformedData = {
        familyName: data.familyMembers?.[0]?.name || 'Your Family',
        totalMembers: data.familyMembers?.length || 0,
        activeGoals: data.goals?.length || 0,
        totalBudget: data.budgets?.reduce((sum: number, b: any) => sum + Number(b.amount), 0) || 0,
        monthlySpending: Number(data.summary?.totalExpenses) || 0,
        recentGoals: data.goals?.slice(0, 3).map((g: any) => ({
          id: g.id,
          name: g.name,
          current: Number(g.currentAmount),
          target: Number(g.targetAmount),
          deadline: g.targetDate ? new Date(g.targetDate).toLocaleDateString() : 'No deadline'
        })) || [],
        budgetOverview: data.budgets?.slice(0, 3).map((b: any) => {
          const spent = data.categorySpending?.find((c: any) => c.category === b.category)?.amount || 0;
          return {
            category: b.category,
            allocated: Number(b.amount),
            spent: Number(spent)
          };
        }) || [],
        recentTransactions: data.recentTransactions?.slice(0, 4).map((t: any) => ({
          id: t.id,
          name: t.description || t.category,
          amount: Number(t.amount),
          time: new Date(t.date).toLocaleDateString(),
          category: t.category,
          type: t.type.toLowerCase()
        })) || [],
        summary: data.summary || { totalIncome: 0, totalExpenses: 0, balance: 0 }
      };

      setDashboardData(transformedData);
    } catch (error: any) {
      // If user has no family, redirect to family setup
      if (error.error === 'User is not part of any family' ||
        error.error === 'Not part of a family') {
        console.log('No family found - redirecting to family setup');
        try {
          (router.replace as any)('/family-setup');
        } catch (navError) {
          console.error('Navigation error:', navError);
        }
      } else {
        console.error('Error loading dashboard:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadUserData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1e3a8a', '#2563eb']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.familyName}>Loading...</Text>
              <Text style={styles.headerTitle}>Family Dashboard</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              // @ts-ignore - Route exists but not in type definitions
              onPress={() => router.push('/family-settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 16, color: '#64748b' }}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1e3a8a', '#2563eb']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.familyName}>Error</Text>
              <Text style={styles.headerTitle}>Family Dashboard</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  // TODO: Navigate to notifications screen when implemented
                  console.log('Notifications pressed');
                }}
              >
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                // @ts-ignore - Route exists but not in type definitions
                onPress={() => router.push('/family-settings')}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={{ marginTop: 16, color: '#64748b', fontSize: 16 }}>Failed to load dashboard</Text>
          <TouchableOpacity
            onPress={loadDashboardData}
            style={{ marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Blue Gradient Header */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.familyName}>{dashboardData.familyName}</Text>
            <Text style={styles.headerTitle}>Family Dashboard</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                // TODO: Navigate to notifications screen when implemented
                console.log('Notifications pressed');
              }}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              // @ts-ignore - Route exists but not in type definitions
              onPress={() => router.push('/family-settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back to Jibuks{userName ? `, ${userName}` : ''}! 👋
          </Text>
          <Text style={styles.familyNameText}>
            {dashboardData.familyName}
          </Text>
        </View>

        {/* Balance Card */}
        <View style={styles.section}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>BALANCE</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(dashboardData.summary?.balance || 0)}</Text>
            <Text style={styles.balanceSubtitle}>
              Income: {formatCurrency(dashboardData.summary?.totalIncome || 0)} |
              Expenses: {formatCurrency(dashboardData.summary?.totalExpenses || 0)}
            </Text>
          </View>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {/* Total Members */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="people" size={24} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{dashboardData.totalMembers}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>

            {/* Active Goals */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#fed7aa' }]}>
                <Ionicons name="trophy" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{dashboardData.activeGoals}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            {/* Total Budget */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="wallet" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(dashboardData.totalBudget)}</Text>
              <Text style={styles.statLabel}>Total Budget</Text>
            </View>

            {/* This Month's Spending */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="trending-down" size={24} color="#ec4899" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(dashboardData.monthlySpending)}</Text>
              <Text style={styles.statLabel}>Month Spending</Text>
            </View>
          </View>
        </View>

        {/* Progress Cards Row */}
        {dashboardData.budgetOverview && dashboardData.budgetOverview.length > 0 && dashboardData.recentGoals && dashboardData.recentGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.progressCardsRow}>
              {/* Monthly Budget Progress */}
              {dashboardData.budgetOverview[0] && (
                <View style={styles.progressCard}>
                  <Text style={styles.progressCardTitle}>{dashboardData.budgetOverview[0].category.toUpperCase()} BUDGET</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(calculateProgress(dashboardData.budgetOverview[0].spent, dashboardData.budgetOverview[0].allocated), 100)}%`,
                        backgroundColor: '#f59e0b'
                      }
                    ]} />
                  </View>
                  <View style={styles.progressCardDetails}>
                    <Text style={styles.progressCardText}>Spent: {formatCurrency(dashboardData.budgetOverview[0].spent)}</Text>
                    <Text style={styles.progressCardText}>Left: {formatCurrency(dashboardData.budgetOverview[0].allocated - dashboardData.budgetOverview[0].spent)}</Text>
                  </View>
                </View>
              )}

              {/* Goal Progress */}
              {dashboardData.recentGoals[0] && (
                <View style={styles.progressCard}>
                  <Text style={styles.progressCardTitle}>{dashboardData.recentGoals[0].name.toUpperCase()}</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[
                      styles.progressBar,
                      {
                        width: `${calculateProgress(dashboardData.recentGoals[0].current, dashboardData.recentGoals[0].target)}%`,
                        backgroundColor: '#2563eb'
                      }
                    ]} />
                  </View>
                  <Text style={styles.progressCardAmount}>
                    {formatCurrency(dashboardData.recentGoals[0].current)} / {formatCurrency(dashboardData.recentGoals[0].target)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButtonSquare}
              onPress={() => {
                try {
                  (router.push as any)('/income');
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
            >
              <View style={styles.actionIconCircle}>
                <Text style={styles.actionIconEmoji}>🎁</Text>
              </View>
              <Text style={styles.actionButtonLabel}>Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSquare}
              onPress={() => {
                try {
                  (router.push as any)('/expenses');
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
            >
              <View style={styles.actionIconCircle}>
                <Text style={styles.actionIconEmoji}>💰</Text>
              </View>
              <Text style={styles.actionButtonLabel}>Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSquare}
              onPress={() => {
                try {
                  (router.push as any)('/manage');
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons name="settings" size={24} color="#fff" />
              </View>
              <Text style={styles.actionButtonLabel}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Family Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT FAMILY ACTIVITY</Text>
          <View style={styles.activityCard}>
            {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
              dashboardData.recentTransactions.map((activity: any) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <View style={[
                      styles.activityIconCircle,
                      { backgroundColor: activity.type === 'income' ? '#d1fae5' : '#fee2e2' }
                    ]}>
                      <Ionicons
                        name={activity.type === 'income' ? 'arrow-down' : 'arrow-up'}
                        size={20}
                        color={activity.type === 'income' ? '#10b981' : '#ef4444'}
                      />
                    </View>
                    <View style={styles.activityDetails}>
                      <Text style={styles.activityName}>{activity.name}</Text>
                      <Text style={styles.activityTime}>{activity.time} | {activity.category}</Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.activityAmount,
                    { color: activity.type === 'income' ? '#10b981' : '#ef4444' }
                  ]}>
                    {activity.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(activity.amount))}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
                No recent transactions
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/transactions' as any)}
          >
            <Text style={styles.viewAllButtonText}>View all Activity</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Goals</Text>
            <TouchableOpacity onPress={() => {
              try {
                (router.push as any)('/recent-goals');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {dashboardData.recentGoals && dashboardData.recentGoals.length > 0 ? (
            dashboardData.recentGoals.map((goal: any) => {
              const progress = calculateProgress(goal.current, goal.target);
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <TouchableOpacity
                    onPress={() => {
                      try {
                        (router.push as any)('/recent-goals');
                      } catch (error) {
                        console.error('Navigation error:', error);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalDeadline}>{goal.deadline}</Text>
                    </View>
                    <View style={styles.goalAmounts}>
                      <Text style={styles.goalAmount}>
                        {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                      </Text>
                      <Text style={styles.goalPercentage}>{progress.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                  </TouchableOpacity>

                  {/* Add Money Button */}
                  <TouchableOpacity
                    style={styles.addToGoalButton}
                    onPress={() => {
                      try {
                        (router.push as any)(`/add-to-goal?goalId=${goal.id}`);
                      } catch (error) {
                        console.error('Navigation error:', error);
                      }
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#7c3aed" />
                    <Text style={styles.addToGoalButtonText}>Add Money</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <Text style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
              No active goals
            </Text>
          )}
        </View>

        {/* Budget Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Overview</Text>
            <TouchableOpacity onPress={() => {
              try {
                (router.push as any)('/monthly-budgets');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {dashboardData.budgetOverview.map((budget: any, index: number) => {
            const progress = calculateProgress(budget.spent, budget.allocated);
            const isOverBudget = budget.spent > budget.allocated;
            const remaining = budget.allocated - budget.spent;

            return (
              <TouchableOpacity
                key={index}
                style={styles.budgetCard}
                onPress={() => {
                  try {
                    (router.push as any)('/monthly-budgets');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetCategory}>{budget.category}</Text>
                  <Text style={[
                    styles.budgetRemaining,
                    { color: isOverBudget ? '#ef4444' : '#10b981' }
                  ]}>
                    {remaining >= 0 ? 'Remaining: ' : 'Over: '}{formatCurrency(Math.abs(remaining))}
                  </Text>
                </View>
                <View style={styles.budgetAmounts}>
                  <Text style={styles.budgetAmount}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                  </Text>
                  <Text style={styles.budgetPercentage}>{progress.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: isOverBudget ? '#ef4444' : '#f59e0b'
                    }
                  ]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Additional Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>More Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              try {
                (router.push as any)('/family-dreams');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add Goal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              try {
                (router.push as any)('/family-settings');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>View Members</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              try {
                (router.push as any)('/add-family-member');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Ionicons name="person-add" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Add Member</Text>
          </TouchableOpacity>
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyName: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  familyNameText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 56) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  goalCard: {
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
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  goalDeadline: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalAmount: {
    fontSize: 14,
    color: '#4b5563',
  },
  goalPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  addToGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  addToGoalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  budgetCard: {
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
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  budgetRemaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetAmount: {
    fontSize: 14,
    color: '#4b5563',
  },
  budgetPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // New styles for enhanced dashboard
  progressCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: (width - 56) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  progressCardDetails: {
    marginTop: 8,
  },
  progressCardText: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressCardAmount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButtonSquare: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 16,
    width: (width - 64) / 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIconEmoji: {
    fontSize: 24,
  },
  actionButtonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activityCard: {
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
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewAllButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
