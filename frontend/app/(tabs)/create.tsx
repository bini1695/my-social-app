import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../constants/config';

export default function CreatePostScreen() {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Fixed the deprecated warning
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!image) return Alert.alert('Error', 'Please select an image');
    setIsLoading(true);

    try {
      const formData = new FormData();
      // @ts-ignore
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });

      // 1. Upload Image
      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      let imageUrl = uploadResponse.data.imageUrl;
      
      // CRITICAL FIX: Replace 'localhost' with your actual API_URL so the phone can see the image
      imageUrl = imageUrl.replace('http://localhost:3000', API_URL);

      // 2. Create Post in Database
      await api.post('/posts', { caption, imageUrl });

      // 3. Success
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setCaption('');
      setImage(null);
      setIsLoading(false);
      Alert.alert('Success', 'Post created!');
      router.push('/(tabs)');
      
    } catch (error: any) {
      setIsLoading(false);
      console.log("FULL ERROR:", error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post. Check console.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
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