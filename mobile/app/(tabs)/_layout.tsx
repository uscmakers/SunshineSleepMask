import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { appTheme } from "@/theme/appTheme";

const TAB_BAR_BASE_HEIGHT = 49;

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: 0 }} {...props} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: appTheme.colors.accent,
        tabBarInactiveTintColor: appTheme.colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: appTheme.colors.tabBarBg,
            borderTopColor: appTheme.colors.border,
            height: TAB_BAR_BASE_HEIGHT + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 6,
            ...Platform.select({
              android: { elevation: 0 },
              default: {
                shadowOpacity: 0,
              },
            }),
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
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
          title: "Sound",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="volume-up" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: "Data",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bar-chart" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarLabel: {
    fontSize: 11,
    fontFamily: appTheme.fonts.medium,
  },
});
