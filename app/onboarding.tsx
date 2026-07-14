import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CURRENCIES } from "../constants/theme";
import { useAlert } from "../contexts/AlertContext";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatMoney } from "../utils/format";

export default function Onboarding() {
  const { colors } = useTheme();
  const { saveProfile } = useApp();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<string>("$");
  const [monthly, setMonthly] = useState("");
  const [weekly, setWeekly] = useState("");

  const monthlyNum = parseFloat(monthly) || 0;
  const suggestedWeekly = monthlyNum > 0 ? Math.round(monthlyNum / 4.33) : 0;

  const next = () => {
    if (step === 0 && !name.trim()) {
      showAlert({ title: "What's your name?", message: "Please enter your name to continue.", type: "warning" });
      return;
    }
    if (step === 1 && monthlyNum <= 0) {
      showAlert({ title: "Monthly budget needed", message: "Enter how much you plan to spend per month.", type: "warning" });
      return;
    }
    if (step < 2) {
      if (step === 1 && !weekly) setWeekly(String(suggestedWeekly));
      setStep(step + 1);
      return;
    }
    const weeklyNum = parseFloat(weekly) || suggestedWeekly;
    saveProfile({
      name: name.trim(),
      monthlyBudget: monthlyNum,
      weeklyBudget: weeklyNum,
      currency,
    });
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.flex, { backgroundColor: colors.bg }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <Image
            source={require("../assets/images/pulse.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Pulse</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Track spending. Stay on budget.
          </Text>
        </Animated.View>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i <= step ? colors.primary : colors.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {step === 0 && (
          <Animated.View entering={FadeInUp.duration(350)} key="step0">
            <Text style={[styles.question, { color: colors.text }]}>
              Hi there! What should we call you?
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
            />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Pick your currency
            </Text>
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[
                    styles.currencyChip,
                    {
                      backgroundColor: currency === c ? colors.primary : colors.surface,
                      borderColor: currency === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: currency === c ? colors.onPrimary : colors.text,
                      fontSize: 18,
                      fontWeight: "700",
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 1 && (
          <Animated.View entering={FadeInUp.duration(350)} key="step1">
            <Text style={[styles.question, { color: colors.text }]}>
              {"What's your monthly budget?"}
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {"We'll warn you when you're getting close to it."}
            </Text>
            <TextInput
              value={monthly}
              onChangeText={setMonthly}
              placeholder="e.g. 1500"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                styles.amountInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
            />
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInUp.duration(350)} key="step2">
            <Text style={[styles.question, { color: colors.text }]}>
              And a weekly budget?
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Based on your monthly budget, we suggest{" "}
              {formatMoney(suggestedWeekly, currency)}/week.
            </Text>
            <TextInput
              value={weekly}
              onChangeText={setWeekly}
              placeholder={String(suggestedWeekly)}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                styles.amountInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
            />
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={next}
          activeOpacity={0.85}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {step < 2 ? "Continue" : "Let's go!"}
          </Text>
          <Ionicons
            name={step < 2 ? "arrow-forward" : "checkmark"}
            size={19}
            color={colors.onPrimary}
          />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 26,
    marginBottom: 16,
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  question: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 8,
  },
  hint: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 14,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 18,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: "700",
  },
  currencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  currencyChip: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    marginTop: "auto",
  },
  buttonText: {
    fontSize: 16.5,
    fontWeight: "700",
  },
});
