import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { AuthProvider } from "@/contexts/AuthContext";
import RootNavigator from "@/navigation/RootNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
        <Toast position="top" topOffset={50} />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
