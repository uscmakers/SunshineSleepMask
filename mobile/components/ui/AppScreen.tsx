import React from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appTheme } from "@/theme/appTheme";

type AppScreenProps = {
  children: React.ReactNode;
  /** When true, wraps children in ScrollView with bottom padding for tab bar. */
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
};

export function AppScreen({
  children,
  scroll = false,
  contentContainerStyle,
}: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: appTheme.space.screenPadding,
    paddingBottom: appTheme.space.xxl + 8,
  },
  fill: {
    flex: 1,
  },
});
