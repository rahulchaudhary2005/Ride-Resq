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
import { Text } from "react-native";

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
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="History" component={HistoryScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
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
