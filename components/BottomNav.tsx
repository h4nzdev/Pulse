import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IoniconName } from "../constants/categories";
import { useTheme } from "../contexts/ThemeContext";

const TABS: Record<string, { icon: IoniconName; activeIcon: IoniconName; label: string }> = {
  index: { icon: "grid-outline", activeIcon: "grid", label: "Home" },
  modules: { icon: "apps-outline", activeIcon: "apps", label: "Modules" },
  add: { icon: "add", activeIcon: "add", label: "Add" },
  settings: { icon: "settings-outline", activeIcon: "settings", label: "Settings" },
  profile: { icon: "person-outline", activeIcon: "person", label: "Profile" },
};

function AddButton({ focused, onPress, color }: { focused: boolean; onPress: () => void; color: string }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.88))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
      style={styles.addWrap}
    >
      <Animated.View style={[styles.addButton, { backgroundColor: color }, style]}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Animated.View>
    </Pressable>
  );
}

export default function BottomNav({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name] ?? TABS.index;
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === "add") {
          return (
            <AddButton key={route.key} focused={focused} onPress={onPress} color={colors.primary} />
          );
        }

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tab}>
            <Ionicons
              name={focused ? tab.activeIcon : tab.icon}
              size={23}
              color={focused ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                {
                  color: focused ? colors.primary : colors.textMuted,
                  fontWeight: focused ? "700" : "500",
                },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10.5,
  },
  addWrap: {
    flex: 1,
    alignItems: "center",
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
