import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // @ts-ignore - Expo injects these at build time
  return Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
};

const LOCAL_IP = getEnvVar('EXPO_PUBLIC_LOCAL_IP', '192.168.1.100');
const API_PORT = getEnvVar('EXPO_PUBLIC_API_PORT', '4400');

// Build API base URL based on platform
const getBaseUrl = (): string => {
  // If full URL is provided, use it
  const fullUrl = getEnvVar('EXPO_PUBLIC_API_URL');
  if (fullUrl) {
    return fullUrl;
  }

  // Otherwise, construct URL based on platform
  if (Platform.OS === 'android') {
    // Check if running on emulator or physical device
    // Emulator: use 10.0.2.2
    // Physical device: use local network IP
    const isEmulator = Constants.isDevice === false;
    const host = isEmulator ? '10.0.2.2' : LOCAL_IP;
    return `http://${host}:${API_PORT}/api`;
  }

  if (Platform.OS === 'ios') {
    // iOS simulator uses localhost
    // Physical device uses local network IP
    const isSimulator = Constants.isDevice === false;
    const host = isSimulator ? 'localhost' : LOCAL_IP;
    return `http://${host}:${API_PORT}/api`;
  }

  // Web uses localhost
  return `http://localhost:${API_PORT}/api`;
};

const API_BASE_URL = getBaseUrl();

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);
console.log('🔧 Device:', Constants.isDevice ? 'Physical' : 'Simulator/Emulator');

// TypeScript interfaces
export interface User {
  id: number;
  email: string;
  name: string | null;
  tenantId: number | null;
  role?: 'OWNER' | 'ADMIN' | 'PARENT' | 'CHILD' | 'MEMBER';
  avatarUrl?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color?: string;
  icon?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type?: string;
  isActive?: boolean;
}

export interface Account {
  id: string;
  name: string;
  code?: string;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
  currency?: string;
  parentAccountId?: string | null;
  balance?: number;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  paymentMethod?: string;
  date: string;
  user?: { id: string; name: string };
  debitAccountId?: string;
  creditAccountId?: string;
  accountId?: string;
  notes?: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpenses: number;
  net: number;
}

export interface ApiError {
  error: string;
}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// API Service
class ApiService {
  private baseUrl: string;
  private mockCategories: Category[] = [
    { id: 'cat-exp-food', name: 'Food', type: 'expense', color: '#FF6B6B' },
    { id: 'cat-exp-transport', name: 'Transport', type: 'expense', color: '#4ECDC4' },
    { id: 'cat-exp-housing', name: 'Housing', type: 'expense', color: '#45B7D1' },
    { id: 'cat-exp-utilities', name: 'Utilities', type: 'expense', color: '#FFA07A' },
    { id: 'cat-exp-entertainment', name: 'Entertainment', type: 'expense', color: '#98D8C8' },
    { id: 'cat-exp-health', name: 'Healthcare', type: 'expense', color: '#F7DC6F' },
    { id: 'cat-exp-education', name: 'Education', type: 'expense', color: '#BB8FCE' },
    { id: 'cat-exp-shopping', name: 'Shopping', type: 'expense', color: '#85C1E2' },
    { id: 'cat-inc-salary', name: 'Salary', type: 'income', color: '#52C41A' },
    { id: 'cat-inc-business', name: 'Business', type: 'income', color: '#1890FF' },
    { id: 'cat-inc-investment', name: 'Investment', type: 'income', color: '#722ED1' },
    { id: 'cat-inc-gift', name: 'Gift', type: 'income', color: '#EB2F96' },
  ];

  private mockPaymentMethods: PaymentMethod[] = [
    { id: 'pm-cash', name: 'Cash', type: 'cash', isActive: true },
    { id: 'pm-mpesa', name: 'M-Pesa', type: 'mobile-money', isActive: true },
    { id: 'pm-card', name: 'Bank Card', type: 'card', isActive: true },
    { id: 'pm-transfer', name: 'Bank Transfer', type: 'transfer', isActive: true },
  ];

  private mockAccounts: Account[] = [
    // Assets
    { id: 'acct-1000', name: 'Cash on Hand', code: '1000', type: 'ASSET', currency: 'KES', balance: 5000, isDefault: true },
    { id: 'acct-1010', name: 'Checking Account', code: '1010', type: 'ASSET', currency: 'KES', balance: 15000 },
    { id: 'acct-1020', name: 'Savings Account', code: '1020', type: 'ASSET', currency: 'KES', balance: 50000 },
    { id: 'acct-1030', name: 'M-Pesa Wallet', code: '1030', type: 'ASSET', currency: 'KES', balance: 8500 },
    // Liabilities
    { id: 'acct-2000', name: 'Credit Card', code: '2000', type: 'LIABILITY', currency: 'KES', balance: 0 },
    { id: 'acct-2010', name: 'Loans Payable', code: '2010', type: 'LIABILITY', currency: 'KES', balance: 0 },
    // Equity
    { id: 'acct-3000', name: 'Family Equity', code: '3000', type: 'EQUITY', currency: 'KES', balance: 0 },
    // Income
    { id: 'acct-4000', name: 'Salary Income', code: '4000', type: 'INCOME', currency: 'KES', balance: 0 },
    { id: 'acct-4010', name: 'Business Income', code: '4010', type: 'INCOME', currency: 'KES', balance: 0 },
    { id: 'acct-4020', name: 'Investment Income', code: '4020', type: 'INCOME', currency: 'KES', balance: 0 },
    { id: 'acct-4030', name: 'Gift Income', code: '4030', type: 'INCOME', currency: 'KES', balance: 0 },
    // Expenses
    { id: 'acct-5000', name: 'Food & Groceries', code: '5000', type: 'EXPENSE', currency: 'KES', balance: 0 },
    { id: 'acct-5010', name: 'Transport', code: '5010', type: 'EXPENSE', currency: 'KES', balance: 0 },
    { id: 'acct-5020', name: 'Housing/Rent', code: '5020', type: 'EXPENSE', currency: 'KES', balance: 0 },
    { id: 'acct-5030', name: 'Utilities', code: '5030', type: 'EXPENSE', currency: 'KES', balance: 0 },
    { id: 'acct-5040', name: 'Healthcare', code: '5040', type: 'EXPENSE', currency: 'KES', balance: 0 },
    { id: 'acct-5050', name: 'Education', code: '5050', type: 'EXPENSE', currency: 'KES', balance: 0 },
    { id: 'acct-5060', name: 'Entertainment', code: '5060', type: 'EXPENSE', currency: 'KES', balance: 0 },
    { id: 'acct-5070', name: 'Shopping', code: '5070', type: 'EXPENSE', currency: 'KES', balance: 0 },
  ];

  private mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      type: 'EXPENSE',
      amount: 1250,
      category: 'Food',
      description: 'Groceries',
      paymentMethod: 'Cash',
      date: new Date().toISOString(),
      debitAccountId: 'acct-expenses',
      creditAccountId: 'acct-cash',
      user: { id: 'u1', name: 'You' },
    },
    {
      id: 'tx-2',
      type: 'INCOME',
      amount: 5000,
      category: 'Salary',
      description: 'Weekly pay',
      paymentMethod: 'Bank Transfer',
      date: new Date(Date.now() - 86400000).toISOString(),
      debitAccountId: 'acct-checking',
      creditAccountId: 'acct-revenue',
      user: { id: 'u1', name: 'You' },
    },
  ];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private generateId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const authHeaders = await getAuthHeaders();

    // Merge headers: Auth < explicit options
    // We construct a temporary headers object
    const headers: any = {
      ...authHeaders,
      ...options.headers,
    };

    // If Content-Type is not set, and body is a string (likely JSON), default it.
    // If body is FormData (object), do NOT set Content-Type, let fetch handle it (boundary).
    if (!headers['Content-Type'] && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    try {
      console.log(`📡 ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          error: data.error || 'An error occurred',
        } as ApiError;
      }

      return data as T;
    } catch (error: any) {
      // Don't log expected errors (user states that are normal)
      const expectedErrors = [
        'User is not part of any family',
        'Not part of a family',
        'No family found',
      ];

      const isExpectedError = expectedErrors.some(msg =>
        error.error && error.error.includes(msg)
      );

      if (!isExpectedError) {
        console.error('❌ API Error:', error);
      }

      if (error.error) {
        throw error as ApiError;
      }
      throw {
        error: error.message || 'Network error. Please check your connection.',
      } as ApiError;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.accessToken) {
      await AsyncStorage.setItem('authToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.accessToken) {
      await AsyncStorage.setItem('authToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'GET',
    });
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    const response = await this.request<{ accessToken: string }>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.accessToken) {
      await AsyncStorage.setItem('authToken', response.accessToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
    }
  }

  async forgotPassword(email: string, phone?: string, deliveryMethod: 'email' | 'sms' = 'email'): Promise<any> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, phone, deliveryMethod }),
    });
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<any> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }

  // Family endpoints
  async getFamily(): Promise<any> {
    return this.request('/family');
  }

  async updateFamily(data: { name?: string; metadata?: any }): Promise<any> {
    return this.request('/family', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async addFamilyMember(data: any): Promise<any> {
    const isFormData = data instanceof FormData;

    return this.request('/family/members', {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' }, // Fetch handles Content-Type for FormData
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async createGoal(data: any): Promise<any> {
    return this.request('/family/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGoals(): Promise<any> {
    return this.request('/family/goals');
  }

  async saveBudgets(budgets: { category: string; amount: string }[]): Promise<any> {
    return this.request('/family/budgets', {
      method: 'POST',
      body: JSON.stringify({ budgets }),
    });
  }

  async getBudgets(): Promise<any> {
    return this.request('/family/budgets');
  }

  async createBudget(budget: { category: string; amount: number; period?: string }): Promise<any> {
    try {
      return await this.request('/family/budgets', {
        method: 'POST',
        body: JSON.stringify(budget),
      });
    } catch (error) {
      console.warn('createBudget falling back to mock data');
      return {
        id: this.generateId('budget'),
        ...budget,
        spent: 0,
      };
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await this.request<Category[]>('/categories');
    } catch (error) {
      console.warn('getCategories falling back to mock categories');
      return this.mockCategories;
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      return await this.request<PaymentMethod[]>('/payment-methods');
    } catch (error) {
      console.warn('getPaymentMethods falling back to mock payment methods');
      return this.mockPaymentMethods;
    }
  }

  async getTransactions(params: { type?: TransactionType; limit?: number } = {}): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.limit) query.append('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';

    try {
      return await this.request<Transaction[]>(`/transactions${suffix}`);
    } catch (error) {
      console.warn('getTransactions falling back to mock transactions');
      const filtered = params.type
        ? this.mockTransactions.filter(t => t.type === params.type)
        : this.mockTransactions;
      return filtered.slice(0, params.limit || filtered.length);
    }
  }

  async getTransactionStats(): Promise<TransactionStats> {
    try {
      return await this.request<TransactionStats>('/transactions/stats');
    } catch (error) {
      console.warn('getTransactionStats falling back to mock stats');
      const income = this.mockTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = this.mockTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        totalIncome: income,
        totalExpenses: expenses,
        net: income - expenses,
      };
    }
  }

  async createTransaction(payload: Partial<Transaction> & { type: TransactionType; amount: number; category: string; date: string }): Promise<Transaction> {
    const body: any = {
      ...payload,
      debitAccountId: payload.debitAccountId,
      creditAccountId: payload.creditAccountId,
      accountId: payload.accountId,
    };

    try {
      return await this.request<Transaction>('/transactions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.warn('createTransaction falling back to mock transaction');
      const tx: Transaction = {
        id: this.generateId('tx'),
        type: payload.type,
        amount: payload.amount,
        category: payload.category,
        description: payload.description,
        paymentMethod: payload.paymentMethod,
        date: payload.date,
        notes: payload.notes,
        debitAccountId: payload.debitAccountId,
        creditAccountId: payload.creditAccountId,
        accountId: payload.accountId,
        user: payload.user,
      };
      this.mockTransactions.unshift(tx);
      return tx;
    }
  }

  // Family Settings APIs
  async getFamilySettings(): Promise<any> {
    return this.request('/family/settings');
  }

  async getDashboardStats(): Promise<any> {
    return this.request('/family/dashboard');
  }

  async getDashboard(): Promise<any> {
    try {
      return await this.request('/family/dashboard');
    } catch (error) {
      console.warn('getDashboard falling back to mock data');
      // Return mock dashboard data
      return {
        familyMembers: [
          { id: '1', name: 'You', role: 'OWNER' }
        ],
        goals: [],
        budgets: [],
        categorySpending: [],
        recentTransactions: this.mockTransactions.slice(0, 5),
        summary: {
          totalIncome: this.mockTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0),
          totalExpenses: this.mockTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0),
          balance: 0
        }
      };
    }
  }

  async getMemberDetails(memberId: string): Promise<any> {
    return this.request(`/family/members/${memberId}`);
  }

  async updateMemberPermissions(memberId: string, permissions: any): Promise<any> {
    return this.request(`/family/members/${memberId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  async updateMemberRole(memberId: string, role: string): Promise<any> {
    return this.request(`/family/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async removeFamilyMember(memberId: string): Promise<any> {
    return this.request(`/family/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async leaveFamily(): Promise<any> {
    return this.request('/family/leave', {
      method: 'DELETE',
    });
  }

  async deleteFamily(): Promise<any> {
    return this.request('/family', {
      method: 'DELETE',
    });
  }

  async updateFamilyProfile(name: string, avatarUri?: string | null): Promise<any> {
    const formData = new FormData();
    formData.append('name', name);

    if (avatarUri && !avatarUri.startsWith('http')) {
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: avatarUri,
        name: filename,
        type,
      } as any);
    }

    return this.request('/family/profile', {
      method: 'PUT',
      body: formData,
    });
  }

  async listAccounts(): Promise<Account[]> {
    try {
      return await this.request<Account[]>('/accounts');
    } catch (error) {
      // Backend not ready - return mock accounts
      console.warn('⚠️ Accounts API not available, returning mock accounts');
      return this.mockAccounts;
    }
  }

  getImageUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    // Remove /api suffix to get root URL
    const rootUrl = this.baseUrl.endsWith('/api')
      ? this.baseUrl.slice(0, -4)
      : this.baseUrl;
    return `${rootUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;