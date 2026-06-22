import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import BodyScreen from '../screens/BodyScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const WorkoutStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
    </HomeStack.Navigator>
  );
}

function WorkoutsStack() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="WorkoutsList" component={WorkoutsScreen} />
      <WorkoutStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
    </WorkoutStack.Navigator>
  );
}

const ICONS: Record<string, { active: any; inactive: any }> = {
  Home:     { active: 'home',        inactive: 'home-outline' },
  Workouts: { active: 'barbell',     inactive: 'barbell-outline' },
  History:  { active: 'time',        inactive: 'time-outline' },
  Progress: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Body:     { active: 'body',        inactive: 'body-outline' },
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const set = ICONS[route.name];
          return <Ionicons name={focused ? set.active : set.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeStackNavigator} />
      <Tab.Screen name="Workouts" component={WorkoutsStack} />
      <Tab.Screen name="History"  component={HistoryScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Body"     component={BodyScreen} />
    </Tab.Navigator>
  );
}
