import { Platform } from 'react-native';

const nativeApiUrl = 'http://172.16.134.19:3000';

export const API_URL = Platform.OS === 'web' ? 'http://localhost:3000' : nativeApiUrl;