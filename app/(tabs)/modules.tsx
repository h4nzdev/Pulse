import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Header from "../../components/Header";
import { IoniconName } from "../../constants/categories";
import { useAlert } from "../../contexts/AlertContext";
import { ModuleFlags, useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";

interface ModuleDef {
  key: keyof ModuleFlags;
  title: string;
  description: string;
  icon: IoniconName;
  route: string;
}

const MODULES: ModuleDef[] = [
  {
    key: "folders",
    title: "Expense Folders",
    description: "Browse your spending organized in visual folders per category.",
    icon: "folder-open",
    route: "/folders",
  },
  {
    key: "todos",
    title: "Todo Lists",
    description: "Keep track of money tasks — bills to pay, things to buy.",
    icon: "checkbox",
    route: "/todos",
  },
  {
    key: "calendar",
    title: "Calendar",
    description: "Plan future expenses by tapping any day on the calendar.",
    icon: "calendar",
    route: "/calendar",
  },
  {
    key: "chatbot",
    title: "AI Chatbot",
    description: "Ask questions about your spending and get instant answers.",
    icon: "chatbubble-ellipses",
    route: "/chatbot",
  },
  {
    key: "recurring",
    title: "Recurring Expenses",
    description: "Rent, subscriptions, and bills log themselves each month.",
    icon: "repeat",
    route: "/recurring",
  },
  {
    key: "reports",
    title: "Reports & Export",
    description: "Monthly insights, trends, and CSV export of your data.",
    icon: "bar-chart",
    route: "/reports",
  },
];

export default function Modules() {
  const { colors } = useTheme();
  const { settings, toggleModule } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();

  const open = (mod: ModuleDef) => {
    if (!settings.modules[mod.key]) {
      showAlert({
        title: "Module disabled",
        message: `Enable "${mod.title}" with the switch to use it.`,
        type: "info",
      });
      return;
    }
    router.push(mod.route as any);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header title="Modules" subtitle="Add-ons to power up your tracking" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {MODULES.map((mod, i) => {
          const enabled = settings.modules[mod.key];
          return (
            <Animated.View key={mod.key} entering={FadeInDown.delay(i * 80).duration(400)}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => open(mod)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: enabled ? 1 : 0.55,
                  },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={mod.icon} size={26} color={colors.primary} />
                </View>
                <View style={styles.middle}>
                  <Text style={[styles.title, { color: colors.text }]}>{mod.title}</Text>
                  <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {mod.description}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={() => toggleModule(mod.key)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <Animated.View
          entering={FadeInDown.delay(MODULES.length * 80).duration(400)}
          style={[styles.hintCard, { backgroundColor: colors.primarySoft }]}
        >
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Tap a module to open it, or use the switch to enable and disable add-ons.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  middle: { flex: 1 },
  title: {
    fontSize: 15.5,
    fontWeight: "700",
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 3,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  hintText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
