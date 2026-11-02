import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { API_URL } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';

export default function FeedScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data;
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string, isLiked: boolean }) => {
      if (isLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      // This refreshes the feed to show the updated like count
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          // Check if the current user has liked this post
          const hasLiked = item.likes?.some((like: any) => like.userId === user?.id);
          const likeCount = item.likes?.length || 0;

          return (
            <View style={styles.postCard}>
              <View style={styles.header}>
                <View style={styles.avatarPlaceholder} />
                <Text style={styles.username}>@{item.author?.username || 'user'}</Text>
              </View>
              {item.imageUrl && (
                <Image 
                  source={{ uri: item.imageUrl.replace('http://localhost:3000', API_URL) }} 
                  style={styles.image} 
                />
              )}
              
              {/* LIKE BUTTON SECTION */}
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => likeMutation.mutate({ postId: item.id, isLiked: hasLiked })}
                >
                  <Ionicons 
                    name={hasLiked ? "heart" : "heart-outline"} 
                    size={28} 
                    color={hasLiked ? "#FF3B30" : "#333"} 
                  />
                  <Text style={styles.likeCount}>{likeCount > 0 ? likeCount : ''}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.caption}>
                <Text style={styles.boldText}>@{item.author?.username} </Text>
                {item.caption}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet. Be the first!</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  postCard: { backgroundColor: '#fff', marginBottom: 15, paddingBottom: 15 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', marginRight: 10 },
  username: { fontWeight: 'bold', fontSize: 16 },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  actions: { flexDirection: 'row', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 5 },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  likeCount: { marginLeft: 5, fontSize: 16, fontWeight: 'bold', color: '#333' },
  caption: { paddingHorizontal: 15, fontSize: 15, marginTop: 5 },
  boldText: { fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' }
});