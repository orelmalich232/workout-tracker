import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import TabNavigator from './src/navigation/TabNavigator';
import { COLORS } from './src/theme';
import { seedWorkoutPlan } from './src/storage/storage';

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  useEffect(() => { seedWorkoutPlan(); }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
