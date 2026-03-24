import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import apiService, { User, LoginCredentials, RegisterData, ApiError } from '../services/api';

const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
const LAST_ACTIVE_AT_KEY = 'lastActiveAt';

// Types
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Load stored auth on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Enforce 10-minute session timeout when app returns from background
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const prevAppState = appStateRef.current;

      if (prevAppState === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
        await AsyncStorage.setItem(LAST_ACTIVE_AT_KEY, Date.now().toString());
      }

      if ((prevAppState === 'inactive' || prevAppState === 'background') && nextAppState === 'active') {
        try {
          const lastActiveAtRaw = await AsyncStorage.getItem(LAST_ACTIVE_AT_KEY);

          if (lastActiveAtRaw && user) {
            const lastActiveAt = Number(lastActiveAtRaw);
            const awayDuration = Date.now() - lastActiveAt;

            if (awayDuration >= SESSION_TIMEOUT_MS) {
              await apiService.logout();
              setUser(null);
            }
          }
        } catch (appStateError) {
          console.error('Session timeout check failed:', appStateError);
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user]);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (token) {
        // Verify token is still valid by fetching user
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      // Token is invalid or expired
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.login(credentials);
      setUser(response.user);
      await AsyncStorage.setItem(LAST_ACTIVE_AT_KEY, Date.now().toString());
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.register(data);
      setUser(response.user);
      await AsyncStorage.setItem(LAST_ACTIVE_AT_KEY, Date.now().toString());
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem(LAST_ACTIVE_AT_KEY);
      setUser(null);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitializing,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
