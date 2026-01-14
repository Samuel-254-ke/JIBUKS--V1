/**
 * Account Mapping Helper
 * Maps transaction types and categories to appropriate debit/credit accounts
 */

import { TransactionType } from '@/services/api';

// Category to Account Code mapping
const categoryToAccountMap: Record<string, string> = {
  // Income Categories
  'Salary': '4000',
  'Business': '4010',
  'Investment': '4020',
  'Gift': '4030',
  
  // Expense Categories
  'Food': '5000',
  'Transport': '5010',
  'Housing': '5020',
  'Utilities': '5030',
  'Healthcare': '5040',
  'Education': '5050',
  'Entertainment': '5060',
  'Shopping': '5070',
};

/**
 * Get default debit account for a transaction
 * @param transactionType - INCOME or EXPENSE
 * @param category - Category name
 * @returns Account ID for debit entry
 */
export function getDefaultDebitAccount(
  transactionType: TransactionType,
  category: string
): string {
  if (transactionType === 'INCOME') {
    // For INCOME: Debit = Asset account (will be selected by user)
    // This function returns a default, but user selection overrides it
    return 'acct-1000'; // Default to Cash on Hand
  } else if (transactionType === 'EXPENSE') {
    // For EXPENSE: Debit = Expense account based on category
    const accountCode = categoryToAccountMap[category];
    if (accountCode && accountCode.startsWith('5')) {
      return `acct-${accountCode}`;
    }
    return 'acct-5000'; // Default to Food & Groceries
  }
  
  return 'acct-1000'; // Fallback to Cash on Hand
}

/**
 * Get default credit account for a transaction
 * @param transactionType - INCOME or EXPENSE
 * @param category - Category name
 * @returns Account ID for credit entry
 */
export function getDefaultCreditAccount(
  transactionType: TransactionType,
  category: string
): string {
  if (transactionType === 'INCOME') {
    // For INCOME: Credit = Income account based on category
    const accountCode = categoryToAccountMap[category];
    if (accountCode && accountCode.startsWith('4')) {
      return `acct-${accountCode}`;
    }
    return 'acct-4000'; // Default to Salary Income
  } else if (transactionType === 'EXPENSE') {
    // For EXPENSE: Credit = Asset account (will be selected by user)
    // This function returns a default, but user selection overrides it
    return 'acct-1000'; // Default to Cash on Hand
  }
  
  return 'acct-1000'; // Fallback to Cash on Hand
}

/**
 * Get account name by ID
 * @param accountId - Account ID
 * @returns Account name or empty string
 */
export function getAccountName(accountId: string): string {
  const accountMap: Record<string, string> = {
    'acct-1000': 'Cash on Hand',
    'acct-1010': 'Checking Account',
    'acct-1020': 'Savings Account',
    'acct-1030': 'M-Pesa Wallet',
    'acct-2000': 'Credit Card',
    'acct-2010': 'Loans Payable',
    'acct-3000': 'Family Equity',
    'acct-4000': 'Salary Income',
    'acct-4010': 'Business Income',
    'acct-4020': 'Investment Income',
    'acct-4030': 'Gift Income',
    'acct-5000': 'Food & Groceries',
    'acct-5010': 'Transport',
    'acct-5020': 'Housing/Rent',
    'acct-5030': 'Utilities',
    'acct-5040': 'Healthcare',
    'acct-5050': 'Education',
    'acct-5060': 'Entertainment',
    'acct-5070': 'Shopping',
  };
  
  return accountMap[accountId] || '';
}
