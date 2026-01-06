import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

type AccountType = 'business' | 'family' | 'both' | null;

export default function AccountTypeScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<AccountType>(null);

  const handleSelectType = (type: AccountType) => {
    setSelectedType(type);
    // Navigate based on account type after a short delay to show selection
    setTimeout(() => {
      if (type === 'family') {
        router.push('/family-setup');
      } else if (type === 'business') {
        router.push('/business-onboarding');
      } else {
        // For 'both', maybe go to family first then business? 
        // Or create a combined flow. For now, defaulting to family setup.
        router.push('/family-setup');
      }
    }, 300);
  };

  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb']}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hello! 👋</Text>
      </LinearGradient>

      {/* White Card Section */}
      <View style={styles.card}>
        <Text style={styles.title}>Choose what you'd like to manage:</Text>

        {/* For my Business */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === 'business' && styles.optionCardSelected
          ]}
          onPress={() => handleSelectType('business')}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>🏢</Text>
          <Text style={styles.optionTitle}>For my Business</Text>
          <Text style={styles.optionSubtitle}>(Shop, NGO, Freelance)</Text>
        </TouchableOpacity>

        {/* For my Family */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === 'family' && styles.optionCardSelected
          ]}
          onPress={() => handleSelectType('family')}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>🏠</Text>
          <Text style={styles.optionTitle}>For my Family</Text>
          <Text style={styles.optionSubtitle}>(Home budgets & savings)</Text>
        </TouchableOpacity>

        {/* For Both */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedType === 'both' && styles.optionCardSelected
          ]}
          onPress={() => handleSelectType('both')}
          activeOpacity={0.7}
        >
          <View style={styles.bothIconContainer}>
            <Text style={styles.iconText}>🏢</Text>
            <Text style={styles.plusText}>+</Text>
            <Text style={styles.iconText}>🏠</Text>
          </View>
          <Text style={styles.optionTitle}>For Both</Text>
          <Text style={styles.optionSubtitle}>(Business + Family together)</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Apbc</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 32,
    textAlign: 'center',
  },
  optionCard: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e3a8a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    borderWidth: 3,
  },
  iconText: {
    fontSize: 48,
    marginBottom: 8,
  },
  bothIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  plusText: {
    fontSize: 32,
    color: '#f59e0b',
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
