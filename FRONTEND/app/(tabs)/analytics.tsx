import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function SuppliersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.getVendors();
      // Filter filtering in memory for now based on local search query to avoid too many API calls while typing
      // Ideally API handles search, but for small lists this is fine. 
      // If the API supports search param we can use that too.
      // The backend DOES support search query now!
      if (searchQuery) {
        const searchData = await apiService.getVendors({ active: undefined }); // Re-fetch with search would require modifying API signature or handling search in memory
        // Since getVendors definition in api.ts doesn't explicitly expose 'search' param in the interface yet (it only has active), 
        // let's stick to in-memory filtering for the displayed list or update api.ts.
        // Updating api.ts is cleaner but for now let's just filter locally on the fetched list 
        // to match the previous behavior but with real data.
      }
      setSuppliers(data);
      console.log('Fetched suppliers:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load suppliers',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchSuppliers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.isActive).length;
  // Calculate total outstanding balance from suppliers (if available in backend response)
  // The backend response for vendor includes 'balance'
  const totalOutstanding = suppliers.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);

  const getInitials = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : '??';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#9ca3af';
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#122f8a" />

      {/* Creative Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#122f8a', '#0a1a5c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Header Content */}
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Suppliers</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-supplier' as any)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Suppliers</Text>
              <Text style={styles.statValue}>{totalSuppliers}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Active</Text>
              <Text style={styles.statValue}>{activeSuppliers}</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Outstanding</Text>
              <Text style={styles.statValue}>{formatCurrency(totalOutstanding)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Floating Search Bar */}
        <View style={styles.searchContainerWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search supplier name, email..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#122f8a" />
        }
      >

        {/* Suppliers List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>All Suppliers</Text>

          {isLoading && !refreshing ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#122f8a" />
            </View>
          ) : (
            <>
              {filteredSuppliers.map((supplier) => (
                <TouchableOpacity
                  key={supplier.id}
                  style={styles.supplierCard}
                  onPress={() => router.push(`/vendor-profile?id=${supplier.id}&name=${encodeURIComponent(supplier.name)}` as any)}
                >
                  {/* Left: Avatar */}
                  <View style={[styles.avatarContainer, { backgroundColor: '#e0e7ff', overflow: 'hidden' }]}>
                    {supplier.logoUrl ? (
                      <Image
                        source={{ uri: apiService.getImageUrl(supplier.logoUrl) }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>{getInitials(supplier.name)}</Text>
                    )}
                  </View>

                  {/* Middle: Info */}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{supplier.name}</Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.cardCategory}>{supplier.email || supplier.phone || 'No contact info'}</Text>
                      <View style={styles.dotSeparator} />
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(supplier.isActive) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(supplier.isActive) }]}>
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right: Balance & Action */}
                  <View style={styles.cardRight}>
                    <Text style={styles.cardAmount}>{formatCurrency(Number(supplier.balance) || 0)}</Text>
                    <TouchableOpacity style={styles.callButton}>
                      <Ionicons name="chevron-forward" size={18} color="#122f8a" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}

              {filteredSuppliers.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No suppliers found</Text>
                  <Text style={styles.emptySubtext}>
                    {suppliers.length === 0 ? "Add your first supplier to get started" : "Try a different search term"}
                  </Text>
                  {suppliers.length === 0 && (
                    <TouchableOpacity
                      style={[styles.addButton, { width: 'auto', paddingHorizontal: 20, marginTop: 15, borderRadius: 12 }]}
                      onPress={() => router.push('/add-supplier' as any)}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Supplier</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
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
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 50,
    paddingBottom: 50, // More space for search bar
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fe9900',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchContainerWrapper: {
    marginHorizontal: 20,
    marginTop: -25, // Overlap the header
    zIndex: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    marginTop: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
    marginTop: 10,
  },
  supplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#122f8a',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 13,
    color: '#64748b',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  callButton: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
});
