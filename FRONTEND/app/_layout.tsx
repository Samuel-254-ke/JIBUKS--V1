import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/constants/ToastConfig';
import { useFonts } from 'expo-font';
import { 
  InriaSerif_400Regular,
  InriaSerif_400Regular_Italic,
  InriaSerif_700Bold,
  InriaSerif_700Bold_Italic
} from '@expo-google-fonts/inria-serif';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// Ignore specific warnings
LogBox.ignoreLogs([
  'ImagePicker.MediaTypeOptions',
]);

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccountsProvider } from '@/contexts/AccountsContext';

export const unstable_settings = {
  initialRouteName: 'slideshow',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    'InriaSerif-Bold': InriaSerif_700Bold,
    'InriaSerif-Regular': InriaSerif_400Regular,
    'Inter': Inter_600SemiBold,
    'Inter-Regular': Inter_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AccountsProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              animationDuration: 500, // Slightly slower for 'slow and ease' effect
            }}
          >
            <Stack.Screen name="slideshow" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="password-reset-success" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="account-type" options={{ headerShown: false }} />
            <Stack.Screen name="family-setup" options={{ headerShown: false }} />
            <Stack.Screen name="add-family-member" options={{ headerShown: false }} />
            <Stack.Screen name="invite-success" options={{ headerShown: false }} />
            <Stack.Screen name="income-sources" options={{ headerShown: false }} />
            <Stack.Screen name="spending-categories" options={{ headerShown: false }} />
            <Stack.Screen name="monthly-budgets" options={{ headerShown: false }} />
            <Stack.Screen name="family-dreams" options={{ headerShown: false }} />
            <Stack.Screen name="goal-success" options={{ headerShown: false }} />
            <Stack.Screen name="connect-mobile-money" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/business-onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/contact-information" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/financial-setup" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/tax-and-invoice" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/business-onboarding-success" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/business-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/more-business" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/index" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/sales/customers" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/sales/invoices" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/sales/cash-sale" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/sales/payments" options={{ headerShown: false }} />
            <Stack.Screen name="business-tabs/sales/credit-notes" options={{ headerShown: false }} />
            <Stack.Screen name="family-settings" options={{ headerShown: false }} />
            <Stack.Screen name="edit-member-permissions" options={{ headerShown: false }} />
            <Stack.Screen name="edit-family-profile" options={{ headerShown: false }} />
            <Stack.Screen name="manage" options={{ headerShown: false }} />
            <Stack.Screen name="accounts" options={{ headerShown: false }} />
            <Stack.Screen name="income" options={{ headerShown: false }} />
            <Stack.Screen name="add-income" options={{ headerShown: false }} />
            <Stack.Screen name="expenses" options={{ headerShown: false }} />
            <Stack.Screen name="add-expense" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
          <Toast config={toastConfig} visibilityTime={2000} />
        </ThemeProvider>
      </AccountsProvider>
    </AuthProvider>
  );
}
