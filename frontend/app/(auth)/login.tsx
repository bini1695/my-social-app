import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      await login(response.data.access_token, response.data.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Could not sign in', error.response?.data?.message || error.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.glow} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#E5E7EB" />
        </TouchableOpacity>

        <View style={styles.logoMark}>
          <Ionicons name="chatbubble-ellipses" size={30} color="#fff" />
        </View>
        <Text style={styles.brand}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to pick up where you left off.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#8588A0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#8588A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerText}>New to Socially? <Text style={styles.registerHighlight}>Create an account</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090B20', overflow: 'hidden' },
  glow: { position: 'absolute', width: 350, height: 350, borderRadius: 175, top: -220, right: -120, backgroundColor: '#5A43C4', opacity: 0.4 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 28 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#171A35', marginBottom: 38 },
  logoMark: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6C5CE7', marginBottom: 20 },
  brand: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#A9ADC3', fontSize: 15, marginTop: 8, marginBottom: 34 },
  form: { gap: 10 },
  label: { color: '#B9BCD0', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  input: { height: 54, borderRadius: 14, paddingHorizontal: 16, color: '#fff', backgroundColor: '#171A35', borderWidth: 1, borderColor: '#292C4A', fontSize: 15 },
  button: { minHeight: 54, borderRadius: 16, marginTop: 14, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  registerLink: { alignItems: 'center', paddingVertical: 18 },
  registerText: { color: '#A9ADC3', fontSize: 13 },
  registerHighlight: { color: '#C4B5FD', fontWeight: '700' },
});
