import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * B-010: Customer list & CRUD
 * Redirects to the main customers screen so we reuse one implementation.
 */
export default function SalesCustomersScreen() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/customers');
    }, [router]);

    return null;
}
