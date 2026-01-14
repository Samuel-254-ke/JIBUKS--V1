import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import apiService, { Account } from '@/services/api';

interface AccountsContextValue {
  accounts: Account[];
  defaultAccount: Account | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue | undefined>(undefined);

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.listAccounts();
      setAccounts(data || []);
    } catch (err: any) {
      // Silently fail - accounts are optional for now
      console.warn('Accounts not available:', err?.error || err);
      setError(null); // Don't show error to user
      setAccounts([]); // Empty accounts is fine
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const value = useMemo<AccountsContextValue>(
    () => ({
      accounts,
      defaultAccount: accounts.find(a => a.isDefault) || accounts[0] || null,
      loading,
      error,
      refresh: loadAccounts,
    }),
    [accounts, loading, error]
  );

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
};

export const useAccounts = () => {
  const ctx = useContext(AccountsContext);
  if (!ctx) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return ctx;
};

export default AccountsContext;
