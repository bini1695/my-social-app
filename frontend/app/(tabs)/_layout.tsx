import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6C5CE7',
        tabBarInactiveTintColor: '#7B8492',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
        headerShown: false,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Your feed',
          headerShown: false,
          tabBarAccessibilityLabel: 'Feed',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={focused ? '#1877F2' : '#7B8492'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={21} color={focused ? '#6C5CE7' : '#7B8492'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create a post',
          tabBarAccessibilityLabel: 'Create a post',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.createIcon, focused && styles.createIconActive]}>
              <Ionicons name="add" size={27} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarAccessibilityLabel: 'Messages',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={20} color={focused ? '#6C5CE7' : '#7B8492'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Your profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={21} color={focused ? '#6C5CE7' : '#7B8492'} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#E8ECF2',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 7,
    paddingBottom: 7,
    elevation: 12,
    shadowColor: '#1C2A3A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabItem: { minHeight: 52 },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  header: { backgroundColor: '#fff' },
  headerTitle: { color: '#1C1E21', fontSize: 18, fontWeight: '700' },
  iconWrap: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: '#EFEDFF' },
  createIcon: {
    width: 42,
    height: 42,
    marginTop: -11,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 3,
  },
  createIconActive: { backgroundColor: '#5145CD', transform: [{ scale: 1.08 }] },
});