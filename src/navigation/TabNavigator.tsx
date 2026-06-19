
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProgressScreen from '../screens/ProgressScreen';
import BodyScreen from '../screens/BodyScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();
const WorkoutStack = createNativeStackNavigator();

function WorkoutsStack() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="WorkoutsList" component={WorkoutsScreen} />
      <WorkoutStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
    </WorkoutStack.Navigator>
  );
}

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
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { active: any; inactive: any }> = {
            Workouts: { active: 'barbell', inactive: 'barbell-outline' },
            History: { active: 'time', inactive: 'time-outline' },
            Progress: { active: 'stats-chart', inactive: 'stats-chart-outline' },
            Body: { active: 'body', inactive: 'body-outline' },
          };
          const set = icons[route.name];
          return <Ionicons name={focused ? set.active : set.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Workouts" component={WorkoutsStack} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Body" component={BodyScreen} />
    </Tab.Navigator>
  );
}
