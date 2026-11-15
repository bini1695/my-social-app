import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const topics = [
  { icon: 'camera-outline' as const, label: 'Photography', color: '#A78BFA' },
  { icon: 'leaf-outline' as const, label: 'Outdoors', color: '#34D399' },
  { icon: 'musical-notes-outline' as const, label: 'Music', color: '#F472B6' },
  { icon: 'code-slash-outline' as const, label: 'Technology', color: '#60A5FA' },
  { icon: 'restaurant-outline' as const, label: 'Food', color: '#FBBF24' },
  { icon: 'airplane-outline' as const, label: 'Travel', color: '#38BDF8' },
];

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const filteredTopics = topics.filter((topic) => topic.label.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Find something that feels like you.</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={19} color="#77798B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people and interests"
          placeholderTextColor="#9294A3"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={19} color="#9294A3" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Browse interests</Text>
        <Ionicons name="sparkles-outline" size={18} color="#8B7EF0" />
      </View>
      <View style={styles.topicGrid}>
        {filteredTopics.map((topic) => (
          <TouchableOpacity key={topic.label} style={styles.topicCard}>
            <View style={[styles.topicIcon, { backgroundColor: `${topic.color}20` }]}>
              <Ionicons name={topic.icon} size={23} color={topic.color} />
            </View>
            <Text style={styles.topicLabel}>{topic.label}</Text>
            <Ionicons name="arrow-forward" size={15} color="#858797" />
          </TouchableOpacity>
        ))}
        {filteredTopics.length === 0 && <Text style={styles.emptyText}>No interests match that search.</Text>}
      </View>

      <View style={styles.featureCard}>
        <View style={styles.featureIcon}><Ionicons name="people" size={20} color="#C4B5FD" /></View>
        <Text style={styles.featureEyebrow}>COMMUNITY</Text>
        <Text style={styles.featureTitle}>Good things happen when we connect.</Text>
        <Text style={styles.featureText}>Follow creators and share the moments that bring you together.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FB' },
  content: { padding: 20, paddingTop: 22, paddingBottom: 30 },
  title: { color: '#191A2A', fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#858797', fontSize: 13, marginTop: 4, marginBottom: 18 },
  searchBox: { minHeight: 46, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECECF2' },
  searchInput: { flex: 1, color: '#242537', fontSize: 13, marginLeft: 9, paddingVertical: 9 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: '#242537', fontSize: 15, fontWeight: '700' },
  topicGrid: { gap: 9 },
  topicCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEEEF4' },
  topicIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  topicLabel: { flex: 1, color: '#343548', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#858797', fontSize: 13, paddingVertical: 16 },
  featureCard: { overflow: 'hidden', borderRadius: 19, backgroundColor: '#17152F', padding: 18, marginTop: 22 },
  featureIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#322A5A', marginBottom: 15 },
  featureEyebrow: { color: '#B9AFFF', fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  featureTitle: { color: '#fff', fontSize: 20, lineHeight: 26, fontWeight: '800', marginTop: 6 },
  featureText: { color: '#B4B1C9', fontSize: 12, lineHeight: 18, marginTop: 8 },
});
