import { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CommentsScreen() {
  // This grabs the post ID from the URL (e.g., /comments/123)
  const { id } = useLocalSearchParams(); 
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  // Fetch the specific post to get its comments
  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const response = await api.get('/posts');
      return response.data.find((p: any) => p.id === id);
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (newComment: string) => {
      await api.post(`/posts/${id}/comment`, { text: newComment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setText('');
    },
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!post) return <View style={styles.center}><Text>Post not found</Text></View>;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
      </View>

      {/* COMMENTS LIST */}
      <FlatList
        data={post.comments || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>@{item.author?.username}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        }
      />

      {/* INPUT AREA */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity 
          onPress={() => {
            if (text.trim()) commentMutation.mutate(text);
          }}
        >
          <Text style={styles.postButton}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 50, 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  commentBubble: { marginBottom: 15, backgroundColor: '#f0f2f5', padding: 12, borderRadius: 10 },
  commentAuthor: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  commentText: { fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#eee', 
    backgroundColor: '#fff' 
  },
  input: { 
    flex: 1, 
    backgroundColor: '#f0f2f5', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    maxHeight: 100,
    marginRight: 10
  },
  postButton: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
});