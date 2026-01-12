import React, { useState, useRef, useEffect } from 'react';
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

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const emailOrPhone = params.emailOrPhone as string;
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null)
  ];

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mask email/phone for display
  const maskContact = (contact: string) => {
    if (!contact) return '';
    if (contact.includes('@')) {
      // Email: show first 3 chars and domain
      const parts = contact.split('@');
      return `${parts[0].substring(0, 3)}***@${parts[1]}`;
    } else {
      // Phone: show first 3 and last 3 digits
      if (contact.length <= 6) return contact;
      const first3 = contact.substring(0, 3);
      const last3 = contact.substring(contact.length - 3);
      return `${first3} *** ${last3}`;
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-advance to next box
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    // Validation
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      Alert.alert('Error', 'Please enter all 4 digits');
      return;
    }
    
    if (timeRemaining <= 0) {
      Alert.alert('Error', 'OTP has expired. Please request a new code.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // TODO: Implement actual OTP verification via backend
      // Example API call:
      // const response = await fetch('YOUR_API_URL/auth/verify-reset-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     emailOrPhone,
      //     otp: otpCode 
      //   })
      // });
      // 
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || 'Invalid OTP');
      // }
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to reset password screen
      router.push({
        pathname: '/reset-password',
        params: { emailOrPhone, otp: otpCode }
      });
      
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = timeRemaining <= 0;
  const canVerify = otp.every(digit => digit !== '') && !isExpired && !isLoading;

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
          <Text style={styles.headerText}>Forgot Password?</Text>
        </View>

        {/* Instructions */}
        <Text style={styles.instructionText}>Enter the OTP sent to:</Text>

        {/* Masked Phone/Email Display */}
        <View style={styles.contactContainer}>
          <Ionicons name="call" size={20} color="#333" style={styles.phoneIcon} />
          <Text style={styles.contactText}>{maskContact(emailOrPhone)}</Text>
        </View>

        {/* Additional Info Text */}
        <Text style={styles.infoText}>i...</Text>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[
                styles.otpBox,
                digit && styles.otpBoxFilled
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isExpired && !isLoading}
            />
          ))}
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, isExpired && styles.timerExpired]}>
            {isExpired ? 'Code expired ⏳' : `Code expires in ⏳ ${formatTime(timeRemaining)}`}
          </Text>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            !canVerify && styles.verifyButtonDisabled
          ]}
          onPress={handleVerifyOTP}
          disabled={!canVerify}
        >
          {isLoading ? (
            <ActivityIndicator color="#2563EB" size="small" />
          ) : (
            <Text style={[
              styles.verifyButtonText,
              !canVerify && styles.verifyButtonTextDisabled
            ]}>
              VERIFY OTP
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend Option */}
        <TouchableOpacity 
          style={styles.resendContainer}
          onPress={() => router.back()}
        >
          <Text style={styles.resendText}>
            Didn't receive code? <Text style={styles.resendLink}>Go back</Text>
          </Text>
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
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  phoneIcon: {
    marginRight: 8,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  otpBox: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#F5B942',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff',
  },
  otpBoxFilled: {
    borderColor: '#F5B942',
    backgroundColor: '#FFF9E6',
  },
  timerContainer: {
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  timerExpired: {
    color: '#EF4444',
    fontWeight: '600',
  },
  verifyButton: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    borderColor: '#D1D5DB',
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButtonTextDisabled: {
    color: '#9CA3AF',
  },
  resendContainer: {
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  resendLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
