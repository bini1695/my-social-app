import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.brandGroup}>
          <View style={styles.brandMark}>
            <Ionicons name="chatbubble-ellipses" size={40} color="#fff" />
            <View style={styles.brandSpark}><Ionicons name="sparkles" size={15} color="#A78BFA" /></View>
          </View>
          <Text style={styles.brand}>Socially</Text>
          <Text style={styles.tagline}>Connect · Share · Grow</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>YOUR PEOPLE, YOUR MOMENTS</Text>
          <Text style={styles.title}>A little closer,{'\n'}every day.</Text>
          <Text style={styles.description}>
            Share what matters and find your people in one welcoming space.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={19} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
          >
            <Text style={styles.signInText}>Already have an account? <Text style={styles.signInHighlight}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090B20', overflow: 'hidden' },
  glowTop: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -190,
    right: -120,
    backgroundColor: '#4C36A8',
    opacity: 0.55,
  },
  glowBottom: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: -180,
    left: -100,
    backgroundColor: '#6C5CE7',
    opacity: 0.25,
  },
  content: { flexGrow: 1, width: '100%', maxWidth: 430, alignSelf: 'center', justifyContent: 'space-between', paddingHorizontal: 30, paddingTop: 38, paddingBottom: 26 },
  brandGroup: { alignItems: 'center' },
  brandMark: {
    alignSelf: 'center',
    width: 78,
    height: 78,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  brandSpark: { position: 'absolute', top: 10, right: 9 },
  brand: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: 15 },
  tagline: { color: '#C4B5FD', fontSize: 13, textAlign: 'center', marginTop: 2 },
  hero: { marginTop: 38 },
  eyebrow: { color: '#A78BFA', letterSpacing: 2.2, fontSize: 10, fontWeight: '700', marginBottom: 14 },
  title: { color: '#fff', fontSize: 42, lineHeight: 48, fontWeight: '800', letterSpacing: -1.2 },
  description: { color: '#B9BCD0', fontSize: 15, lineHeight: 23, marginTop: 16, maxWidth: 310 },
  actions: { gap: 16 },
  primaryButton: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 7,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signInButton: { alignItems: 'center', paddingVertical: 10 },
  signInText: { color: '#B9BCD0', fontSize: 14 },
  signInHighlight: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
});
