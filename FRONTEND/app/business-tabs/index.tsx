import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '@/services/api';

const ONBOARDING_KEY = 'businessOnboardingComplete';

/**
 * Entry point for business: new users go to onboarding first,
 * returning users (who completed setup) go to dashboard.
 *
 * Onboarding status is tracked server-side (Tenant.metadata.onboardingCompleted)
 * so it's consistent across devices/reinstalls; AsyncStorage is only a fast
 * local cache to skip the round-trip on the common case.
 */
export default function BusinessTabsIndex() {
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        async function decideRoute() {
            try {
                const cached = await AsyncStorage.getItem(ONBOARDING_KEY);
                if (cached === 'true') {
                    if (mounted) router.replace('/business-tabs/business-dashboard');
                    return;
                }

                const status = await apiService.getBusinessOnboardingStatus();
                if (!mounted) return;

                if (status.isCompleted) {
                    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
                    router.replace('/business-tabs/business-dashboard');
                } else {
                    router.replace('/business-tabs/business-onboarding');
                }
            } catch {
                if (mounted) {
                    router.replace('/business-tabs/business-onboarding');
                }
            }
        }

        decideRoute();
        return () => { mounted = false; };
    }, [router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
