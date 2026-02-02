import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { showToast } from '@/utils/toast'
import type { TenantType } from '@/services/api'

const Signup = () => {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [tenantType, setTenantType] = useState<TenantType>('FAMILY')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Show error toast when registration fails
  useEffect(() => {
    if (error) {
      showToast.error('Error', error)
      clearError()
    }
  }, [error])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleContinue = async () => {
    // Client-side validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      showToast.error('Error', 'Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      showToast.error('Error', 'Passwords do not match')
      return
    }

    // Prepare data for backend
    const registrationData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phoneNumber,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      tenantType,
    }

    try {
      await register(registrationData)

      showToast.success('Successfully registered', 'Welcome to JIBUKS!')
      router.replace('/welcome')

    } catch (error: any) {
      console.error('Registration error:', error)
      // Error is handled by useEffect above
    }
  }

  const handleLogin = () => {
    // Navigate to login screen
    router.push('/login')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#4285F4" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Tenant Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>I'm signing up for:</Text>
            <View style={styles.tenantTypeRow}>
              <TouchableOpacity
                style={[styles.tenantTypeBtn, tenantType === 'FAMILY' && styles.tenantTypeBtnSelected]}
                onPress={() => setTenantType('FAMILY')}
                activeOpacity={0.8}
              >
                <Text style={styles.tenantTypeIcon}>🏠</Text>
                <Text style={[styles.tenantTypeLabel, tenantType === 'FAMILY' && styles.tenantTypeLabelSelected]}>Family</Text>
                <Text style={styles.tenantTypeHint}>(Home & savings)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tenantTypeBtn, tenantType === 'BUSINESS' && styles.tenantTypeBtnSelected]}
                onPress={() => setTenantType('BUSINESS')}
                activeOpacity={0.8}
              >
                <Text style={styles.tenantTypeIcon}>🏢</Text>
                <Text style={[styles.tenantTypeLabel, tenantType === 'BUSINESS' && styles.tenantTypeLabelSelected]}>Business</Text>
                <Text style={styles.tenantTypeHint}>(Shop, NGO, etc.)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              placeholderTextColor="#999"
              value={formData.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          {/* Second Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Second Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your second name"
              placeholderTextColor="#999"
              value={formData.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 0712 345 678"
              placeholderTextColor="#999"
              value={formData.phoneNumber}
              onChangeText={(text) => handleInputChange('phoneNumber', text)}
              keyboardType="phone-pad"
            />
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address:</Text>
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password:</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password:</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm password"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Signup

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F5B942',
    textAlign: 'center',
  },
  placeholder: {
    width: 34, // Same width as back button to center the title
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 14,
  },
  continueButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  tenantTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tenantTypeBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tenantTypeBtnSelected: {
    borderColor: '#4285F4',
    backgroundColor: '#e8f0fe',
  },
  tenantTypeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  tenantTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  tenantTypeLabelSelected: {
    color: '#4285F4',
  },
  tenantTypeHint: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
})