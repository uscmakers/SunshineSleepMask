import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { appTheme } from "@/theme/appTheme";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const tint = Colors[colorScheme ?? "light"].tint;

  const tabs = (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: isDark
          ? appTheme.colors.textMuted
          : Colors.light.tabIconDefault,
        tabBarStyle: isDark
          ? {
              backgroundColor: appTheme.colors.tabBarBg,
              borderTopColor: appTheme.colors.border,
              borderTopWidth: 1,
            }
          : undefined,
        headerStyle: isDark ? { backgroundColor: "#000" } : undefined,
        headerTintColor: isDark ? "#fff" : undefined,
        headerTitleStyle: isDark
          ? {
              fontFamily: appTheme.fonts.medium,
              fontSize: appTheme.type.screenTitle,
            }
          : undefined,
        headerShadowVisible: !isDark,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alarm_clock"
        options={{
          title: "Alarm",
          tabBarIcon: ({ color }) => <TabBarIcon name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sound"
        options={{
          title: "Sounds",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="music" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Data",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bar-chart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="meditation"
        options={{
          title: "Meditation",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="moon-o" color={color} />
          ),
        }}
      />
    </Tabs>
  );

  if (isDark) {
    return (
      <ThemeProvider
        value={{
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: tint,
            background: "#000",
            card: "#000",
            text: "#fff",
            border: appTheme.colors.border,
            notification: tint,
          },
        }}
      >
        {tabs}
      </ThemeProvider>
    );
  }

  return tabs;
}
