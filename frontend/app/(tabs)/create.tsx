import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../constants/config';

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

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
        // @ts-expect-error React Native FormData accepts URI-backed file parts.
        formData.append('file', {
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} />
        ) : (
          <Text style={styles.imageText}>Tap to select an image</Text>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Write a caption..."
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && { opacity: 0.5 }]} 
        onPress={handlePost}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Posting...' : 'Share Post'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  imagePicker: { height: 300, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 20, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imageText: { color: '#888', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 20, height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});