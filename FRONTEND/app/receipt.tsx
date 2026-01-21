import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';

// NOTE: To enable PDF functionality, please run: 
// npx expo install expo-print expo-sharing
let Print: any;
let Sharing: any;
try {
    Print = require('expo-print');
    Sharing = require('expo-sharing');
} catch (e) {
    console.log('expo-print or expo-sharing not installed');
}

export default function ReceiptScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Mock Data based on params or default
    const receipt = {
        id: params.id || '204',
        payee: params.payee || 'Landlord',
        amount: params.amount || '500.00',
        date: params.date || 'Jan 01, 2026',
        paymentMethod: 'Cheque',
        chequeNumber: '204',
        bank: 'Bank A',
        status: 'Cleared',
        sender: 'Dad'
    };

    const generatePdf = async () => {
        if (!Print || !Sharing) {
            Alert.alert(
                'Missing Dependencies',
                'To enable PDF downloads, please run:\n\nnpx expo install expo-print expo-sharing',
                [{ text: 'OK' }]
            );
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; color: #333; padding: 20px; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .logo { font-size: 24px; font-weight: bold; color: #122f8a; margin-bottom: 5px; }
                    .sub-header { font-size: 14px; color: #666; }
                    .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase; color: #122f8a; }
                    .amount-box { background-color: #f8fafc; padding: 20px; text-align: center; border: 1px dashed #fe9900; margin-bottom: 30px; }
                    .amount-label { font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
                    .amount { font-size: 32px; font-weight: bold; color: #122f8a; }
                    .details { margin-bottom: 40px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                    .label { font-weight: bold; color: #666; }
                    .value { font-weight: bold; color: #333; }
                    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                    .status { color: #10b981; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">JIBUKS</div>
                    <div class="sub-header">Payment Receipt</div>
                </div>

                <div class="title">Receipt #${receipt.id}</div>

                <div class="amount-box">
                    <div class="amount-label">Amount Paid</div>
                    <div class="amount">KES ${receipt.amount}</div>
                </div>

                <div class="details">
                    <div class="row">
                        <span class="label">Date</span>
                        <span class="value">${receipt.date}</span>
                    </div>
                    <div class="row">
                        <span class="label">Payee</span>
                        <span class="value">${receipt.payee}</span>
                    </div>
                    <div class="row">
                        <span class="label">Paid By</span>
                        <span class="value">${receipt.sender}</span>
                    </div>
                    <div class="row">
                        <span class="label">Payment Method</span>
                        <span class="value">${receipt.paymentMethod} #${receipt.chequeNumber}</span>
                    </div>
                    <div class="row">
                        <span class="label">Bank</span>
                        <span class="value">${receipt.bank}</span>
                    </div>
                    <div class="row">
                        <span class="label">Status</span>
                        <span class="value status">${receipt.status}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#122f8a', '#0a1a5c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="close" size={24} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Receipt</Text>
                        <TouchableOpacity onPress={generatePdf} style={styles.headerAction}>
                            <Ionicons name="download-outline" size={22} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.paper}>
                    {/* Cutout circles for receipt look */}
                    <View style={styles.cutoutLeft} />
                    <View style={styles.cutoutRight} />

                    <View style={styles.logoContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="receipt-outline" size={32} color="#122f8a" />
                        </View>
                        <Text style={styles.brandName}>JIBUKS</Text>
                        <Text style={styles.receiptTitle}>Payment Receipt</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>AMOUNT PAID</Text>
                        <Text style={styles.amountValue}>KES {receipt.amount}</Text>
                        <View style={styles.statusBadge}>
                            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                            <Text style={styles.statusText}>{receipt.status}</Text>
                        </View>
                    </View>

                    <View style={styles.detailsContainer}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Receipt No.</Text>
                            <Text style={styles.value}>#{receipt.id}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Date Issued</Text>
                            <Text style={styles.value}>{receipt.date}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Payee</Text>
                            <Text style={styles.value}>{receipt.payee}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Payment Method</Text>
                            <Text style={styles.value}>{receipt.paymentMethod}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Reference</Text>
                            <Text style={styles.value}>Cheque #{receipt.chequeNumber}</Text>
                        </View>
                    </View>

                    <View style={styles.dashedDivider} />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Thank you for your business!</Text>
                        <Text style={styles.footerSubText}>Transaction ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.downloadButton} onPress={generatePdf}>
                    <LinearGradient
                        colors={['#122f8a', '#2563eb']}
                        style={styles.downloadGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="document-text-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.downloadText}>Download PDF</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Dark background behind receipt
    },
    headerContainer: {
        backgroundColor: '#122f8a',
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    headerGradient: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    headerAction: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    paper: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        position: 'relative',
        marginBottom: 24,
    },
    cutoutLeft: {
        position: 'absolute',
        top: 180,
        left: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#111827',
    },
    cutoutRight: {
        position: 'absolute',
        top: 180,
        right: -12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#111827',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#e0e7ff', // Light blue
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    brandName: {
        fontSize: 20,
        fontWeight: '900',
        color: '#122f8a',
        letterSpacing: 2,
    },
    receiptTitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 20,
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#122f8a',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#15803d',
        marginLeft: 4,
    },
    detailsContainer: {
        width: '100%',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
    },
    dashedDivider: {
        width: '100%',
        height: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
        marginBottom: 20,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    footerSubText: {
        fontSize: 10,
        color: '#94a3b8',
    },
    downloadButton: {
        width: '100%',
        shadowColor: '#122f8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    downloadGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    downloadText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
