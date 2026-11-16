import 'react-native-gesture-handler'; // MUST BE THE FIRST LINE
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { token, isInitializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!token && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitializing, token, segments]);

  return (
    <View style={styles.root}>
      <View style={styles.appViewport}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)/index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/register" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
      {isInitializing && (
        <View style={styles.loading}>
          <View style={styles.logoMark}><Text style={styles.logoLetter}>S</Text></View>
          <Text style={styles.brand}>Socially</Text>
          <ActivityIndicator color="#A78BFA" />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: '#070817' },
  appViewport: { flex: 1, width: '100%', maxWidth: 480 },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0B1E',
  },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    marginBottom: 12,
  },
  logoLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  brand: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 20 },
});