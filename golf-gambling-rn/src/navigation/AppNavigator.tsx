import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/home/HomeScreen";
import { PlayersScreen } from "../screens/players/PlayersScreen";
import { GameHistoryScreen } from "../screens/history/GameHistoryScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { GameSetupScreen } from "../screens/game/GameSetupScreen";
import { ScoringScreen } from "../screens/game/ScoringScreen";
import { OverallStandingsScreen } from "../screens/game/OverallStandingsScreen";
import { GameSummaryScreen } from "../screens/game/GameSummaryScreen";
import { HandicapSetupScreen } from "../screens/game/HandicapSetupScreen";
import { CoursesScreen } from "../screens/courses/CoursesScreen";
import { CreateCourseScreen } from "../screens/courses/CreateCourseScreen";
import { AdminPanelScreen } from "../screens/admin/AdminPanelScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { useThemedColors } from "../contexts/ThemeContext";
import { fontFamilies } from "../theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const TabIcon = ({
  focused,
  color,
  size,
  filled,
  outlined,
}: {
  focused: boolean;
  color: string;
  size: number;
  filled: IconName;
  outlined: IconName;
}) => {
  const colors = useThemedColors();
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.activeIndicator,
          { backgroundColor: focused ? colors.accent.gold : "transparent" },
        ]}
      />
      <MaterialCommunityIcons
        name={focused ? filled : outlined}
        color={color}
        size={size}
      />
    </View>
  );
};

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="GameSetup" component={GameSetupScreen} />
    <Stack.Screen name="HandicapSetup" component={HandicapSetupScreen} />
    <Stack.Screen name="Scoring" component={ScoringScreen} />
    <Stack.Screen
      name="OverallStandings"
      component={OverallStandingsScreen}
    />
    <Stack.Screen name="GameSummary" component={GameSummaryScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

const CoursesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CoursesList" component={CoursesScreen} />
    <Stack.Screen name="CreateCourse" component={CreateCourseScreen} />
    <Stack.Screen name="EditCourse" component={CreateCourseScreen} />
  </Stack.Navigator>
);

const HistoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="GameHistory" component={GameHistoryScreen} />
    <Stack.Screen name="GameSummary" component={GameSummaryScreen} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const colors = useThemedColors();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.gold,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.light,
          height: Platform.OS === "web" ? 68 : 84,
          paddingTop: 8,
          paddingBottom: Platform.OS === "web" ? 10 : 24,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.bodySemiBold,
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: "Home",
          tabBarIcon: (props) => (
            <TabIcon {...props} filled="home" outlined="home-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesStack}
        options={{
          title: "Courses",
          tabBarIcon: (props) => (
            <TabIcon
              {...props}
              filled="golf"
              outlined="golf-tee"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersScreen}
        options={{
          title: "Players",
          tabBarIcon: (props) => (
            <TabIcon
              {...props}
              filled="account-group"
              outlined="account-group-outline"
            />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStack}
        options={{
          title: "History",
          tabBarIcon: (props) => (
            <TabIcon {...props} filled="history" outlined="history" />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          title: "Settings",
          tabBarIcon: (props) => (
            <TabIcon {...props} filled="cog" outlined="cog-outline" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
  },
  activeIndicator: {
    position: "absolute",
    top: -10,
    height: 2,
    width: 28,
    borderRadius: 1,
  },
});
