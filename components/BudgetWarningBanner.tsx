import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../contexts/ThemeContext";

interface BudgetWarningBannerProps {
  level: "warning" | "danger";
  message: string;
  /** percent of budget used, e.g. 87 */
  percent: number;
}

/** Pulsing banner shown when spending nears or exceeds the budget. */
export default function BudgetWarningBanner({ level, message, percent }: BudgetWarningBannerProps) {
  const { colors } = useTheme();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.45, { duration: 750 }), -1, true);
  }, [pulse]);

  const iconStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const color = level === "danger" ? colors.danger : colors.warning;

  return (
    <View style={[styles.banner, { backgroundColor: `${color}1A`, borderColor: color }]}>
      <Animated.View style={iconStyle}>
        <Ionicons name="warning" size={20} color={color} />
      </Animated.View>
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{percent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
  },
});
