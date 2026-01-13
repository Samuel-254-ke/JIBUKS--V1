import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PasswordResetSuccessScreen() {
  const router = useRouter();

  const handleContinueToLogin = () => {
    // Navigate to login screen, replace so user can't go back
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <Image
          source={require('../assets/images/homepage.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Success Icon and Text */}
      <View style={styles.contentSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#2563eb" />
        </View>

        <Text style={styles.title}>Password Reset Successful!</Text>
        
        <Text style={styles.message}>
          Your password has been updated successfully.
        </Text>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueToLogin}
        >
          <Text style={styles.continueButtonText}>CONTINUE TO LOGIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
  },
  contentSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonSection: {
    paddingBottom: 50,
  },
  continueButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
