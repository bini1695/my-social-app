import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Unable to select an image:', error);
      Alert.alert('Could not select image', 'Please try again.');
    }
  };

  const handlePost = async () => {
    if (!image) return Alert.alert('Error', 'Please select an image');
    setIsLoading(true);
    let failedStep = 'Uploading image';

    try {
      const formData = new FormData();
      const mimeType = image.mimeType ?? image.file?.type ?? 'image/jpeg';
      const extensionByMimeType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/heic': 'heic',
        'image/heif': 'heif',
        'image/avif': 'avif',
      };
      const fileName = image.fileName ?? image.file?.name ?? `upload.${extensionByMimeType[mimeType] ?? 'jpg'}`;

      if (Platform.OS === 'web') {
        let file: Blob;
        if (image.file) {
          file = image.file;
        } else {
          const response = await fetch(image.uri);
          if (!response.ok) throw new Error('Could not read the selected image. Please select it again.');
          file = await response.blob();
        }
        formData.append('file', file, fileName);
      } else {
        formData.append('file', {
          // @ts-expect-error React Native FormData accepts URI-backed file parts.
          uri: image.uri,
          type: mimeType,
          name: fileName,
        });
      }

      const uploadResponse = await api.post('/upload', formData, {
        timeout: 60000,
      });

      const uploadedImageUrl = uploadResponse.data?.imageUrl;
      if (typeof uploadedImageUrl !== 'string' || !uploadedImageUrl) {
        throw new Error('The server did not return an image URL.');
      }
      const imageUrl = uploadedImageUrl.replace('http://localhost:3000', API_URL);

      failedStep = 'Saving post';
      await api.post('/posts', { caption, imageUrl });

      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      setCaption('');
      setImage(null);
      Alert.alert('Success', 'Post created!');
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('Unable to create post:', error);

      // Better error message for the popup
      let message = 'Please try again.';
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        message = data?.message
          ? (Array.isArray(data.message) ? data.message.join('\n') : data.message)
          : error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      Alert.alert('Could not create post', `${failedStep}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} accessibilityLabel="Close create post">
          <Ionicons name="close" size={24} color="#F6F4FF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Create post</Text>
        <TouchableOpacity
          style={[styles.postButton, isLoading && styles.postButtonDisabled]}
          onPress={() => { void handlePost(); }}
          disabled={isLoading}
        >
          <Text style={styles.postButtonText}>{isLoading ? 'Posting…' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.username?.[0] ?? user?.email?.[0] ?? 'Y').toUpperCase()}</Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{user?.username ?? user?.email?.split('@')[0] ?? 'Your name'}</Text>
            <View style={styles.audience}>
              <Ionicons name="globe-outline" size={12} color="#C4B5FD" />
              <Text style={styles.audienceText}>Public</Text>
              <Ionicons name="chevron-down" size={12} color="#C4B5FD" />
            </View>
          </View>
        </View>

        <TextInput
          style={styles.captionInput}
          placeholder="What’s on your mind?"
          placeholderTextColor="#747991"
          value={caption}
          onChangeText={setCaption}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.imagePicker} onPress={() => { void pickImage(); }} accessibilityRole="button">
          {image ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => setImage(null)}
                accessibilityLabel="Remove selected image"
              >
                <Ionicons name="close" size={17} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePrompt}>
              <View style={styles.imageIcon}>
                <Ionicons name="image-outline" size={27} color="#C4B5FD" />
              </View>
              <Text style={styles.imageTitle}>Add a photo</Text>
              <Text style={styles.imageSubtitle}>Share a moment with your people</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.addToPost}>
          <Text style={styles.addToPostTitle}>Add to your post</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionTile} onPress={() => { void pickImage(); }}>
              <Ionicons name="image" size={21} color="#6EE7B7" />
              <Text style={styles.actionText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile} onPress={() => Alert.alert('Video', 'Video posts are not available yet.')}>
              <Ionicons name="videocam" size={21} color="#93C5FD" />
              <Text style={styles.actionText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile} onPress={() => Alert.alert('Feeling', 'Add a feeling to your caption.')}>
              <Ionicons name="happy" size={21} color="#FCD34D" />
              <Text style={styles.actionText}>Feeling</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionTile} onPress={() => Alert.alert('Location', 'Add a location to your caption.')}>
              <Ionicons name="location" size={21} color="#FCA5A5" />
              <Text style={styles.actionText}>Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090B18' },
  topBar: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#282A40' },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A1C30', alignItems: 'center', justifyContent: 'center' },
  screenTitle: { color: '#F6F4FF', fontSize: 16, fontWeight: '700' },
  postButton: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20, backgroundColor: '#6C5CE7' },
  postButtonDisabled: { opacity: 0.55 },
  postButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 34 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5145CD' },
  avatarText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  authorDetails: { marginLeft: 11 },
  authorName: { color: '#F6F4FF', fontWeight: '700', fontSize: 14 },
  audience: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4, borderRadius: 10, backgroundColor: '#1A1C30' },
  audienceText: { color: '#C4B5FD', fontSize: 10, fontWeight: '600' },
  captionInput: { minHeight: 94, color: '#F6F4FF', fontSize: 19, lineHeight: 27, padding: 0, marginBottom: 16 },
  imagePicker: { minHeight: 220, borderRadius: 17, borderWidth: 1, borderColor: '#30324B', backgroundColor: '#111326', overflow: 'hidden', marginBottom: 18 },
  imagePrompt: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  imageIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#262047', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  imageTitle: { color: '#F6F4FF', fontSize: 15, fontWeight: '700' },
  imageSubtitle: { color: '#8588A0', fontSize: 12, marginTop: 5 },
  previewWrap: { height: 260 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImage: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#111827CC', alignItems: 'center', justifyContent: 'center' },
  addToPost: { borderWidth: 1, borderColor: '#282A40', backgroundColor: '#111326', borderRadius: 16, padding: 15 },
  addToPostTitle: { color: '#B9BCD0', fontSize: 12, fontWeight: '700', marginBottom: 14 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionTile: { alignItems: 'center', gap: 6, minWidth: 58 },
  actionText: { color: '#C6C8D5', fontSize: 10 },
});