import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Your conversations, all in one place.</Text>
        </View>
        <TouchableOpacity style={styles.composeButton} accessibilityLabel="Start a message">
          <Ionicons name="create-outline" size={21} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="chatbubbles-outline" size={30} color="#8B7EF0" />
        </View>
        <Text style={styles.emptyTitle}>Say hello</Text>
        <Text style={styles.emptyText}>When you start a conversation, it will show up here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FB', padding: 20, paddingTop: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#191A2A', fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#858797', fontSize: 13, marginTop: 4 },
  composeButton: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6C5CE7' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFEDFF', marginBottom: 16 },
  emptyTitle: { color: '#242537', fontSize: 18, fontWeight: '800' },
  emptyText: { color: '#858797', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 7 },
});
