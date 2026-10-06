import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../store/authStore";

import LoginScreen from "../screens/Auth/LoginScreen";
import SignupScreen from "../screens/Auth/SignupScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import RequestServiceScreen from "../screens/RequestService/RequestServiceScreen";
import TrackMechanicScreen from "../screens/TrackMechanic/TrackMechanicScreen";
import ChatScreen from "../screens/Chat/ChatScreen";
import PaymentScreen from "../screens/Payment/PaymentScreen";
import HistoryScreen from "../screens/History/HistoryScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import { View } from "react-native";
import { StatusBar, Text } from "react-native";

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#24764F",
      tabBarInactiveTintColor: "#98A29B",
      tabBarLabelStyle: { fontSize: 9, fontWeight: "700", marginBottom: 5 },
      tabBarStyle: { height: 62, paddingTop: 7, borderTopColor: "#E5EAE6", backgroundColor: "#FFFFFF" },
    }}>
      <Tabs.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌂</Text> }} />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ title: "My Requests", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>▤</Text> }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>○</Text> }} />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <AppStack.Screen name="RequestService" component={RequestServiceScreen} options={{ title: "Request Help" }} />
      <AppStack.Screen name="TrackMechanic" component={TrackMechanicScreen} options={{ title: "Track Your Mechanic" }} />
      <AppStack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
      <AppStack.Screen name="Payment" component={PaymentScreen} options={{ title: "Payment" }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="dark-content" />
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
          }}
        >
          ROADGUARD
        </Text>

        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
