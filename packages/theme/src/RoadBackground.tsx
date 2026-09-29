import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "./ThemeProvider";

/**
 * Full-bleed screen background: base surface color, a single faint lane-marking
 * divider low on the screen (the same dashed-line reference used once in
 * admin-web's table dividers — not scattered everywhere as decoration), and a
 * soft amber beacon glow in one corner. No image assets or SVG dependency —
 * built from plain Views so it drops into any screen with zero extra installs.
 *
 * Usage: wrap a screen's content — <RoadBackground><ScrollView>...</ScrollView></RoadBackground>
 */
export function RoadBackground({
  children,
  style,
  glow = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }, style]}>
      {glow && (
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              backgroundColor: theme.beacon,
              opacity: theme.mode === "dark" ? 0.16 : 0.1,
            },
          ]}
        />
      )}

      <View pointerEvents="none" style={styles.laneRow}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.laneDash,
              { backgroundColor: theme.mode === "dark" ? theme.border : theme.border },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: -140,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 320,
  },
  laneRow: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  laneDash: {
    width: 14,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
});
