import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const MENU_ITEMS: { id: string; label: string; icon: string; route?: string }[] = [
    { id: '1', label: 'My Business', icon: 'stats-chart-outline', route: '/business-tabs/business-dashboard' },
    { id: '2', label: 'Bank & Money', icon: 'business-outline', route: '/banking' },
    { id: '3', label: 'Employees', icon: 'people-outline' },
    { id: '4', label: 'Stock', icon: 'cube-outline', route: '/inventory' },
    { id: '5', label: 'Journal Entry', icon: 'book-outline' },
    { id: '6', label: 'Community', icon: 'people-circle-outline', route: '/(tabs)/community' },
    { id: '7', label: 'Help & Support', icon: 'help-circle-outline' },
    { id: '8', label: 'Subscription', icon: 'card-outline' },
    { id: '9', label: 'Settings', icon: 'settings-outline', route: '/family-settings' },
];

export default function MoreBusinessScreen() {
    const router = useRouter();

    const onMenuItemPress = (item: typeof MENU_ITEMS[0]) => {
        if (item.route) {
            router.push(item.route as any);
        }
    };

    const renderMenuItem = (item: typeof MENU_ITEMS[0], index: number) => (
        <React.Fragment key={item.id}>
            <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => onMenuItemPress(item)}
            >
                <View style={styles.menuLeft}>
                    <View style={styles.iconCircle}>
                        <Ionicons name={item.icon as any} size={20} color="#f59e0b" />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
            {index < MENU_ITEMS.length - 1 && <View style={styles.separator} />}
        </React.Fragment>
    );

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Blue Header Section */}
            <LinearGradient
                colors={['#1e3a8a', '#2563eb']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#f59e0b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MORE</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.card}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Menu Card Inner */}
                <View style={styles.menuListInner}>
                    {MENU_ITEMS.map((item, index) => renderMenuItem(item, index))}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Powered by Apbc</Text>
                    <View style={styles.footerIcon}>
                        <Text style={styles.footerIconText}>A</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e3a8a',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f59e0b',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
        letterSpacing: 1,
    },
    placeholder: {
        width: 36,
    },
    card: {
        flex: 1,
        backgroundColor: '#ffffff',
        marginTop: -20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    menuListInner: {
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        marginRight: 8,
    },
    footerIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#1e3a8a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerIconText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
