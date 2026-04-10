import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PlayersScreen } from '../screens/players/PlayersScreen';
import { GameHistoryScreen } from '../screens/history/GameHistoryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { GameSetupScreen } from '../screens/game/GameSetupScreen';
import { ScoringScreen } from '../screens/game/ScoringScreen';
import { OverallStandingsScreen } from '../screens/game/OverallStandingsScreen';
import { GameSummaryScreen } from '../screens/game/GameSummaryScreen';
import { HandicapSetupScreen } from '../screens/game/HandicapSetupScreen';
import { CoursesScreen } from '../screens/courses/CoursesScreen';
import { CreateCourseScreen } from '../screens/courses/CreateCourseScreen';
import { AdminPanelScreen } from '../screens/admin/AdminPanelScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { useThemedColors } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  const colors = useThemedColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.primary[500],
        },
        headerTintColor: colors.text.inverse,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="GameSetup" component={GameSetupScreen} options={{ title: 'New Game' }} />
      <Stack.Screen name="HandicapSetup" component={HandicapSetupScreen} options={{ title: 'Handicaps' }} />
      <Stack.Screen name="Scoring" component={ScoringScreen} options={{ title: 'Scoring' }} />
      <Stack.Screen
        name="OverallStandings"
        component={OverallStandingsScreen}
        options={{ title: 'Overall Standings' }}
      />
      <Stack.Screen
        name="GameSummary"
        component={GameSummaryScreen}
        options={{ title: 'Summary' }}
      />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign Up' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
    </Stack.Navigator>
  );
};

const CoursesStack = () => {
  const colors = useThemedColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.primary[500],
        },
        headerTintColor: colors.text.inverse,
      }}
    >
      <Stack.Screen name="CoursesList" component={CoursesScreen} options={{ title: 'Courses' }} />
      <Stack.Screen name="CreateCourse" component={CreateCourseScreen} options={{ title: 'Create Course' }} />
      <Stack.Screen name="EditCourse" component={CreateCourseScreen} options={{ title: 'Edit Course' }} />
    </Stack.Navigator>
  );
};

const HistoryStack = () => {
  const colors = useThemedColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.primary[500],
        },
        headerTintColor: colors.text.inverse,
      }}
    >
      <Stack.Screen name="GameHistory" component={GameHistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen
        name="GameSummary"
        component={GameSummaryScreen}
        options={{ title: 'Game Summary' }}
      />
    </Stack.Navigator>
  );
};

const SettingsStack = () => {
  const colors = useThemedColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.primary[500],
        },
        headerTintColor: colors.text.inverse,
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'Admin Panel' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign Up' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const colors = useThemedColors();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.background.card,
          borderTopColor: colors.border.light,
        },
        headerStyle: {
          backgroundColor: colors.primary[500],
        },
        headerTintColor: colors.text.inverse,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesStack}
        options={{
          title: 'Courses',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="golf-tee" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersScreen}
        options={{
          title: 'Players',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStack}
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
