import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { DashboardScreen } from "../screens/Dashboard/DashboardScreen";
import { EarningsScreen } from "../screens/Earnings/EarningsScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { ActiveJobScreen } from "../screens/ActiveJob/ActiveJobScreen";
import { ChatScreen } from "../screens/Chat/ChatScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="ActiveJob" component={ActiveJobScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

const tabIcon = (glyph: string, size: number) => ({ color }: { color: string }) =>
  React.createElement(Text, { style: { color, fontSize: size, fontWeight: "700" } }, glyph);

export function AppNavigator() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#237A57",
      tabBarInactiveTintColor: "#89968D",
      tabBarLabelStyle: { fontSize: 9, fontWeight: "800", marginBottom: 5 },
      tabBarStyle: { height: 62, paddingTop: 7, backgroundColor: "#fff", borderTopColor: "#E0E8E1" },
    }}>
      <Tab.Screen name="Dashboard" component={DashboardStack} options={{ tabBarIcon: tabIcon("⌂", 17) }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarIcon: tabIcon("▥", 16) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon("○", 16) }} />
    </Tab.Navigator>
  );
}
