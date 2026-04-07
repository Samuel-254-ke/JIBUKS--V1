import { Alert } from 'react-native';

type LogoutFn = () => Promise<void>;
type ReplaceFn = (path: string) => void;

export const confirmAndLogout = (logout: LogoutFn, replace: ReplaceFn) => {
  Alert.alert(
    'Logout',
    'Are you sure you want to log out?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          replace('/login');
        },
      },
    ]
  );
};
