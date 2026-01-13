import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const emailOrPhone = params.emailOrPhone as string;
  const otp = params.otp as string;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both password fields');
      return false;
    }
    
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;
    
    try {
      setIsLoading(true);
      
      // TODO: Implement actual password reset via backend
      // Example API call:
      // const response = await fetch('YOUR_API_URL/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     emailOrPhone,
      //     otp,
      //     newPassword
      //   })
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || 'Failed to reset password');
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to success screen
      router.replace('/password-reset-success');
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/homepage.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header with Lock Icon */}
        <View style={styles.headerContainer}>
          <Ionicons name="lock-closed" size={40} color="#F5B942" />
          <Text style={styles.headerText}>Create New Password</Text>
        </View>

        {/* New Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter new Password:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter a new password"
              placeholderTextColor="#999"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons 
                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements Text */}
        <Text style={styles.requirementText}>Must be at least 8 characters</Text>

        {/* Reset Password Button */}
        <TouchableOpacity
          style={[
            styles.resetButton,
            (!newPassword || !confirmPassword || isLoading) && styles.resetButtonDisabled
          ]}
          onPress={handleResetPassword}
          disabled={!newPassword || !confirmPassword || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#1e3a8a" size="small" />
          ) : (
            <Text style={styles.resetButtonText}>RESET PASSWORD</Text>
          )}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 30,
    marginLeft: 2,
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#1e3a8a',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 50,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
