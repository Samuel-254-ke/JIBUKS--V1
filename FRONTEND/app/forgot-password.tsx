import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import { showToast } from '@/utils/toast';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    // Validation
    if (!emailOrPhone.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      // showToast.error('Error', 'Please enter your email or phone number');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: API call to send OTP
      // Example API call:
      // const response = await fetch('YOUR_API_ENDPOINT/forgot-password', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ emailOrPhone }),
      // });
      // const data = await response.json();
      
      // Simulate API call (remove this in production)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // On success, navigate to verify-otp screen
      Alert.alert('Success', 'OTP has been sent to your email/phone');
      // showToast.success('Success', 'OTP has been sent to your email/phone');
      
      // Navigate to verify-otp screen
      router.push({
        pathname: '/verify-otp',
        params: { emailOrPhone }
      });
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      // showToast.error('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/images/homepage.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header with Lock Icon */}
        <View style={styles.headerSection}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={40} color="#333" />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Enter your email or phone number to reset your password
        </Text>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Email/Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email /Phone :</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone or email"
              placeholderTextColor="#999"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              keyboardType="default"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Send Reset OTP Button */}
          <TouchableOpacity
            style={[styles.sendOtpButton, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#2563eb" size="small" />
            ) : (
              <Text style={styles.sendOtpButtonText}>SEND RESET OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer to push back button to bottom */}
        <View style={styles.spacer} />

        {/* Back to Login Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  sendOtpButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sendOtpButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  backButton: {
    backgroundColor: '#F5B942',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
