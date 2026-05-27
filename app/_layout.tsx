import { Stack } from "expo-router";
import Toast from 'react-native-toast-message';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <Toast />
        </AuthProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
