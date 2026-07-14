import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertProvider } from "../contexts/AlertContext";
import { AppProvider } from "../contexts/AppContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { setupNotificationHandler } from "../utils/notifications";

setupNotificationHandler();

function ThemedStack() {
  const { mode, colors } = useTheme();
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="folders" />
        <Stack.Screen name="folder/[id]" />
        <Stack.Screen name="todos" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="chatbot" />
        <Stack.Screen name="recurring" />
        <Stack.Screen name="reports" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <AlertProvider>
            <ThemedStack />
          </AlertProvider>
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
