import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Pressable, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, RefreshControl, Share, Alert, ScrollView, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { storage } from '../../services/storage';
import api from '../../services/api';
import { API_URL } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';

type FeedPost = {
  id: string;
  caption?: string | null;
  imageUrl: string;
  createdAt: string;
  author?: { username?: string; avatarUrl?: string | null };
  likes?: { userId: string }[];
  comments?: { id: string; text: string; author?: { username?: string } }[];
};

const resolveImageUrl = (url: string) => url.replace('http://localhost:3000', API_URL);

const formatPostTime = (date: string) => {
  const timestamp = Date.parse(date);
  if (Number.isNaN(timestamp)) return '';

  const minutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function FeedScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'recent' | 'popular'>('recent');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [savedPostsLoaded, setSavedPostsLoaded] = useState(false);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const lastImageTap = useRef<{ postId: string; timestamp: number } | null>(null);
  const savedPostsKey = `savedPosts:${user?.id ?? 'guest'}`;

  useEffect(() => {
    let isMounted = true;

    storage.getItem(savedPostsKey)
      .then((savedPosts) => {
        if (!isMounted) return;
        if (savedPosts) {
          const parsed: unknown = JSON.parse(savedPosts);
          if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
            throw new Error('Saved posts data has an invalid format.');
          }
          setSavedPostIds(parsed);
        }
        setSavedPostsLoaded(true);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        console.error('Unable to load saved posts:', error);
        Alert.alert('Saved posts unavailable', 'Your saved posts could not be loaded.');
        setSavedPostsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [savedPostsKey]);

  const { data: posts = [], isLoading, isError, isRefetching, refetch } = useQuery<FeedPost[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data as FeedPost[];
    },
    retry: false,
  });

  const creators = useMemo(() => {
    const authors = new Map<string, NonNullable<FeedPost['author']>>();
    posts.forEach((post) => {
      if (post.author?.username && !authors.has(post.author.username)) {
        authors.set(post.author.username, post.author);
      }
    });
    return [...authors.values()].slice(0, 12);
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    const filteredPosts = posts.filter((post) =>
      (!showSavedOnly || savedPostIds.includes(post.id)) &&
      (!selectedAuthor || post.author?.username === selectedAuthor) &&
      `${post.caption ?? ''} ${post.author?.username ?? ''}`.toLocaleLowerCase().includes(query),
    );

    return filteredPosts.sort((a, b) => {
      if (sortMode === 'popular') {
        const likeDifference = (b.likes?.length ?? 0) - (a.likes?.length ?? 0);
        if (likeDifference !== 0) return likeDifference;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, searchText, selectedAuthor, sortMode, showSavedOnly, savedPostIds]);

  const toggleSavedPost = async (postId: string) => {
    if (savingPostId) return;
    setSavingPostId(postId);
    const nextSavedPostIds = savedPostIds.includes(postId)
      ? savedPostIds.filter((id) => id !== postId)
      : [...savedPostIds, postId];

    try {
      await storage.setItem(savedPostsKey, JSON.stringify(nextSavedPostIds));
      setSavedPostIds(nextSavedPostIds);
    } catch (error) {
      console.error('Unable to update saved posts:', error);
      Alert.alert('Could not save post', 'Please try again.');
    } finally {
      setSavingPostId(null);
    }
  };

  const sharePost = async (post: FeedPost) => {
    const imageUrl = post.imageUrl.replace('http://localhost:3000', API_URL);
    const caption = post.caption?.trim();
    const message = [`Post by @${post.author?.username ?? 'user'}`, caption, imageUrl]
      .filter(Boolean)
      .join('\n\n');

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Unable to share post:', error);
      Alert.alert('Could not share post', 'Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDrawerVisible(false);
      router.replace('/(auth)');
    } catch (error) {
      console.error('Unable to log out:', error);
      Alert.alert('Could not log out', 'Please try again.');
    }
  };

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string, isLiked: boolean }) => {
      if (isLiked) await api.delete(`/posts/${postId}/like`);
      else await api.post(`/posts/${postId}/like`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, text }: { postId: string, text: string }) => {
      await api.post(`/posts/${postId}/comment`, { text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setCommentText('');
    },
  });

  if (isLoading || !savedPostsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Opening your feed…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn’t load your feed.</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.retryButton}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); }} />
        }
        ListHeaderComponent={
          <View style={styles.feedHeader}>
            <View style={styles.topBar}>
              <View style={styles.brandHeading}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setIsDrawerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open navigation menu"
                >
                  <Ionicons name="menu" size={22} color="#292541" />
                </TouchableOpacity>
                <View>
                <Text style={styles.feedTitle}>Socially</Text>
                <Text style={styles.tagline}>Connect · Share · Grow</Text>
                </View>
              </View>
              <View style={styles.topBarActions}>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => Alert.alert('Notifications', 'You’re all caught up.')}
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                >
                  <Ionicons name="notifications-outline" size={22} color="#1C1E21" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile')}
                  accessibilityRole="button"
                  accessibilityLabel="Open your profile"
                >
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {(user?.username?.[0] ?? user?.email?.[0] ?? 'Y').toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.composerCard}>
              <View style={styles.composerRow}>
                <View style={styles.composerAvatar}>
                  <Text style={styles.composerAvatarText}>
                    {(user?.username?.[0] ?? user?.email?.[0] ?? 'Y').toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.composerPrompt}
                  onPress={() => router.push('/(tabs)/create')}
                  accessibilityRole="button"
                  accessibilityLabel="Create a post"
                >
                  <Text style={styles.composerPromptText}>What’s on your mind?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.composerDivider} />
              <TouchableOpacity
                style={styles.photoAction}
                onPress={() => router.push('/(tabs)/create')}
                accessibilityRole="button"
                accessibilityLabel="Add a photo to a post"
              >
                <Ionicons name="image-outline" size={19} color="#26A269" />
                <Text style={styles.photoActionText}>Photo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#65676B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search captions or people"
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={20} color="#8A8D91" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.creatorHeading}>
              <Text style={styles.creatorTitle}>Creators</Text>
              <Text style={styles.creatorHint}>Tap to filter your feed</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creatorList}
            >
              <TouchableOpacity
                style={styles.creatorItem}
                onPress={() => setSelectedAuthor(null)}
                accessibilityRole="button"
                accessibilityLabel="Show posts from everyone"
                accessibilityState={{ selected: selectedAuthor === null }}
              >
                <View style={[styles.creatorAvatar, selectedAuthor === null && styles.creatorAvatarSelected]}>
                  <Ionicons name="people" size={22} color={selectedAuthor === null ? '#6C5CE7' : '#65676B'} />
                </View>
                <Text style={[styles.creatorName, selectedAuthor === null && styles.creatorNameSelected]}>Everyone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.creatorItem}
                onPress={() => router.push('/(tabs)/create')}
                accessibilityRole="button"
                accessibilityLabel="Create a post"
              >
                <View style={[styles.creatorAvatar, styles.addCreatorAvatar]}>
                  <Ionicons name="add" size={25} color="#6C5CE7" />
                </View>
                <Text style={styles.creatorName}>Add post</Text>
              </TouchableOpacity>
              {creators.map((creator) => {
                const username = creator.username;
                if (!username) return null;
                const isSelected = selectedAuthor === username;
                return (
                  <TouchableOpacity
                    key={username}
                    style={styles.creatorItem}
                    onPress={() => setSelectedAuthor(isSelected ? null : username)}
                    accessibilityRole="button"
                    accessibilityLabel={`Show posts by @${username}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={[styles.creatorAvatar, styles.creatorAvatarRing, isSelected && styles.creatorAvatarSelected]}>
                      {creator.avatarUrl ? (
                        <Image source={{ uri: resolveImageUrl(creator.avatarUrl) }} style={styles.creatorImage} />
                      ) : (
                        <Text style={[styles.creatorInitial, isSelected && styles.creatorNameSelected]}>
                          {username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.creatorName, isSelected && styles.creatorNameSelected]} numberOfLines={1}>
                      @{username}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.sortRow}>
              {(['recent', 'popular'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.sortButton, sortMode === mode && styles.sortButtonActive]}
                  onPress={() => setSortMode(mode)}
                >
                  <Text style={[styles.sortButtonText, sortMode === mode && styles.sortButtonTextActive]}>
                    {mode === 'recent' ? 'Recent' : 'Popular'}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.sortButton, showSavedOnly && styles.sortButtonActive]}
                onPress={() => setShowSavedOnly((current) => !current)}
              >
                <Text style={[styles.sortButtonText, showSavedOnly && styles.sortButtonTextActive]}>
                  Saved
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {showSavedOnly
              ? 'No saved posts here yet. Tap the bookmark on a post to keep it for later.'
              : selectedAuthor
                ? `No posts by @${selectedAuthor} match these filters.`
              : searchText.trim()
                ? 'No posts match your search.'
                : 'No posts yet. Be the first to share!'}
          </Text>
        }
        renderItem={({ item }) => {
          const hasLiked = item.likes?.some((like) => like.userId === user?.id) ?? false;
          const likeCount = item.likes?.length ?? 0;
          const commentCount = item.comments?.length ?? 0;
          const isCommenting = activeCommentPostId === item.id;

          return (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <TouchableOpacity
                  style={styles.postAuthor}
                  onPress={() => item.author?.username && setSelectedAuthor(item.author.username)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show posts by @${item.author?.username ?? 'user'}`}
                >
                  {item.author?.avatarUrl ? (
                    <Image source={{ uri: resolveImageUrl(item.author.avatarUrl) }} style={styles.postAvatar} />
                  ) : (
                    <View style={styles.postAvatarFallback}>
                      <Text style={styles.postAvatarInitial}>
                        {(item.author?.username?.[0] ?? '?').toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.username}>@{item.author?.username ?? 'user'}</Text>
                    <Text style={styles.postTime}>{formatPostTime(item.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { void sharePost(item); }}
                  accessibilityRole="button"
                  accessibilityLabel="Share post"
                  hitSlop={8}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
                </TouchableOpacity>
              </View>

              <Pressable
                onPress={() => {
                  const now = Date.now();
                  const previousTap = lastImageTap.current;
                  if (previousTap?.postId === item.id && now - previousTap.timestamp < 300) {
                    lastImageTap.current = null;
                    if (!hasLiked && !likeMutation.isPending) {
                      likeMutation.mutate({ postId: item.id, isLiked: false });
                    }
                    return;
                  }
                  lastImageTap.current = { postId: item.id, timestamp: now };
                }}
                accessibilityRole="button"
                accessibilityLabel={`Photo by @${item.author?.username ?? 'user'}`}
                accessibilityHint="Double tap quickly to like this post."
              >
                <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={styles.image} />
              </Pressable>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => likeMutation.mutate({ postId: item.id, isLiked: hasLiked })}
                  disabled={likeMutation.isPending}
                >
                  <Ionicons
                    name={hasLiked ? 'heart' : 'heart-outline'}
                    size={24} 
                    color={hasLiked ? '#E84A5F' : '#65676B'}
                  />
                  {likeCount > 0 && <Text style={styles.actionCount}>{likeCount}</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setActiveCommentPostId(isCommenting ? null : item.id);
                    setCommentText('');
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={24} color={isCommenting ? '#6C5CE7' : '#65676B'} />
                  {commentCount > 0 && <Text style={styles.actionCount}>{commentCount}</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => { void sharePost(item); }}
                  accessibilityLabel="Share post"
                >
                  <Ionicons name="share-social-outline" size={23} color="#65676B" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => { void toggleSavedPost(item.id); }}
                  disabled={savingPostId === item.id}
                  accessibilityLabel={savedPostIds.includes(item.id) ? 'Remove saved post' : 'Save post'}
                >
                  <Ionicons
                    name={savedPostIds.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                    size={23}
                    color={savedPostIds.includes(item.id) ? '#6C5CE7' : '#65676B'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.caption}>
                <Text style={styles.boldText}>@{item.author?.username} </Text>
                {item.caption}
              </Text>

              {isCommenting && (
                <View style={styles.commentsWrapper}>
                  {item.comments && item.comments.length > 0 ? (
                    item.comments.map((comment) => (
                      <Text key={comment.id} style={styles.comment}>
                        <Text style={styles.boldText}>@{comment.author?.username} </Text>
                        {comment.text}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.noCommentsText}>No comments yet.</Text>
                  )}

                  <View style={styles.addCommentContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Write a comment..."
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (commentText.trim()) {
                          commentMutation.mutate({ postId: item.id, text: commentText });
                        }
                      }}
                      disabled={!commentText.trim() || commentMutation.isPending}
                    >
                      <Text style={[styles.postButton, (!commentText.trim() || commentMutation.isPending) && styles.disabledButton]}>
                        {commentMutation.isPending ? 'Posting...' : 'Post'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={isDrawerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDrawerVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsDrawerVisible(false)} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerProfile}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>
                  {(user?.username?.[0] ?? user?.email?.[0] ?? 'Y').toUpperCase()}
                </Text>
              </View>
              <View style={styles.drawerIdentity}>
                <Text style={styles.drawerName}>{user?.username ?? user?.email?.split('@')[0] ?? 'Your profile'}</Text>
                <Text style={styles.drawerUsername}>@{user?.username ?? 'socially_user'}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDrawerVisible(false)} accessibilityLabel="Close menu">
                <Ionicons name="chevron-down" size={20} color="#9EA1B4" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />
            <TouchableOpacity style={styles.drawerItem} onPress={() => setIsDrawerVisible(false)}>
              <Ionicons name="home" size={19} color="#fff" />
              <Text style={styles.drawerItemActive}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setIsDrawerVisible(false); router.push('/(tabs)/explore'); }}>
              <Ionicons name="search-outline" size={19} color="#C4C6D2" />
              <Text style={styles.drawerItemText}>Explore</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => Alert.alert('Notifications', 'You’re all caught up.')}>
              <Ionicons name="notifications-outline" size={19} color="#C4C6D2" />
              <Text style={styles.drawerItemText}>Notifications</Text>
              <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>3</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setIsDrawerVisible(false); router.push('/(tabs)/messages'); }}>
              <Ionicons name="mail-outline" size={19} color="#C4C6D2" />
              <Text style={styles.drawerItemText}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setShowSavedOnly(true); setIsDrawerVisible(false); }}>
              <Ionicons name="bookmark-outline" size={19} color="#C4C6D2" />
              <Text style={styles.drawerItemText}>Bookmarks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setIsDrawerVisible(false); router.push('/(tabs)/profile'); }}>
              <Ionicons name="person-outline" size={19} color="#C4C6D2" />
              <Text style={styles.drawerItemText}>Profile</Text>
            </TouchableOpacity>

            <View style={[styles.drawerDivider, styles.drawerBottomDivider]} />
            <TouchableOpacity style={styles.drawerItem} onPress={() => Alert.alert('Settings', 'Account settings are coming soon.')}>
              <Ionicons name="settings-outline" size={19} color="#C4C6D2" />
              <Text style={styles.drawerItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => Alert.alert('Help & Support', 'Contact us at support@socially.app.')}>
              <Ionicons name="help-circle-outline" size={19} color="#C4C6D2" />
              <Text style={styles.drawerItemText}>Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutItem} onPress={() => { void handleLogout(); }}>
              <Ionicons name="log-out-outline" size={18} color="#D9D5F9" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7FB' },
  loadingText: { color: '#77798B', fontSize: 13, marginTop: 12 },
  feedHeader: { paddingHorizontal: 15, paddingTop: 12, paddingBottom: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  brandHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  menuButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEDFF', alignItems: 'center', justifyContent: 'center' },
  feedTitle: { fontSize: 23, fontWeight: '800', color: '#172044' },
  tagline: { color: '#8A8D91', fontSize: 12, marginTop: 1 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: '#5145CD', fontSize: 17, fontWeight: '700' },
  composerCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 4, marginBottom: 14, elevation: 1 },
  composerRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  composerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  composerAvatarText: { color: '#5145CD', fontSize: 16, fontWeight: '700' },
  composerPrompt: { flex: 1, height: 40, borderRadius: 20, backgroundColor: '#F2F3F8', justifyContent: 'center', paddingHorizontal: 15 },
  composerPromptText: { color: '#777D8D', fontSize: 14 },
  composerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E8EAF0' },
  photoAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  photoActionText: { color: '#596273', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  creatorHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  creatorTitle: { fontSize: 15, fontWeight: '700', color: '#1C1E21' },
  creatorHint: { fontSize: 12, color: '#8A8D91' },
  creatorList: { paddingVertical: 10, paddingRight: 8 },
  creatorItem: { alignItems: 'center', width: 68, marginRight: 8 },
  creatorAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E8EDF4', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  creatorAvatarRing: { borderColor: '#7967F2' },
  creatorAvatarSelected: { backgroundColor: '#EFEDFF', borderColor: '#6C5CE7' },
  addCreatorAvatar: { backgroundColor: '#EEF0FF', borderColor: '#fff' },
  creatorImage: { width: '100%', height: '100%' },
  creatorInitial: { color: '#465365', fontSize: 18, fontWeight: '700' },
  creatorName: { color: '#65676B', fontSize: 11, marginTop: 4, maxWidth: 68 },
  creatorNameSelected: { color: '#6C5CE7', fontWeight: '700' },
  sortRow: { flexDirection: 'row', marginTop: 12, marginBottom: 4 },
  sortButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: '#fff', marginRight: 8 },
  sortButtonActive: { backgroundColor: '#6C5CE7' },
  sortButtonText: { color: '#65676B', fontWeight: '600' },
  sortButtonTextActive: { color: '#fff' },
  postCard: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 14, borderRadius: 16, paddingBottom: 12, overflow: 'hidden', elevation: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  postAuthor: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  postAvatarFallback: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: '#E8EAFE', alignItems: 'center', justifyContent: 'center' },
  postAvatarInitial: { color: '#5145CD', fontWeight: '700', fontSize: 17 },
  username: { fontWeight: '700', fontSize: 14, color: '#252936' },
  postTime: { fontSize: 11, color: '#9298A5', marginTop: 2 },
  image: { width: '100%', height: 320, resizeMode: 'cover' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F1F4' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 23 },
  actionCount: { marginLeft: 5, fontSize: 14, fontWeight: 'bold', color: '#65676B' },
  caption: { paddingHorizontal: 15, fontSize: 14, lineHeight: 20, marginTop: 9, color: '#303442' },
  commentsWrapper: {
    paddingHorizontal: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 10,
  },
  comment: { fontSize: 14, color: '#333', marginBottom: 6 },
  noCommentsText: { fontSize: 14, color: '#999', fontStyle: 'italic', marginBottom: 10 },
  addCommentContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5, paddingBottom: 5 },
  commentInput: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10 },
  postButton: { color: '#6C5CE7', fontWeight: 'bold' },
  disabledButton: { opacity: 0.45 },
  emptyText: { color: '#65676B', textAlign: 'center', paddingHorizontal: 24, paddingVertical: 32, fontSize: 15 },
  errorText: { color: '#333', fontSize: 16, marginBottom: 12 },
  retryButton: { color: '#6C5CE7', fontWeight: 'bold', fontSize: 16 },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(5, 6, 18, 0.62)' },
  drawerPanel: { width: '84%', maxWidth: 340, height: '100%', paddingTop: 56, paddingHorizontal: 18, paddingBottom: 22, backgroundColor: '#0A0C1C' },
  drawerProfile: { flexDirection: 'row', alignItems: 'center', paddingBottom: 18 },
  drawerAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6C5CE7', marginRight: 11 },
  drawerAvatarText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  drawerIdentity: { flex: 1 },
  drawerName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  drawerUsername: { color: '#9EA1B4', fontSize: 11, marginTop: 3 },
  drawerDivider: { height: 1, backgroundColor: '#25273B', marginBottom: 10 },
  drawerBottomDivider: { marginTop: 8 },
  drawerItem: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, borderRadius: 12 },
  drawerItemActive: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700', backgroundColor: '#6C5CE7', marginRight: -4, marginVertical: 5, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, overflow: 'hidden' },
  drawerItemText: { flex: 1, color: '#C4C6D2', fontSize: 13, fontWeight: '500' },
  notificationBadge: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  logoutItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, minHeight: 42, borderRadius: 21, marginTop: 'auto', borderWidth: 1, borderColor: '#383A50' },
  logoutText: { color: '#D9D5F9', fontSize: 12, fontWeight: '600' },
  boldText: { fontWeight: 'bold' },
});