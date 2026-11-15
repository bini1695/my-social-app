import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !password) {
      Alert.alert('Missing details', 'Complete all fields to create your account.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', {
        email: email.trim(),
        username: username.trim(),
        password,
      });
      await login(response.data.access_token, response.data.user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Could not create account', error.response?.data?.message || error.message || 'Please try again.');
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
        <Text style={styles.brand}>Join Socially</Text>
        <Text style={styles.subtitle}>Make a little more room for connection.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#8588A0"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
          />
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
            placeholder="Create a password"
            placeholderTextColor="#8588A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.registerText}>Already a member? <Text style={styles.registerHighlight}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090B20', overflow: 'hidden' },
  glow: { position: 'absolute', width: 350, height: 350, borderRadius: 175, top: -220, right: -120, backgroundColor: '#5A43C4', opacity: 0.4 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#171A35', marginBottom: 24 },
  logoMark: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6C5CE7', marginBottom: 16 },
  brand: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#A9ADC3', fontSize: 14, marginTop: 7, marginBottom: 18 },
  form: { gap: 8 },
  label: { color: '#B9BCD0', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 5 },
  input: { height: 50, borderRadius: 14, paddingHorizontal: 16, color: '#fff', backgroundColor: '#171A35', borderWidth: 1, borderColor: '#292C4A', fontSize: 15 },
  button: { minHeight: 52, borderRadius: 16, marginTop: 12, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  registerLink: { alignItems: 'center', paddingVertical: 14 },
  registerText: { color: '#A9ADC3', fontSize: 13 },
  registerHighlight: { color: '#C4B5FD', fontWeight: '700' },
});
