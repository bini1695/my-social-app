import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function IndexRoute() {
  const { token, isInitializing } = useAuth();

  if (isInitializing) return null;

  return <Redirect href={token ? '/(tabs)' : '/(auth)'} />;
}
