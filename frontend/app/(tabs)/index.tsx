import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, RefreshControl, Share, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../../services/api';
import { API_URL } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';

type FeedPost = {
  id: string;
  caption?: string | null;
  imageUrl: string;
  createdAt: string;
  author?: { username?: string };
  likes?: { userId: string }[];
  comments?: { id: string; text: string; author?: { username?: string } }[];
};

export default function FeedScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'popular'>('recent');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [savedPostsLoaded, setSavedPostsLoaded] = useState(false);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  const savedPostsKey = `savedPosts:${user?.id ?? 'guest'}`;

  useEffect(() => {
    let isMounted = true;

    SecureStore.getItemAsync(savedPostsKey)
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
  });

  const visiblePosts = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    const filteredPosts = posts.filter((post) =>
      (!showSavedOnly || savedPostIds.includes(post.id)) &&
      `${post.caption ?? ''} ${post.author?.username ?? ''}`.toLocaleLowerCase().includes(query),
    );

    return filteredPosts.sort((a, b) => {
      if (sortMode === 'popular') {
        const likeDifference = (b.likes?.length ?? 0) - (a.likes?.length ?? 0);
        if (likeDifference !== 0) return likeDifference;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, searchText, sortMode, showSavedOnly, savedPostIds]);

  const toggleSavedPost = async (postId: string) => {
    if (savingPostId) return;
    setSavingPostId(postId);
    const nextSavedPostIds = savedPostIds.includes(postId)
      ? savedPostIds.filter((id) => id !== postId)
      : [...savedPostIds, postId];

    try {
      await SecureStore.setItemAsync(savedPostsKey, JSON.stringify(nextSavedPostIds));
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

  if (isLoading || !savedPostsLoaded) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

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
            <Text style={styles.feedTitle}>Your feed</Text>
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
              <View style={styles.header}>
                <View style={styles.avatarPlaceholder} />
                <Text style={styles.username}>@{item.author?.username}</Text>
              </View>

              <Image source={{ uri: item.imageUrl.replace('http://localhost:3000', API_URL) }} style={styles.image} />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => likeMutation.mutate({ postId: item.id, isLiked: hasLiked })}
                  disabled={likeMutation.isPending}
                >
                  <Ionicons
                    name={hasLiked ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={24} 
                    color={hasLiked ? '#007AFF' : '#65676B'}
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
                  <Ionicons name="chatbubble-outline" size={24} color={isCommenting ? '#007AFF' : '#65676B'} />
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
                    color={savedPostIds.includes(item.id) ? '#007AFF' : '#65676B'}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  feedHeader: { paddingHorizontal: 15, paddingTop: 16, paddingBottom: 8 },
  feedTitle: { fontSize: 26, fontWeight: 'bold', color: '#1C1E21', marginBottom: 14 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  sortRow: { flexDirection: 'row', marginTop: 12, marginBottom: 4 },
  sortButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: '#fff', marginRight: 8 },
  sortButtonActive: { backgroundColor: '#007AFF' },
  sortButtonText: { color: '#65676B', fontWeight: '600' },
  sortButtonTextActive: { color: '#fff' },
  postCard: { backgroundColor: '#fff', marginBottom: 15, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', marginRight: 10 },
  username: { fontWeight: 'bold', fontSize: 16 },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  actionCount: { marginLeft: 5, fontSize: 14, fontWeight: 'bold', color: '#65676B' },
  caption: { paddingHorizontal: 15, fontSize: 15, marginTop: 5 },
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
  postButton: { color: '#007AFF', fontWeight: 'bold' },
  disabledButton: { opacity: 0.45 },
  emptyText: { color: '#65676B', textAlign: 'center', paddingHorizontal: 24, paddingVertical: 32, fontSize: 15 },
  errorText: { color: '#333', fontSize: 16, marginBottom: 12 },
  retryButton: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
  boldText: { fontWeight: 'bold' },
});