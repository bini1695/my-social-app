import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { API_URL } from '../../constants/config';

type ProfilePost = {
  id: string;
  caption?: string | null;
  imageUrl: string;
  author?: { username?: string };
  likes?: { userId: string }[];
  comments?: { id: string }[];
};

const coverImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Posts');
  const username = user?.username ?? user?.email?.split('@')[0] ?? 'socially_user';
  const displayName = user?.name ?? username;
  const initial = (username[0] ?? 'S').toUpperCase();

  const { data: posts = [] } = useQuery<ProfilePost[]>({
    queryKey: ['posts'],
    queryFn: async () => (await api.get('/posts')).data as ProfilePost[],
    retry: false,
  });

  const profilePosts = useMemo(
    () => posts.filter((post) => !post.author?.username || post.author.username === username),
    [posts, username],
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Unable to log out:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.coverWrap}>
        <Image source={{ uri: coverImage }} style={styles.coverImage} />
        <View style={styles.coverShade} />
        <TouchableOpacity style={styles.coverAction} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.coverAction, styles.moreAction]} onPress={() => { void handleLogout(); }} accessibilityLabel="Log out">
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.profileActions}>
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              <Ionicons name="checkmark-circle" size={18} color="#6C5CE7" />
            </View>
            <Text style={styles.username}>@{username}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Edit profile', 'Profile editing is coming soon.')}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={() => Alert.alert('Settings', 'Account settings are coming soon.')} accessibilityLabel="Account settings">
              <Ionicons name="settings-outline" size={19} color="#25263A" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.bio}>Software Developer | Tech Enthusiast | Always learning ✨</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color="#707387" />
          <Text style={styles.metaText}>Ethiopia</Text>
          <Ionicons name="calendar-outline" size={14} color="#707387" />
          <Text style={styles.metaText}>Joined 2023</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}><Text style={styles.statNumber}>245</Text> Following</Text>
          <Text style={styles.stat}><Text style={styles.statNumber}>12.5K</Text> Followers</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {['Posts', 'Replies', 'Media', 'Likes'].map((tab) => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Posts' && profilePosts.length > 0 ? profilePosts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.postAvatar}><Text style={styles.postAvatarText}>{initial}</Text></View>
            <View style={styles.postIdentity}>
              <Text style={styles.postName}>{displayName} <Ionicons name="checkmark-circle" size={13} color="#6C5CE7" /></Text>
              <Text style={styles.postHandle}>@{username} · just now</Text>
            </View>
            <Ionicons name="ellipsis-horizontal" size={19} color="#7B7D8B" />
          </View>
          {!!post.caption && <Text style={styles.postCaption}>{post.caption}</Text>}
          <Image source={{ uri: post.imageUrl.replace('http://localhost:3000', API_URL) }} style={styles.postImage} />
          <View style={styles.postStats}>
            <Ionicons name="heart-outline" size={16} color="#737586" />
            <Text style={styles.postStatText}>{post.likes?.length ?? 0}</Text>
            <Ionicons name="chatbubble-outline" size={15} color="#737586" />
            <Text style={styles.postStatText}>{post.comments?.length ?? 0}</Text>
            <Ionicons name="bookmark-outline" size={16} color="#737586" style={styles.bookmark} />
          </View>
        </View>
      )) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Ionicons name="images-outline" size={24} color="#8B7EF0" /></View>
          <Text style={styles.emptyTitle}>{activeTab === 'Posts' ? 'Your story starts here' : `No ${activeTab.toLowerCase()} yet`}</Text>
          <Text style={styles.emptyText}>Share a moment with your community.</Text>
          {activeTab === 'Posts' && (
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/(tabs)/create')}>
              <Text style={styles.createButtonText}>Create a post</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7FB' },
  content: { paddingBottom: 20 },
  coverWrap: { height: 190, position: 'relative', marginBottom: 58, backgroundColor: '#26234F' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 10, 30, 0.14)' },
  coverAction: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(10, 12, 32, 0.56)', alignItems: 'center', justifyContent: 'center' },
  moreAction: { left: undefined, right: 16 },
  avatarWrap: { position: 'absolute', left: 18, bottom: -48, padding: 4, borderRadius: 52, backgroundColor: '#F7F7FB' },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  profileInfo: { paddingHorizontal: 18 },
  profileActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  nameBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { color: '#191A2A', fontSize: 19, fontWeight: '800' },
  username: { color: '#787A8B', fontSize: 12, marginTop: 2 },
  actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: '#DADBE5', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  editButtonText: { color: '#25263A', fontSize: 12, fontWeight: '700' },
  settingsButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DADBE5', alignItems: 'center', justifyContent: 'center' },
  bio: { color: '#333548', fontSize: 12, lineHeight: 18, marginBottom: 9 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  metaText: { color: '#7B7D8B', fontSize: 11, marginRight: 8 },
  statsRow: { flexDirection: 'row', gap: 17, marginBottom: 15 },
  stat: { color: '#77798A', fontSize: 12 },
  statNumber: { color: '#242537', fontWeight: '800' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#E8E8EF', backgroundColor: '#fff' },
  tab: { minWidth: 62, height: 42, alignItems: 'center', justifyContent: 'center' },
  tabText: { color: '#8A8C9A', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#6C5CE7', fontWeight: '800' },
  tabUnderline: { position: 'absolute', bottom: 0, width: 36, height: 3, borderRadius: 3, backgroundColor: '#6C5CE7' },
  postCard: { backgroundColor: '#fff', paddingHorizontal: 15, paddingTop: 14, marginBottom: 8 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E9E5FF', marginRight: 9 },
  postAvatarText: { color: '#5145CD', fontSize: 13, fontWeight: '800' },
  postIdentity: { flex: 1 },
  postName: { color: '#25263A', fontSize: 12, fontWeight: '700' },
  postHandle: { color: '#8A8C9A', fontSize: 10, marginTop: 2 },
  postCaption: { color: '#333548', fontSize: 12, lineHeight: 17, marginBottom: 9 },
  postImage: { width: '100%', height: 210, borderRadius: 11, resizeMode: 'cover' },
  postStats: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 11 },
  postStatText: { color: '#737586', fontSize: 10, marginRight: 13 },
  bookmark: { marginLeft: 'auto' },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 32, backgroundColor: '#fff' },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EFEDFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { color: '#242537', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#858797', fontSize: 11, marginTop: 5 },
  createButton: { marginTop: 14, paddingHorizontal: 17, paddingVertical: 9, borderRadius: 18, backgroundColor: '#6C5CE7' },
  createButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
