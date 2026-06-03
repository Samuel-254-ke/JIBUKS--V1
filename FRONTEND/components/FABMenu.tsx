import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Animated, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ACTIONS = [
    {
        label: 'Add savings',
        icon: 'wallet' as const,
        color: '#F59E0B',
        bg: '#FEF3C7',
        route: '/add-savings',
    },
    {
        label: 'Transfer',
        icon: 'swap-horizontal' as const,
        color: '#3B82F6',
        bg: '#DBEAFE',
        route: '/transfer',
    },
    {
        label: 'Add Income',
        icon: 'cash' as const,
        color: '#22C55E',
        bg: '#DCFCE7',
        route: '/add-income',
    },
    {
        label: 'Add Expense',
        icon: 'cart' as const,
        color: '#EF4444',
        bg: '#FEE2E2',
        route: '/add-expense',
    },
];

export default function FABMenu() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const rotation  = useRef(new Animated.Value(0)).current;
    const backdrop  = useRef(new Animated.Value(0)).current;
    const itemAnims = useRef(ACTIONS.map(() => new Animated.Value(0))).current;

    const toggle = (forceClose = false) => {
        const next = forceClose ? false : !open;
        const toValue = next ? 1 : 0;

        Animated.parallel([
            Animated.timing(rotation, { toValue, duration: 220, useNativeDriver: true }),
            Animated.timing(backdrop,  { toValue, duration: 220, useNativeDriver: true }),
            ...itemAnims.map((anim, i) =>
                Animated.timing(anim, {
                    toValue,
                    duration: 180,
                    delay: next ? i * 55 : (ACTIONS.length - 1 - i) * 40,
                    useNativeDriver: true,
                })
            ),
        ]).start();

        setOpen(next);
    };

    const handleAction = (route: string) => {
        toggle(true);
        setTimeout(() => router.push(route as any), 250);
    };

    const rotate = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <>
            {/* ── Backdrop ── */}
            <Animated.View
                pointerEvents={open ? 'auto' : 'none'}
                style={[styles.backdrop, { opacity: backdrop }]}
            >
                <Pressable style={StyleSheet.absoluteFillObject} onPress={() => toggle(true)} />
            </Animated.View>

            {/* ── Menu container ── */}
            <View style={styles.container} pointerEvents="box-none">
                {/* Action rows — rendered bottom-to-top (last = closest to FAB) */}
                {[...ACTIONS].reverse().map((action, revIdx) => {
                    const idx = ACTIONS.length - 1 - revIdx;
                    const translateY = itemAnims[idx].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                    });
                    return (
                        <Animated.View
                            key={action.label}
                            style={[
                                styles.row,
                                {
                                    opacity: itemAnims[idx],
                                    transform: [{ translateY }],
                                },
                            ]}
                            pointerEvents={open ? 'auto' : 'none'}
                        >
                            <TouchableOpacity
                                style={styles.label}
                                onPress={() => handleAction(action.route)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.labelTxt}>{action.label}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.iconBtn, { backgroundColor: action.bg }]}
                                onPress={() => handleAction(action.route)}
                                activeOpacity={0.85}
                            >
                                <Ionicons name={action.icon} size={22} color={action.color} />
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                {/* ── FAB ── */}
                <TouchableOpacity style={styles.fab} onPress={() => toggle()} activeOpacity={0.85}>
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <Ionicons name="add" size={30} color="#ffffff" />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        zIndex: 50,
    },
    container: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        alignItems: 'flex-end',
        zIndex: 51,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 10,
    },
    label: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 4,
    },
    labelTxt: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    iconBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    fab: {
        marginTop: 14,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#fe9900',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fe9900',
        shadowOpacity: 0.45,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 8,
    },
});
