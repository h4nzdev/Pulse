import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import Header from "../../components/Header";
import { CATEGORIES } from "../../constants/categories";
import { useAlert } from "../../contexts/AlertContext";
import { useApp } from "../../contexts/AppContext";
import { useTheme } from "../../contexts/ThemeContext";
import { todayKey } from "../../utils/dates";
import { formatMoney } from "../../utils/format";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

export default function AddExpense() {
  const { colors, mode } = useTheme();
  const { profile, addExpense, monthTotal, categories } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [entryType, setEntryType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [details, setDetails] = useState("");
  const [saved, setSaved] = useState(false);

  const isIncome = entryType === "income";

  const currency = profile?.currency ?? "$";
  const amountScale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  const amountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }, { translateX: shakeX.value }],
  }));

  const haptic = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pressKey = (key: (typeof KEYS)[number]) => {
    haptic();
    amountScale.value = withSequence(withSpring(1.06, { damping: 20 }), withSpring(1));
    setAmount((prev) => {
      if (key === "back") return prev.slice(0, -1);
      if (key === "." && (prev.includes(".") || prev === "")) return prev;
      if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
      if (prev.replace(".", "").length >= 8) return prev;
      return prev + key;
    });
  };

  const save = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      shakeX.value = withSequence(
        withSpring(-10, { damping: 4, stiffness: 700 }),
        withSpring(10, { damping: 4, stiffness: 700 }),
        withSpring(0)
      );
      showAlert({
        title: "Enter an amount",
        message: "Type how much you spent using the keypad.",
        type: "warning",
      });
      return;
    }

    addExpense({
      amount: value,
      categoryId: isIncome ? "other" : categoryId,
      note: details.trim(),
      date: todayKey(),
      type: entryType,
    });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);

    const budget = profile?.monthlyBudget ?? 0;
    const newTotal = monthTotal + value;
    setTimeout(() => {
      setSaved(false);
      setAmount("");
      setDetails("");
      if (!isIncome && budget > 0 && newTotal > budget) {
        showAlert({
          title: "Over budget!",
          message: `This puts you ${formatMoney(newTotal - budget, currency)} over your monthly budget.`,
          type: "error",
        });
      } else {
        router.push("/(tabs)");
      }
    }, 1200);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Header
        title={isIncome ? "Add Money" : "Add Expense"}
        subtitle={isIncome ? "Log money coming in" : "Log what you just spent"}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Expense / Add money toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.surfaceAlt }]}>
          {(["expense", "income"] as const).map((t) => {
            const active = entryType === t;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  haptic();
                  setEntryType(t);
                }}
                style={[
                  styles.typeOption,
                  active && { backgroundColor: t === "income" ? colors.success : colors.primary },
                ]}
              >
                <Ionicons
                  name={t === "income" ? "trending-up" : "trending-down"}
                  size={15}
                  color={active ? "#FFFFFF" : colors.textSecondary}
                />
                <Text
                  style={{
                    color: active ? "#FFFFFF" : colors.textSecondary,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {t === "income" ? "Add Money" : "Expense"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Animated amount display */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.amountWrap}>
          <Animated.Text
            style={[
              styles.amount,
              {
                color: amount ? (isIncome ? colors.success : colors.text) : colors.textMuted,
              },
              amountStyle,
            ]}
          >
            {isIncome ? "+" : ""}
            {currency}
            {amount || "0"}
          </Animated.Text>
        </Animated.View>

        {/* Category chips (expenses only) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, isIncome && { display: "none" }]}
        >
          {categories.map((cat) => {
            const active = categoryId === cat.id;
            const catColor = mode === "dark" ? cat.colorDark : cat.color;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  haptic();
                  setCategoryId(cat.id);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? `${catColor}22` : colors.surface,
                    borderColor: active ? catColor : colors.border,
                  },
                ]}
              >
                <Ionicons name={cat.icon} size={15} color={active ? catColor : colors.textMuted} />
                <Text
                  style={{
                    color: active ? catColor : colors.textSecondary,
                    fontSize: 12.5,
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Details — the title of the expense */}
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder={
            isIncome
              ? "Details — where is it from? e.g. Allowance"
              : "Details — what was this for? e.g. Lunch"
          }
          placeholderTextColor={colors.textMuted}
          style={[
            styles.noteInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
        />

        {/* Keypad — 4 rows of 3 keys */}
        <View style={styles.keypad}>
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={styles.keyRow}>
              {KEYS.slice(row * 3, row * 3 + 3).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => pressKey(key)}
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: pressed ? colors.primarySoft : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {key === "back" ? (
                    <Ionicons name="backspace-outline" size={22} color={colors.text} />
                  ) : (
                    <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <Pressable
          onPress={save}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: isIncome ? colors.success : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} />
          <Text style={[styles.saveText, { color: colors.onPrimary }]}>
            {isIncome ? "Add money" : "Save expense"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Success overlay */}
      {saved && (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={[styles.successOverlay, { backgroundColor: colors.overlay }]}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            style={[styles.successCard, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={44} color="#FFFFFF" />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              {isIncome ? "Money added!" : "Saved!"}
            </Text>
            <Text
              style={[styles.successAmount, { color: isIncome ? colors.success : colors.primary }]}
            >
              {isIncome ? "+" : "-"}
              {formatMoney(parseFloat(amount) || 0, currency)}
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  amountWrap: {
    alignItems: "center",
    paddingVertical: 18,
  },
  amount: {
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2,
  },
  chips: {
    gap: 8,
    paddingBottom: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14.5,
    marginBottom: 16,
  },
  keypad: {
    gap: 10,
    marginBottom: 16,
  },
  keyRow: {
    flexDirection: "row",
    gap: 10,
  },
  key: {
    flex: 1,
    aspectRatio: 1.7,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 22,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  successCard: {
    alignItems: "center",
    padding: 32,
    borderRadius: 28,
    minWidth: 220,
  },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  successAmount: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
});
