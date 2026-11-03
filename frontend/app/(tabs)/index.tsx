import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import api from '../../services/api';
import { API_URL } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';

export default function FeedScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State to track which post has its comments open
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data;
    },
  });

  // LIKE MUTATION
  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string, isLiked: boolean }) => {
      if (isLiked) await api.delete(`/posts/${postId}/like`);
      else await api.post(`/posts/${postId}/like`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  // COMMENT MUTATION
  const commentMutation = useMutation({
    mutationFn: async ({ postId, text }: { postId: string, text: string }) => {
      await api.post(`/posts/${postId}/comment`, { text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setCommentText('');
      // We don't close the comments here, so the user can see their new comment immediately
    },
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const hasLiked = item.likes?.some((like: any) => like.userId === user?.id);
          const likeCount = item.likes?.length || 0;
          const commentCount = item.comments?.length || 0;
          
          // Check if THIS specific post's comments are currently open
          const isCommenting = activeCommentPostId === item.id; 

          return (
            <View style={styles.postCard}>
              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.avatarPlaceholder} />
                <Text style={styles.username}>@{item.author?.username}</Text>
              </View>
              
              {/* IMAGE */}
              <Image source={{ uri: item.imageUrl.replace('http://localhost:3000', API_URL) }} style={styles.image} />
              
              {/* ACTION BUTTONS */}
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => likeMutation.mutate({ postId: item.id, isLiked: hasLiked })}
                >
                  <Ionicons 
                    name={hasLiked ? "thumbs-up" : "thumbs-up-outline"} 
                    size={24} 
                    color={hasLiked ? "#007AFF" : "#65676B"} 
                  />
                  {likeCount > 0 && <Text style={styles.actionCount}>{likeCount}</Text>}
                </TouchableOpacity>

                {/* COMMENT BUBBLE - TOGGLES THE WHOLE SECTION */}
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setActiveCommentPostId(isCommenting ? null : item.id);
                    setCommentText(''); // Clear input when switching posts
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={24} color={isCommenting ? "#007AFF" : "#65676B"} />
                  {commentCount > 0 && <Text style={styles.actionCount}>{commentCount}</Text>}
                </TouchableOpacity>
              </View>

              {/* CAPTION */}
              <Text style={styles.caption}>
                <Text style={styles.boldText}>@{item.author?.username} </Text>
                {item.caption}
              </Text>

              {/* 👇 COMMENT SECTION (Only visible if the bubble is clicked) 👇 */}
              {isCommenting && (
                <View style={styles.commentsWrapper}>
                  
                  {/* LIST OF COMMENTS */}
                  {item.comments?.length > 0 ? (
                    item.comments.map((comment: any) => (
                      <Text key={comment.id} style={styles.comment}>
                        <Text style={styles.boldText}>@{comment.author?.username} </Text>
                        {comment.text}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.noCommentsText}>No comments yet.</Text>
                  )}

                  {/* INPUT TO WRITE NEW COMMENT */}
                  <View style={styles.addCommentContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Write a comment..."
                      value={commentText}
                      onChangeText={setCommentText}
                      autoFocus
                    />
                    <TouchableOpacity 
                      onPress={() => {
                        if (commentText.trim()) {
                          commentMutation.mutate({ postId: item.id, text: commentText });
                        }
                      }}
                    >
                      <Text style={styles.postButton}>Post</Text>
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
  postCard: { backgroundColor: '#fff', marginBottom: 15, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', marginRight: 10 },
  username: { fontWeight: 'bold', fontSize: 16 },
  image: { width: '100%', height: 300, resizeMode: 'cover' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  actionCount: { marginLeft: 5, fontSize: 14, fontWeight: 'bold', color: '#65676B' },
  caption: { paddingHorizontal: 15, fontSize: 15, marginTop: 5 },
  
  // NEW STYLES FOR THE HIDDEN COMMENT SECTION
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
  boldText: { fontWeight: 'bold' },
});