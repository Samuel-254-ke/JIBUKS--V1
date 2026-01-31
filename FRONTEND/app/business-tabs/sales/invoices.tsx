import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * B-011, B-012: Invoice management
 * Redirects to the main invoices screen.
 */
export default function SalesInvoicesScreen() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/invoices');
    }, [router]);

    return null;
}
